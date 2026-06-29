---
phase: 2
goal: "A signed-in owner can view/edit their profile (name, phone), perform full vehicle CRUD (add/edit/remove with confirmation), switch the active vehicle to scope the log, and reach all three from a real /settings page wired to the sidebar — bilingual, all states handled."
tasks: 4
waves: 2
---

# Phase 2: Profile, Vehicles & Settings Surface

**Goal:** A signed-in owner can view and edit their profile (name, phone), perform full CRUD on their vehicles (add / edit / remove with confirmation), switch the active vehicle to scope the service log, and reach all three capabilities from a real `/settings` page wired to the sidebar `settings` nav — with all strings bilingual and all states (loading, empty, error, confirm) handled.

**Why this phase:** Turns the seeded-account assumption into a real self-service account surface — the last gap before M3 (Accounts & Settings) can close. Covers ACCT-04..10.

---

## Task 1 — Migration 0008 + profile & vehicle data seam
**Wave:** 1
**Persona:** backend
**Files:**
- `supabase/migrations/0008_profile_vehicle_fields.sql` (CREATE — DDL only; operator applies via Supabase MCP, builder writes the `.sql`)
- `src/lib/profile-actions.ts` (CREATE — exports `getProfile`, `updateProfile`, type `ProfileData`, type `ProfileState`)
- `src/lib/owner-actions.ts` (MODIFY — add `year` to `OwnerVehicle` type + `getVehicles` select + `vehicleSchema`; add `updateVehicle`, `removeVehicle` server actions)
**Depends on:** none

**Why:** ACCT-04/05 (profile edit persists) and ACCT-06/07/08 (vehicle add/edit/remove) need a real data layer + the two missing columns (`profiles.phone`, `vehicles.year`) and a DELETE policy before any UI can call them. This is the only file that knows the table shapes, so it lands first and alone.

**Acceptance Criteria:**
- A new migration `0008_profile_vehicle_fields.sql` adds `profiles.phone` (`text`, nullable), `vehicles.year` (`int`, nullable), and a `vehicles_delete` RLS policy so an owner can remove a vehicle (demo-permissive, matching 0005's `using (true)` style).
- `getProfile()` returns the current user's `{ full_name, phone }` from `profiles` (or `null` when signed out); `updateProfile` Zod-validates name (min 1, max 80) + phone (optional, max 20) and writes via the existing `profiles_update_own` RLS policy.
- `updateVehicle` Zod-validates `{ id (uuid), model (1..80), plate (1..20, normalized), year (optional int 1900..2030) }` and updates the row; `removeVehicle` validates `{ id (uuid) }` and deletes the row. Both `revalidatePath("/")` and `revalidatePath("/settings")`.
- `getVehicles()` now selects and returns `year` on each `OwnerVehicle`.

**Action:**
1. Write `0008_profile_vehicle_fields.sql`:
   ```sql
   alter table public.profiles add column if not exists phone text;
   alter table public.vehicles add column if not exists year int;
   -- demo-permissive delete (matches 0005 "demo_*" using(true) style; vehicles are anonymous in the demo)
   create policy "demo_vehicles_delete" on public.vehicles for delete using (true);
   ```
   (No `owner_id`-scoped delete: vehicles are created anonymously in this demo — `owner_id` is nullable since 0004 and the 0005 demo policies are all `using (true)`. A scoped delete would silently fail for anonymous rows. Match the existing permissive demo posture.)
2. In `owner-actions.ts`: add `year: number | null` to the `OwnerVehicle` type; add `year` to the `getVehicles()` `.select(...)`; extend `vehicleSchema` is NOT reused for edit — instead add `vehicleEditSchema = z.object({ id: z.string().uuid(), model: z.string().trim().min(1).max(80), plate: z.string().trim().min(1).max(20).transform(normalizePlate), year: z.coerce.number().int().min(1900).max(2030).optional() })` and `vehicleRemoveSchema = z.object({ id: z.string().uuid() })`. (Leave the existing add-form `vehicleSchema` and `addVehicle` as-is — `year` on add is optional and out of this task's add path; the edit form carries it.)
3. Add `updateVehicle(_prev: VehicleState, formData)` and `removeVehicle(_prev: VehicleState, formData)` server actions in `owner-actions.ts`, mirroring `addVehicle`'s `useActionState` shape (`{ ok, error }`). `updateVehicle` does `supabase.from("vehicles").update({ model, plate, year: year ?? null }).eq("id", id)`; `removeVehicle` does `.delete().eq("id", id)`. Both `revalidatePath("/")` and `revalidatePath("/settings")`, return `{ ok: false, error: "save" }` on DB error.
4. Create `src/lib/profile-actions.ts` (`"use server"`): `getProfile()` reads `getUser()`; if null return `null`; else `supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle()` → return `{ full_name, phone }`. Export `type ProfileState = { ok: boolean; error: string | null }`. `updateProfile(_prev, formData)` Zod-validates `{ full_name: z.string().trim().min(1).max(80), phone: z.string().trim().max(20).optional().or(z.literal("")) }`, requires a session (`if (!user) return { ok:false, error:"save" }`), updates `profiles` by `id = user.id`, `revalidatePath("/settings")`.

**Validation:** (builder self-check)
- `npx tsc --noEmit` → exits 0 (no error lines)
- `grep -c "updateVehicle\|removeVehicle" src/lib/owner-actions.ts` → ≥ 2
- `grep -c "updateProfile\|getProfile" src/lib/profile-actions.ts` → ≥ 2
- `grep -c "demo_vehicles_delete\|add column if not exists phone\|add column if not exists year" supabase/migrations/0008_profile_vehicle_fields.sql` → 3

**Context:** Read @src/lib/owner-actions.ts @src/lib/session.ts @src/lib/plate.ts @supabase/migrations/0001_init_schema.sql @supabase/migrations/0004_demo_no_login_public_access.sql @supabase/migrations/0005_demo_public_all_roles.sql @.planning/PROJECT.md

---

## Task 2 — Bilingual i18n keys for settings, profile, vehicle CRUD
**Wave:** 1
**Persona:** frontend
**Files:**
- `src/lib/i18n.ts` (MODIFY — add new keys to the `Translation` type and to BOTH `el` and `en` dictionaries)
**Depends on:** none

**Why:** A missing translation is a TypeScript compile error in this codebase (`Translation` is a strict type both dictionaries must satisfy). Adding every Phase-2 key up front in one independent file lets T3 (UI) consume `t.*` without inventing strings or breaking the build. ACCT-10 requires bilingual settings surfaces.

**Acceptance Criteria:**
- The `Translation` type and both `el` + `en` dictionaries gain identical keys: `profileSection`, `vehiclesSection`, `securitySection`, `settingsPageSubtitle`, `nameLabel2` (display name on profile — see note), `phoneLabel`, `phonePlaceholder`, `saveProfile`, `profileSaved`, `editVehicle`, `removeVehicle`, `confirmRemove`, `confirmRemoveHint`, `yearLabel`, `yearPlaceholder`, `changePassword`, `newPassword`, `confirmPassword`, `passwordChanged`, `settingsSignedOut`, `settingsSignedOutHint`, `saving`.
- `npx tsc --noEmit` exits 0 — proving both dictionaries satisfy the type.
- Greek values are real translations (not English placeholders), matching the existing register (e.g. `securitySection` EL: "Ασφάλεια", `confirmRemove` EL: "Είσαι σίγουρος;").

**Action:**
1. Add each key above to the `Translation` type (all `string`).
   - NOTE on `nameLabel2`: `nameLabel` already exists ("Full name" / "Ονοματεπώνυμο") and is used by the workshop registration form — reuse `nameLabel` for the profile display-name label rather than adding a duplicate. **Do NOT add `nameLabel2`** — drop it from the list and use the existing `nameLabel`. (Listed here so you don't accidentally collide.)
2. Add EL + EN values for the remaining keys. Suggested EL/EN pairs: `securitySection` "Ασφάλεια"/"Security", `profileSection` "Προφίλ"/"Profile", `vehiclesSection` "Οχήματα"/"Vehicles", `saveProfile` "Αποθήκευση προφίλ"/"Save profile", `profileSaved` "Το προφίλ αποθηκεύτηκε"/"Profile saved", `editVehicle` "Επεξεργασία"/"Edit", `removeVehicle` "Αφαίρεση"/"Remove", `confirmRemove` "Είσαι σίγουρος;"/"Are you sure?", `confirmRemoveHint` "Το όχημα θα διαγραφεί οριστικά."/"This vehicle will be permanently deleted.", `phoneLabel` "Τηλέφωνο"/"Phone", `phonePlaceholder` "π.χ. 99 123456"/"e.g. 99 123456", `yearLabel` "Έτος"/"Year", `yearPlaceholder` "π.χ. 2019"/"e.g. 2019", `changePassword` "Αλλαγή κωδικού"/"Change password", `newPassword` "Νέος κωδικός"/"New password", `confirmPassword` "Επιβεβαίωση κωδικού"/"Confirm password", `passwordChanged` "Ο κωδικός άλλαξε"/"Password changed", `settingsSignedOut` "Συνδέσου για να δεις τις ρυθμίσεις σου"/"Sign in to see your settings", `settingsSignedOutHint` "Χρειάζεται λογαριασμός για προφίλ και ασφάλεια."/"An account is needed for profile and security.", `settingsPageSubtitle` "Διαχειρίσου το προφίλ, τα οχήματα και την ασφάλειά σου."/"Manage your profile, vehicles and security.", `saving` "Αποθήκευση…"/"Saving…".

**Validation:** (builder self-check)
- `npx tsc --noEmit` → exits 0
- `grep -c "securitySection\|profileSection\|confirmRemove\|passwordChanged" src/lib/i18n.ts` → ≥ 8 (each key appears in both type + 2 dicts; ≥ 8 covers the 4 sampled keys × ≥2 occurrences)

**Context:** Read @src/lib/i18n.ts

**Design:**
- Register: product
- Tokens used: n/a (string dictionary, no JSX) — but strings must respect the existing bilingual convention (no hardcoded UI text elsewhere)
- Scope: app
- Anti-pattern guard: every new key present in BOTH `el` and `en`; Greek is the primary language and must be real Greek, not transliteration.

---

## Task 3 — Real /settings route: Profile, Vehicles, Security panels + sidebar wiring
**Wave:** 2
**Persona:** frontend
**Files:**
- `src/app/settings/page.tsx` (CREATE — server component; fetches profile + vehicles, renders `<SettingsClient>`)
- `src/components/SettingsClient.tsx` (CREATE — client component with three sections: Profile / Vehicles / Security)
- `src/components/AppShell.tsx` (MODIFY — the `settings` nav branch navigates to `/settings` instead of rendering the inline `SettingsPanel`; remove the now-dead `SettingsPanel` inline component or replace its body with a `redirect`/`Link` to `/settings`)
- `src/components/Sidebar.tsx` (MODIFY only if needed — keep `onSelect` but make the `settings` item route to `/settings`)
**Depends on:** Task 1 (consumes `getProfile`/`updateProfile`/`getVehicles`/`updateVehicle`/`removeVehicle`), Task 2 (consumes new `t.*` keys)

**Why:** ACCT-04/05/07/08/10 — the settings nav currently renders a stub `SettingsPanel` (language + about + sign-in). This task delivers the real three-panel surface (Profile edit, full Vehicle CRUD with confirm dialog, in-settings password change reusing the existing `changePassword`) and makes the sidebar `settings` item reach it.

**Acceptance Criteria:**
- Clicking "Settings" in the sidebar navigates to `/settings` (a real route, mirroring `/admin`'s server-component pattern), NOT the inline stub.
- Signed-out: `/settings` renders a bilingual sign-in prompt (`t.settingsSignedOut` + a `Link` to `/login`). Signed-in: renders Profile / Vehicles / Security sections with the user's data.
- Profile section: editing display name (`t.nameLabel`) or phone (`t.phoneLabel`) and saving calls `updateProfile`; on `ok` shows `t.profileSaved`; the saved name persists after a hard refresh (RLS-backed write).
- Vehicles section: each vehicle row shows model + plate + year and has Edit + Remove. "Edit" reveals an inline form pre-filled with model/plate/year that saves via `updateVehicle`. "Remove" opens a bilingual confirm dialog (`t.confirmRemove` + `t.confirmRemoveHint`, Cancel + Remove buttons); confirming calls `removeVehicle` and the row disappears.
- Security section: a two-field form (`t.newPassword` + `t.confirmPassword`) calls the existing `changePassword` action; `ok` shows `t.passwordChanged`; a mismatch/error shows the bilingual error.
- Every interactive control is keyboard-accessible with labels; loading (`t.saving`), error (`t.errSave`), and empty (`t.historyEmpty`) states are present.

**Action:**
1. `src/app/settings/page.tsx` (server): `import { getProfile } from "@/lib/profile-actions"`, `import { getVehicles } from "@/lib/owner-actions"`. `const profile = await getProfile(); const vehicles = await getVehicles();` Render inside the existing app chrome — simplest: a `<main>` matching `/admin`'s container (`min-h-screen bg-background px-4 py-8`) with a header, OR render `<AppShell>` with a settings child. Given AppShell's internal nav state, prefer a standalone `<main>` like `/admin` plus a back `Link` to `/`. Pass `profile`, `vehicles` to `<SettingsClient>`.
2. `src/components/SettingsClient.tsx` (`"use client"`): three sections using existing card patterns (`rounded-xl border bg-surface p-4/5`), inputs (`rounded-lg border bg-surface-2 px-3 py-2.5 text-sm focus:border-foreground focus:bg-surface`), primary button (`rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-surface`). Use `useActionState` for each form: `updateProfile`, `updateVehicle`, `removeVehicle`, `changePassword`. The remove-confirm dialog is a controlled `useState` overlay (reuse the `popIn`/`sheetUp` motion + `shadow-[0_16px_50px_-12px_rgba(0,0,0,0.28)]` from DESIGN). Use `<Icon name="…" />` glyphs only. All text via `t.*`.
3. If `profile === null` (signed out): render the `t.settingsSignedOut` card with a `Link href="/login"`. Do not fetch/show profile or security forms.
4. In `AppShell.tsx`: change the `settings` branch so selecting it routes to `/settings`. Cleanest: in `select()`, if `key === "settings"` call `router.push("/settings")` (import `useRouter` from `next/navigation`) and return early; otherwise keep `setActive`. Delete the dead inline `SettingsPanel` function (or leave only `VehiclesPanel`). Keep `LanguageToggle`/About reachable inside `/settings` if you want parity — but the real three panels are the deliverable.
5. Validate the remove confirm: confirming triggers `removeVehicle`; on `ok` the revalidated `/settings` list (from Task 1's `revalidatePath("/settings")`) no longer contains the row.

**Validation:** (builder self-check)
- `npx tsc --noEmit` → exits 0
- `grep -c "updateProfile\|updateVehicle\|removeVehicle\|changePassword" src/components/SettingsClient.tsx` → ≥ 4
- `grep -c "settings" src/components/AppShell.tsx` → ≥ 1 AND `grep -c "useRouter\|/settings" src/components/AppShell.tsx` → ≥ 1
- `grep -c "confirmRemove\|settingsSignedOut" src/components/SettingsClient.tsx` → ≥ 2
- `grep -c "TODO\|FIXME\|placeholder" src/app/settings/page.tsx src/components/SettingsClient.tsx` → 0

**Context:** Read @src/components/AppShell.tsx @src/components/Sidebar.tsx @src/app/admin/page.tsx @src/lib/account-actions.ts @src/components/ServiceLog.tsx @.planning/DESIGN.md @src/lib/i18n.ts

**Design:**
- Register: product
- Tokens used: `bg-surface`, `bg-surface-2`, `text-muted`, `text-foreground`, `bg-accent`, `text-surface`, `bg-positive/10`, `text-positive`, `bg-negative/10`, `text-negative`, `border`, `rounded-xl`, `rounded-lg`
- Scope: page
- Anti-pattern guard: no raw hex / default-palette colors in JSX (only semantic tokens); no hardcoded UI text (every string via `t.*`); no native `<select>` where `ServiceSelect` fits; all controls keep labels + keyboard + focus; loading/error/empty/confirm states present. Builder runs `node bin/slop-detect.mjs src/components/SettingsClient.tsx` pre-commit if the script exists; commit blocked on critical findings.

---

## Task 4 — Active-vehicle switcher scoped by `?v=` searchParam
**Wave:** 2
**Persona:** frontend
**Files:**
- `src/app/page.tsx` (MODIFY — read `searchParams.v` to hydrate the active vehicle's entries server-side)
- `src/components/ServiceLog.tsx` (MODIFY — initialize `selectedId` from a new `activeVehicleId` prop; on vehicle switch push `?v={id}`; surface `year` in the vehicle hero; pass `year` through to the add path if present)
- `src/components/AppShell.tsx` (MODIFY — accept + thread the active vehicle if needed; **only** if `page.tsx` cannot pass `activeVehicleId` directly to `ServiceLog` — verify before editing)
**Depends on:** Task 1 (consumes `getVehicles` `year` field + `getEntries`)

**Why:** ACCT-09 — an owner with 2+ vehicles must switch the active vehicle and have the log + history scope to it, persisting across reload. The build note specifies a URL-param approach (`?v={id}`) read in `page.tsx` to avoid a client-state rewrite and a hydration mismatch (no localStorage).

**Acceptance Criteria:**
- `page.tsx` reads `searchParams` (`?v={id}`); when present and valid it hydrates `getEntries(v)` for that vehicle and passes `activeVehicleId={v}` to `ServiceLog`; when absent it defaults to the newest vehicle (current behavior preserved).
- In `ServiceLog`, switching the vehicle via the existing pill switcher updates the URL to `?v={id}` (so a reload keeps the same active vehicle) AND swaps the history (existing `getEntries` transition still works).
- The active vehicle persists across a hard page reload (the `?v=` param survives, `page.tsx` re-hydrates the correct entries).
- The vehicle hero shows `year` when present (e.g. "VW Golf · 2019") using the new `OwnerVehicle.year` field; absence renders cleanly (no "null").

**Action:**
1. In `src/app/page.tsx`: Next 16 — `searchParams` is a Promise; signature `export default async function Home({ searchParams }: { searchParams: Promise<{ v?: string }> })`, then `const { v } = await searchParams;`. Compute `const activeId = v && vehicles.some(x => x.id === v) ? v : (vehicles[0]?.id ?? null);` and `const entries = activeId ? await getEntries(activeId) : [];`. Pass `activeVehicleId={activeId}` to `<ServiceLog>`. (Verify the exact Next 16 `searchParams` Promise shape against `node_modules/next/dist/docs/` per AGENTS.md before writing.)
2. In `ServiceLog.tsx`: add prop `activeVehicleId?: string | null`; initialize `useState(activeVehicleId ?? vehicles[0]?.id ?? null)`. In `switchVehicle(id)`, after `setSelectedId(id)`, push the param: `import { useRouter, useSearchParams } from "next/navigation"`; `router.push(\`/?v=${id}\`, { scroll: false })` (keep the existing `getEntries` transition for instant swap — the URL push is for reload-persistence). Render `selectedVehicle?.year` in the hero next to model when truthy.
3. Verify whether `AppShell` must thread `activeVehicleId`: `page.tsx` passes `<ServiceLog>` as `children` to `<AppShell>` — so `activeVehicleId` is set on `<ServiceLog>` directly in `page.tsx`, NOT through AppShell. Confirm AppShell needs no change for the switcher; only edit it if the read proves otherwise.

**Validation:** (builder self-check)
- `npx tsc --noEmit` → exits 0
- `grep -c "searchParams\|activeVehicleId" src/app/page.tsx` → ≥ 2
- `grep -c "activeVehicleId\|router.push\|useRouter" src/components/ServiceLog.tsx` → ≥ 2
- `grep -c "\.year" src/components/ServiceLog.tsx` → ≥ 1

**Context:** Read @src/app/page.tsx @src/components/ServiceLog.tsx @src/components/AppShell.tsx @src/lib/owner-actions.ts @AGENTS.md

**Design:**
- Register: product
- Tokens used: `bg-accent`, `text-surface`, `border`, `text-foreground`, `text-muted`, `font-mono`, `rounded-full`
- Scope: component
- Anti-pattern guard: no raw hex / default-palette colors; switcher pills keep `aria-pressed` + keyboard; no hardcoded text; year renders via token classes, no inline color. Builder runs `node bin/slop-detect.mjs src/components/ServiceLog.tsx` pre-commit if the script exists; commit blocked on critical findings.

---

## Success Criteria
- [ ] Clicking "Settings" in the sidebar opens a real `/settings` page with Profile / Vehicles / Security sections; signed-out shows a sign-in prompt, signed-in shows the user's data. (ACCT-10)
- [ ] Editing display name or phone and saving persists to `profiles` (via `profiles_update_own` RLS) and survives a hard refresh. (ACCT-04, ACCT-05)
- [ ] An owner can add, edit (model/plate/year inline), and remove (with a bilingual confirm dialog) vehicles; removed vehicles disappear from the list. (ACCT-06, ACCT-07, ACCT-08)
- [ ] An owner with 2+ vehicles can switch the active vehicle; the log + history scope to it and the choice persists across a reload via `?v=`. (ACCT-09)
- [ ] The Security section changes the password via the existing `changePassword` action with bilingual success/error. (ACCT-03 surface / ACCT-10)
- [ ] `npx tsc --noEmit` exits 0; no `TODO`/`FIXME`/placeholder in touched files; every new i18n key present in both `el` and `en`.

---

## Verification Contract

### Contract for Task 1 — migration file
**Check type:** grep-match
**Command:** `grep -c "add column if not exists phone\|add column if not exists year\|demo_vehicles_delete" supabase/migrations/0008_profile_vehicle_fields.sql`
**Expected:** `3`
**Fail if:** Returns < 3 — a required column or the delete policy is missing.

### Contract for Task 1 — vehicle CRUD actions
**Check type:** grep-match
**Command:** `grep -c "export async function updateVehicle\|export async function removeVehicle" src/lib/owner-actions.ts`
**Expected:** Non-zero (≥ 2)
**Fail if:** Returns < 2 — edit or remove action missing.

### Contract for Task 1 — profile data seam
**Check type:** grep-match
**Command:** `grep -c "export async function getProfile\|export async function updateProfile" src/lib/profile-actions.ts`
**Expected:** Non-zero (≥ 2)
**Fail if:** Returns < 2 — profile read or write action missing.

### Contract for Task 1 — year on OwnerVehicle
**Check type:** grep-match
**Command:** `grep -c "year" src/lib/owner-actions.ts`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — `year` not added to the vehicle type/select.

### Contract for Task 2 — bilingual keys compile
**Check type:** command-exit
**Command:** `npx tsc --noEmit`
**Expected:** exit 0
**Fail if:** Any `error TS` — a new key is missing from `el` or `en` (the `Translation` type is unsatisfied).

### Contract for Task 2 — new keys present
**Check type:** grep-match
**Command:** `grep -c "securitySection\|profileSection\|confirmRemove\|passwordChanged\|settingsSignedOut" src/lib/i18n.ts`
**Expected:** Non-zero (≥ 10) — five sampled keys × (type + el + en)
**Fail if:** Returns < 10 — a sampled key is not in all three places.

### Contract for Task 3 — settings route exists
**Check type:** file-exists
**Command:** `test -f src/app/settings/page.tsx && test -f src/components/SettingsClient.tsx && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Either file missing.

### Contract for Task 3 — three panels wired to actions
**Check type:** grep-match
**Command:** `grep -c "updateProfile\|updateVehicle\|removeVehicle\|changePassword" src/components/SettingsClient.tsx`
**Expected:** Non-zero (≥ 4)
**Fail if:** Returns < 4 — a panel's server action is not wired in.

### Contract for Task 3 — sidebar nav reaches /settings
**Check type:** grep-match
**Command:** `grep -c "/settings\|useRouter" src/components/AppShell.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — the settings nav still renders the inline stub.

### Contract for Task 3 — no stubs in new files
**Check type:** grep-match
**Command:** `grep -c "TODO\|FIXME\|placeholder\|not implemented" src/app/settings/page.tsx src/components/SettingsClient.tsx`
**Expected:** `0`
**Fail if:** Non-zero — unfinished work shipped.

### Contract for Task 4 — searchParam scoping in page
**Check type:** grep-match
**Command:** `grep -c "searchParams\|activeVehicleId" src/app/page.tsx`
**Expected:** Non-zero (≥ 2)
**Fail if:** Returns < 2 — the active-vehicle param is not read/hydrated.

### Contract for Task 4 — switcher pushes URL param
**Check type:** grep-match
**Command:** `grep -c "router.push\|activeVehicleId" src/components/ServiceLog.tsx`
**Expected:** Non-zero (≥ 2)
**Fail if:** Returns < 2 — switching the vehicle doesn't persist via `?v=`.

### Contract for whole phase — compiles clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit`
**Expected:** exit 0
**Fail if:** Any `error TS`.

### Contract for whole phase — settings reachable (behavioral)
**Check type:** behavioral
**Command:** (verifier QA: `npm run dev`, sign in, click Settings)
**Expected:** `/settings` shows Profile / Vehicles / Security; profile save persists across refresh; a vehicle can be edited and removed (with confirm); password change succeeds; switching the active vehicle scopes the log and survives a reload.
**Fail if:** Any panel renders empty, the confirm dialog is missing, or the active vehicle resets on reload.
