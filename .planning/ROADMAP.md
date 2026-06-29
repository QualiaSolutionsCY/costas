# Roadmap · Milestone 1 · Make It Real

**Project:** Costas — Car Service Log
**Milestone:** 1 of 1 (CURRENT) — demo
**Created:** 2026-06-29
**Phases:** 4
**Requirements covered:** AUTH-01..04, DATA-01..02, LOG-01..04, JOB-01..03, REG-01..03, I18N-01, SHIP-01..02

See `JOURNEY.md` for the project arc. This file is the current milestone's phases.

## Exit Criteria

- Owner signs in, logs a service (with where), sees it persist after refresh.
- Mechanic signs in, records a job against a plate; it appears in the vehicle history.
- Workshop registers; row + certificate file land in Supabase.
- RLS on every table; owner vs mechanic see correctly scoped data.
- Deployed on Vercel, HTTP 200 + auth verified, EL/EN intact.

---

## Phases

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Backend Foundation & Auth | Supabase wired, schema+RLS+Storage from migration #1, email/password auth with roles, deploy preview | AUTH-01..04, DATA-01..02 | ready |
| 2 | Owner & Mechanic flows go real | Owner log + mechanic job read/write the DB via server actions; owner gets `place`; states; i18n preserved | LOG-01..04, JOB-01..03, I18N-01 | — |
| 3 | Workshop registration → real | Registration writes a row + uploads the certificate to Storage | REG-01..03 | — |
| 4 | Polish & Ship | a11y/motion/state/responsive audit, dead-end nav, deploy to prod, verify | SHIP-01..02, I18N-01 | — |

## Phase Details

### Phase 1: Backend Foundation & Auth

**Goal:** The app talks to a real Supabase project with RLS on from the first migration, and a user can sign in as an owner or a mechanic.

**Requirements covered:**
- AUTH-01: email/password sign in/out, session persists across refresh
- AUTH-02: owner vs mechanic role from `app_metadata.role`
- AUTH-03: middleware session refresh
- AUTH-04: seeded `owner@…` / `mechanic@…` accounts (auto-confirm on)
- DATA-01: `profiles`, `vehicles`, `service_entries`, `workshops` migration with RLS + Storage bucket `workshop-certs`
- DATA-02: RLS verified with two users

**Success criteria** (observable):
1. A user can sign up/in/out; refresh keeps them logged in.
2. Every table has RLS enabled; policies authorize on `auth.uid()` / `app_metadata.role`.
3. Logging in as the seeded owner vs mechanic lands on the correct surface and shows only entitled rows.
4. The project deploys to a Vercel preview URL.

**Build notes (from research — do NOT recall from memory):**
- `npm i @supabase/ssr @supabase/supabase-js`; create `src/lib/supabase/{client,server,middleware}.ts`. `server.ts` `createClient` is **async** (`cookies()` is async in Next 16) and uses `getAll`/`setAll` only. → `research/ARCHITECTURE.md §Client setup`.
- Session refresh: `src/middleware.ts` calling `updateSession`, `getClaims()` for the auth check, no code between client-create and the auth call. (`middleware.ts` still works; Next 16 renames it to `proxy.ts` — either is acceptable, Supabase guide uses `middleware.ts`.) → `STACK.md §Middleware/Proxy`, `ARCHITECTURE.md §Middleware/session`.
- Schema/RLS/Storage SQL + role-stamping via service key + migration CLI flow are sketched in `ARCHITECTURE.md §Schema + RLS`, `§Storage`, `§Migrations`. RLS on every table from migration #1 (constitution). `service_role` key is server-only (`server-only` package).
- Env contract: `.planning/env.required.json`. Needs a Supabase project (`npx supabase init/link`) — flag to operator before building.

**Depends on:** none

---

### Phase 2: Owner & Mechanic flows go real

**Goal:** The two core logging flows read from and write to the database, with validation and proper states — no more in-memory seed data.

**Requirements covered:**
- LOG-01: owner logs a service that persists (`kind = owner_log`)
- LOG-02: owner captures **where** (the `place` field)
- LOG-03: history reads from DB, sorted newest-first
- LOG-04: loading / empty / error states
- JOB-01: mechanic logs a job against a plate (`kind = workshop_job`), persists
- JOB-02: a mechanic's job appears in the vehicle's history
- JOB-03: "recent entries" reads from DB with a "saved" confirmation
- I18N-01: every new string in EL + EN

**Success criteria:**
1. Owner logs a service (type + date + place); it persists and survives refresh.
2. Mechanic logs a job against a plate; it shows in that vehicle's history.
3. Every async view has loading, empty, and error states.
4. Mutations go through `lib/supabase/server.ts` server actions, Zod-validated client AND server; reads are scoped by RLS.

**Build notes:**
- Replace the `t.seedLog` / `t.mechanicSeed` in-component arrays with DB reads. Keep the i18n dictionary for UI strings + service options; move only the *sample data* out.
- Add the `place` input to `ServiceLog`'s form (the gap flagged in the codebase map — `concerns.md`). Add the EL/EN labels to the dictionary.
- Server Actions are the mutation path (Next 16); verify the user inside every action (`getClaims()`/`getUser()`), never trust the client. → `STACK.md §Server Actions`.

**Depends on:** Phase 1

---

### Phase 3: Workshop registration → real

**Goal:** Registration stops being a no-op — it persists a workshop and stores the certificate.

**Requirements covered:**
- REG-01: registration writes a `workshops` row (name, serial)
- REG-02: certificate uploads to the private `workshop-certs` bucket; path saved to `cert_path`
- REG-03: success screen reflects persisted data

**Success criteria:**
1. Submitting registration creates a `workshops` row tied to the mechanic account.
2. The dropped/selected file uploads to Storage under `{uid}/…` (upsert needs INSERT+SELECT+UPDATE policies — already in the Phase 1 migration).
3. The success summary shows the persisted values; a signed URL can retrieve the cert.

**Build notes:**
- Reuse the existing drag-drop uploader UI; point it at Supabase Storage `upsert: true`. Private bucket — serve via `createSignedUrl`. → `ARCHITECTURE.md §Storage`.
- Validate file type/size on the server too (drop path currently unchecked — `concerns.md`).

**Depends on:** Phase 1 (bucket + policies), Phase 2 (auth/role patterns established)

---

### Phase 4: Polish & Ship

**Goal:** Demo-grade finish and a live, verified deployment.

**Requirements covered:**
- SHIP-01: deployed to Vercel prod, HTTP 200 + auth flow verified live
- SHIP-02: `prefers-reduced-motion`, all states present, responsive 375/768/1440, a11y preserved
- I18N-01: EL/EN intact on every new surface

**Success criteria:**
1. `prefers-reduced-motion` disables the popIn/sheetUp/slideIn animations.
2. Loading/empty/error states audited across owner, mechanic, and registration views.
3. Dead-end `vehicles`/`settings` nav either wired to something real or honestly labeled (no fake "coming soon" if it can be a minimal real view).
4. Production deploy returns HTTP 200; auth flow works on the live URL; EL/EN both render.

**Depends on:** Phases 1–3

---

## Coverage Verification

| Requirement | Phase | Covered? |
|-------------|-------|----------|
| AUTH-01..04 | Phase 1 | ✓ |
| DATA-01..02 | Phase 1 | ✓ |
| LOG-01..04 | Phase 2 | ✓ |
| JOB-01..03 | Phase 2 | ✓ |
| REG-01..03 | Phase 3 | ✓ |
| I18N-01 | Phases 2–4 | ✓ |
| SHIP-01..02 | Phase 4 | ✓ |

All 19 requirements mapped. Unmapped: 0.

---

## When This Milestone Closes

This is a demo (1 milestone). On `/qualia-verify` passing Phase 4, the demo is shippable. If the client signs, `/qualia-milestone` opens a full arc (multi-vehicle, workshop verification, settings, notifications) from a new JOURNEY.

---

*Last updated: 2026-06-29*
