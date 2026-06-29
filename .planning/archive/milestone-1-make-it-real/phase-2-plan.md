---
phase: 2
goal: "The two core logging flows read from and write to the database, with validation and proper states — no more in-memory seed data."
tasks: 3
waves: 2
---

# Phase 2: Owner & Mechanic flows go real

**Goal:** The owner service log and the mechanic job log both read from and write to Supabase via server actions — owner entries (with `place`) and mechanic jobs persist across refresh, every async view has loading/empty/error states, and EL/EN is preserved end-to-end. No more `t.seedLog` / `t.mechanicSeed` in-component arrays.

**Why this phase:** This is the demo's whole pitch — "it's real, not a mockup." Until the two logging flows actually persist to a database, the product is a static prototype. After this phase, an owner logs a service in Greek on their phone and it's still there tomorrow; a workshop clerk records a job against a plate and it lands in that vehicle's history.

---

## Task 1 — Service-log data layer (Zod schemas + server actions + read queries)

**Wave:** 1
**Persona:** backend
**Files:**
- `src/lib/service-log.ts` (create) — exports: server actions `logOwnerService(prevState, formData)`, `logMechanicJob(prevState, formData)`; read queries `getOwnerVehicleWithEntries()`, `getMechanicRecentEntries()`; localization helper `localizeService(canonical, lang)`; Zod schemas `ownerServiceSchema`, `mechanicJobSchema`.
- `src/lib/services.ts` (create) — exports `SERVICE_CODES: readonly string[]` (the 10 canonical English service-option strings, index-aligned with `t.serviceOptions`) and `localizeServiceCode(code, lang)`.
- `package.json` (modify) — add `zod` dependency.
**Depends on:** none

**Why:** This is the seam (per architecture.md §3 — adapters at seams) between the React UI and Supabase. Both UI tasks call into it; centralizing auth-verification, Zod validation, and the i18n-stable storage decision here means Task 2 and Task 3 never touch the Supabase client or trust client input directly. Without a stable canonical service code, a service logged in Greek would display untranslated when the user switches to English — breaking I18N-01.

**Acceptance Criteria:**
- Calling `logOwnerService` while signed out (no session) returns a validation/auth error and writes nothing — the action verifies the user with `getClaims()` server-side before any insert.
- A successfully logged owner service inserts one `service_entries` row with `kind = 'owner_log'`, `logged_by = auth.uid()`, the chosen service stored as a language-stable canonical code in `description`, the `place` text, and `service_date`.
- A successfully logged mechanic job inserts one `service_entries` row with `kind = 'workshop_job'`, resolving the typed plate to its `vehicles.id` (and erroring with a human message if the plate is unknown).
- `localizeService` / `localizeServiceCode` returns the Greek label when `lang = 'el'` and the English label when `lang = 'en'` for the same stored code — so history reads correctly in either language.

**Action:**
1. `npm i zod` (pin a 3.x version; verify it lands in `package.json` dependencies).
2. Create `src/lib/services.ts`. Define `SERVICE_CODES` as the 10 canonical English strings from `translations.en.serviceOptions` (Full service, Service & oil change, Brake replacement, Tyre change, Wheel alignment, Diagnostic check, MOT, Body & paint, Clutch replacement, Other) — these are the **stable storage values**. Export `localizeServiceCode(code: string, lang: Lang)`: find the index of `code` in `SERVICE_CODES`, return `translations[lang].serviceOptions[index]`; if not found, return `code` verbatim (forward-compatible).
3. Create `src/lib/service-log.ts` with `'use server'` at the top of the file (Server Actions path — `STACK.md §Server Actions`, lines 26-31). Import `createClient` from `@/lib/supabase/server` (async — `await createClient()`; built in Phase 1) and `z` from `zod`.
4. Define `ownerServiceSchema = z.object({ serviceCode: z.enum(SERVICE_CODES as [string, ...string[]]), place: z.string().trim().min(1).max(120), serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })`. Define `mechanicJobSchema` = same shape but `plate: z.string().trim().min(2).max(12).transform(s => s.toUpperCase())` instead of `place`.
5. In each server action: (a) `const supabase = await createClient()`; (b) `const { data: claims } = await supabase.auth.getClaims()` — if no claims/sub, return `{ ok: false, error: 'unauthenticated' }` (the UI maps this to a localized message); (c) parse `formData` with the Zod schema using `.safeParse`, returning `{ ok: false, error: 'invalid', issues }` on failure; (d) do the insert.
6. `logOwnerService`: resolve the signed-in owner's vehicle via `getOwnerVehicleWithEntries` logic (select the vehicle where `owner_id = auth.uid()`, take the demo vehicle), insert `{ vehicle_id, logged_by: sub, kind: 'owner_log', description: serviceCode, place, service_date }`. Then `revalidatePath('/')` (from `next/cache`). Return `{ ok: true }`.
7. `logMechanicJob`: look up `vehicles` by `plate` (uppercased). If none, return `{ ok: false, error: 'unknown_plate' }`. Insert `{ vehicle_id, logged_by: sub, kind: 'workshop_job', description: serviceCode, service_date }`. `revalidatePath('/mechanic')`. Return `{ ok: true, plate }` so the UI can show "Recorded to vehicle {plate}".
8. `getOwnerVehicleWithEntries()`: server function (NOT `'use server'`-callable from client — it's a read used by a Server Component). Verify user with `getClaims()`; select the owner's vehicle plus its `service_entries` ordered `service_date desc, created_at desc` (RLS scopes to the owner). Return `{ vehicle, entries }` or `null`.
9. `getMechanicRecentEntries()`: select the most recent `service_entries` where `logged_by = auth.uid()` (RLS already scopes), `kind = 'workshop_job'`, ordered newest-first, limit 20, joined to the vehicle plate. Return the list.
10. Reads must never use the service-role client — RLS does the scoping (constitution; `ARCHITECTURE.md §Schema + RLS`, the `svc_select` policy).

**Validation:** (builder self-check before commit)
- `grep -q '"zod"' package.json && echo OK` → `OK`
- `grep -c "getClaims" src/lib/service-log.ts` → `≥ 2` (every mutation verifies the user server-side)
- `grep -c "'use server'\|\"use server\"" src/lib/service-log.ts` → `≥ 1`
- `grep -c "service-role\|SERVICE_ROLE\|serviceRole" src/lib/service-log.ts` → `0` (reads/writes go through the RLS-scoped client, never the bypass key)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`

**Context:** Read @.planning/research/STACK.md @.planning/research/ARCHITECTURE.md @.planning/CONTEXT.md @src/lib/i18n.ts @src/lib/data.ts @.planning/PRODUCT.md
(Depends on Phase 1 artifact `src/lib/supabase/server.ts` — async `createClient`. Schema columns assumed from `ARCHITECTURE.md §Schema + RLS`: `service_entries(vehicle_id, logged_by, kind, description, place, service_date, created_at)`, `vehicles(id, owner_id, plate, make, model)`. If a column name differs from the Phase 1 migration, match the migration — it is authoritative.)

---

## Task 2 — Owner ServiceLog reads/writes the DB (+ `place` input, states)

**Wave:** 2
**Persona:** frontend
**Files:**
- `src/app/page.tsx` (modify) — make it an async Server Component that calls `getOwnerVehicleWithEntries()` and passes `{ vehicle, entries }` to `ServiceLog`; keep the `AppShell` wrapper.
- `src/components/ServiceLog.tsx` (modify) — remove `t.seedLog` seed (line 24) and `useState`-only persistence; accept server data as props; call `logOwnerService` via `useActionState`; add the `place` input; render loading/empty/error states.
- `src/lib/i18n.ts` (modify) — add EL+EN strings: `placeLabel`, `placeInputPlaceholder`, `emptyHistory`, `loadError`, `saving`, `savedConfirm`, `unauthError`.
**Depends on:** Task 1

**Why:** LOG-01/02/03/04 are the owner half of the demo's core pitch. Today `ServiceLog` resets on refresh (`useState`, `concerns.md`: "No persistence") and the form never captures `place` even though the model and history rendering support it (`concerns.md`: "Owner-side `ServiceLog` has no where/place input", `ServiceLog.tsx:54-68`, `:96-100`). Persisting the entry and adding `place` is what makes the owner flow real.

**Acceptance Criteria:**
- An owner picks a service type, a date, and types **where** it was done, taps Log, and the entry appears in the history immediately and is still there after a full page refresh (persisted to `service_entries`).
- The history list reads from the database sorted newest-first; switching EL/EN re-localizes the service label of each entry via `localizeServiceCode`.
- When the owner has no entries yet, the history shows the reassuring empty state ("No services logged yet — add the first one" / "Καμία καταγραφή ακόμα — πρόσθεσε την πρώτη", PRODUCT.md voice), not a blank list.
- A failed save (e.g. signed out) shows a human inline error in the active language, not a code or a red wall; the submit button shows a saving state while the action is pending.

**Action:**
1. `src/app/page.tsx`: convert to `export default async function Home()`; `const data = await getOwnerVehicleWithEntries();` render `<AppShell><ServiceLog vehicle={data?.vehicle ?? null} entries={data?.entries ?? []} /></AppShell>`. The async fetch in a Server Component is the loading boundary (Next streams it); pair with a sibling `loading.tsx` for the route if a skeleton is wanted (optional, but the empty/error states below are mandatory).
2. `ServiceLog.tsx` stays `"use client"` (it has a form + `ServiceSelect` state). Change its props to `{ vehicle: { model, plate } | null; entries: OwnerEntry[] }`. Delete the `seed`/`t.seedLog` line and the `added` local-merge; render the `entries` prop directly. Map each entry's stored `description` (a canonical code) through `localizeServiceCode(entry.description, lang)` for display; keep the existing timeline markup (lines 82-105) and the existing `place` rendering (lines 96-100).
3. Replace the in-form `addEntry` with `useActionState(logOwnerService, initialState)` (`STACK.md §Server Actions`, `useActionState` for pending UI). Wire `<form action={formAction}>`; submit `serviceCode` (the canonical `SERVICE_CODES[serviceIdx]`, NOT the localized label), `place`, `serviceDate` as hidden/named fields.
4. **Add the `place` input** between the ServiceSelect row and the submit button: an `<input>` using the exact existing input class (`rounded-lg border bg-surface-2 px-3 py-2.5 text-sm … focus:border-foreground focus:bg-surface` — DESIGN.md §5), `name="place"`, labelled with new `t.placeLabel`, placeholder `t.placeInputPlaceholder`. Reuse the existing `t.placePlaceholder` string if it fits, else add `placeInputPlaceholder`.
5. States: while `pending`, disable submit and show `t.saving`; on `state.error === 'unauthenticated'` show `t.unauthError`, on `'invalid'`/`'unknown'` show a generic localized message; on `state.ok` show the `savedConfirm` quiet confirmation (PRODUCT.md: "Recorded…", not "Success!"). Empty `entries` → render `t.emptyHistory` in place of the `<ol>`.
6. Add all new keys to BOTH `el` and `en` in `i18n.ts` (I18N-01 — a missing key is a TS error against the `Translation` type, so update the `Translation` type too).

**Validation:**
- `grep -c "seedLog" src/components/ServiceLog.tsx` → `0` (seed data removed from the component)
- `grep -c "logOwnerService\|useActionState" src/components/ServiceLog.tsx` → `≥ 1` (wired to the server action)
- `grep -c 'name="place"\|placeLabel' src/components/ServiceLog.tsx` → `≥ 1` (place input present)
- `grep -c "emptyHistory\|loadError" src/lib/i18n.ts` → `≥ 4` (new keys in both el and en + type)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0` (proves every new i18n key exists in both languages — missing translation is a compile error)

**Context:** Read @src/components/ServiceLog.tsx @src/app/page.tsx @src/lib/i18n.ts @src/lib/service-log.ts @src/lib/services.ts @.planning/DESIGN.md @.planning/PRODUCT.md @src/components/ServiceSelect.tsx

**Design:**
- Register: product
- Tokens used: `bg-surface`, `bg-surface-2`, `border`, `text-foreground`, `text-muted`, `text-positive` (saved), `text-negative` (error), `bg-accent-soft`; spacing `gap-2`/`px-3`/`py-2.5`, `rounded-lg`/`rounded-xl`; Geist Mono `tabular-nums` for dates/plate. No raw hex (DESIGN.md §10).
- Scope: page (owner service-log surface)
- Anti-pattern guard: builder runs `node /home/qualiasolutions/.claude/bin/slop-detect.mjs src/components/ServiceLog.tsx` pre-commit; commit blocked on critical findings.

---

## Task 3 — Mechanic MechanicLog reads/writes the DB (+ persisted "saved" confirmation, states)

**Wave:** 2
**Persona:** frontend
**Files:**
- `src/app/mechanic/page.tsx` (modify) — async Server Component calling `getMechanicRecentEntries()`, passing entries to `MechanicLog`.
- `src/components/MechanicLog.tsx` (modify) — remove `t.mechanicSeed` (line 28); accept server entries as props; call `logMechanicJob` via `useActionState`; the "saved" confirmation reflects the persisted row; loading/empty/error states.
- `src/lib/i18n.ts` (modify) — add EL+EN strings: `mechEmpty`, `mechLoadError`, `mechSaving`, `unknownPlateError` (reuse `recordedTo` for the persisted confirmation).
**Depends on:** Task 1
(Shares `src/lib/i18n.ts` with Task 2 — but writes DISJOINT keys. Serialized after Task 2 to avoid a write conflict on `i18n.ts`: Task 2 = owner keys, Task 3 = mechanic keys.)

**Why:** JOB-01/02/03 are the workshop half. Maria records a job 15× a day and "speed and a clear saved confirmation matter" (PRODUCT.md). Today the confirmation (`justAdded`, `MechanicLog.tsx:26,114-118`) is purely transient client state — it claims "Recorded to vehicle ΚΧΡ 412" without persisting anything. Wiring it to `logMechanicJob` makes the confirmation honest and lands the job in that vehicle's real history (JOB-02), visible to the owner from Task 2.

**Acceptance Criteria:**
- A mechanic types a plate, picks a job type and date, taps "Add to history", and a `service_entries` row with `kind = 'workshop_job'` persists; the recent-entries list updates and survives refresh.
- The "saved" confirmation ("Recorded to vehicle {plate}" / "Καταχωρήθηκε στο όχημα {plate}") appears only after the row actually persisted — not as optimistic-only client state.
- A job logged against the owner's plate (`ΚΧΡ 412`) appears in the owner's service history (Task 2) — one shared record, both sides of the counter.
- Typing an unknown plate shows a human, actionable error in the active language ("Add a plate before saving" pattern, PRODUCT.md voice), not a crash; the recent list shows the empty state when there are no jobs yet.

**Action:**
1. `src/app/mechanic/page.tsx`: convert to `export default async function MechanicPage()`; `const entries = await getMechanicRecentEntries();` render `<div className="min-h-screen bg-background"><MechanicLog entries={entries} /></div>`. Keep the existing `metadata` export.
2. `MechanicLog.tsx` stays `"use client"`. Change props to `{ entries: MechanicEntry[] }`. Delete `t.mechanicSeed`/`seed` (line 28) and the `added` merge; render the `entries` prop. Map each entry's `description` through `localizeServiceCode(entry.description, lang)` for the work label; keep the existing row markup (lines 124-135) showing localized work + mono plate + date.
3. Replace `addEntry` + `justAdded`/`setTimeout` with `useActionState(logMechanicJob, initialState)`. `<form action={formAction}>`; named fields `plate`, `serviceCode` (canonical `SERVICE_CODES[serviceIdx]`), `serviceDate`. On `state.ok` show the confirmation using `t.recordedTo(state.plate)` (now backed by a real insert); on `state.error === 'unknown_plate'` show `t.unknownPlateError`; while `pending` show `t.mechSaving` and disable submit.
4. Empty `entries` → render `t.mechEmpty` in place of the `<ul>`. The async fetch in the page Server Component is the load boundary; on a query error the page should surface `t.mechLoadError` (wrap the read or use an `error.tsx` for `/mechanic`).
5. Add the new keys to BOTH `el` and `en` and the `Translation` type in `i18n.ts` (I18N-01).

**Validation:**
- `grep -c "mechanicSeed" src/components/MechanicLog.tsx` → `0` (seed removed)
- `grep -c "logMechanicJob\|useActionState" src/components/MechanicLog.tsx` → `≥ 1` (wired to the action)
- `grep -c "setTimeout" src/components/MechanicLog.tsx` → `0` (transient fake confirmation removed; confirmation now reflects persistence)
- `grep -c "mechEmpty\|unknownPlateError" src/lib/i18n.ts` → `≥ 4` (new keys in both languages + type)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`

**Context:** Read @src/components/MechanicLog.tsx @src/app/mechanic/page.tsx @src/lib/i18n.ts @src/lib/service-log.ts @src/lib/services.ts @.planning/DESIGN.md @.planning/PRODUCT.md @src/components/ServiceSelect.tsx

**Design:**
- Register: product
- Tokens used: `bg-surface`, `bg-surface-2`, `border`, `text-foreground`, `text-muted`, `text-positive` + `bg-positive/10` (saved confirmation), `text-negative` (error); `rounded-lg`/`rounded-xl`; Geist Mono `tracking-wider tabular-nums` for plate/date. No raw hex (DESIGN.md §10).
- Scope: page (mechanic job-log surface)
- Anti-pattern guard: builder runs `node /home/qualiasolutions/.claude/bin/slop-detect.mjs src/components/MechanicLog.tsx` pre-commit; commit blocked on critical findings.

---

## Success Criteria

Phase-level truths — what must be observable when this phase is done.

- [ ] An owner logs a service (type + date + **place**); it persists to `service_entries` (`kind = owner_log`) and survives a full refresh. (LOG-01, LOG-02)
- [ ] The owner's service history reads from the database, sorted newest-first, with localized service labels in EL and EN. (LOG-03, I18N-01)
- [ ] Every async owner/mechanic view has loading, empty, and error states in both languages. (LOG-04, JOB-03)
- [ ] A mechanic logs a job against a plate; it persists (`kind = workshop_job`) and appears in that vehicle's history — including the owner's view of the same vehicle. (JOB-01, JOB-02)
- [ ] The mechanic "saved" confirmation reflects the persisted row (no transient-only fake), reading recent entries from the DB. (JOB-03)
- [ ] Every mutation goes through a `'use server'` action in `src/lib/service-log.ts`, verifies the user with `getClaims()` server-side, and is Zod-validated; reads are RLS-scoped (no service-role key). (success criterion 4)
- [ ] No `t.seedLog` / `t.mechanicSeed` in-component arrays remain wired into the rendered logs.

## Verification Contract

Machine-executable checks the verifier runs verbatim. One+ per task.

### Contract for Task 1 — data layer exists
**Check type:** file-exists
**Command:** `test -f src/lib/service-log.ts && test -f src/lib/services.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Either file is missing.

### Contract for Task 1 — server-side auth in every mutation
**Check type:** grep-match
**Command:** `grep -c "getClaims" src/lib/service-log.ts`
**Expected:** `≥ 2`
**Fail if:** `< 2` — a mutation trusts the client instead of verifying the user server-side.

### Contract for Task 1 — Server Action directive + zod dependency
**Check type:** command-exit
**Command:** `grep -q "use server" src/lib/service-log.ts && grep -q '"zod"' package.json && echo OK`
**Expected:** `OK`
**Fail if:** No `'use server'` directive, or `zod` not installed.

### Contract for Task 1 — no service-role bypass in the data layer
**Check type:** grep-match
**Command:** `grep -c "SERVICE_ROLE\|service-role\|serviceRole" src/lib/service-log.ts`
**Expected:** `0`
**Fail if:** `> 0` — reads/writes must be RLS-scoped, not run through the bypass key.

### Contract for Task 2 — owner log wired, seed removed, place added
**Check type:** command-exit
**Command:** `grep -q "logOwnerService" src/components/ServiceLog.tsx && [ "$(grep -c 'seedLog' src/components/ServiceLog.tsx)" -eq 0 ] && grep -Eq 'name="place"|placeLabel' src/components/ServiceLog.tsx && echo OK`
**Expected:** `OK`
**Fail if:** Action not called, seed still present, or no `place` input.

### Contract for Task 2 — owner page is a server component reading the DB
**Check type:** grep-match
**Command:** `grep -c "getOwnerVehicleWithEntries" src/app/page.tsx`
**Expected:** `≥ 1`
**Fail if:** `0` — the page does not fetch persisted entries.

### Contract for Task 3 — mechanic log wired, seed + fake confirmation removed
**Check type:** command-exit
**Command:** `grep -q "logMechanicJob" src/components/MechanicLog.tsx && [ "$(grep -c 'mechanicSeed' src/components/MechanicLog.tsx)" -eq 0 ] && [ "$(grep -c 'setTimeout' src/components/MechanicLog.tsx)" -eq 0 ] && echo OK`
**Expected:** `OK`
**Fail if:** Action not called, seed still present, or transient `setTimeout` confirmation still there.

### Contract for Task 3 — mechanic page is a server component reading the DB
**Check type:** grep-match
**Command:** `grep -c "getMechanicRecentEntries" src/app/mechanic/page.tsx`
**Expected:** `≥ 1`
**Fail if:** `0` — the page does not fetch persisted recent entries.

### Contract for Tasks 2 & 3 — bilingual keys present, project compiles
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any error — a non-zero count includes the case where a new i18n key is missing from `el` or `en` (the `Translation` type makes a missing translation a compile error — I18N-01).

### Contract for Phase 2 — both sides write one shared record (behavioral)
**Check type:** behavioral
**Command:** (manual verification by verifier) Sign in as the seeded mechanic, log a job against plate `ΚΧΡ 412`; sign in as the seeded owner of that vehicle and open the service log.
**Expected:** The job logged by the mechanic appears in the owner's service history, newest-first, with the correct localized service label. Refresh the owner page — the entry persists.
**Fail if:** The mechanic's job does not appear in the owner's history, or it disappears on refresh.
