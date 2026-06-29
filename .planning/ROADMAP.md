# Roadmap · Milestone 2 · Verification & Trust

**Project:** Costas — Car Service Log
**Milestone:** 2 of 6 (CURRENT)
**Created:** 2026-06-29
**Phases:** 2
**Requirements covered:** VERIF-01, VERIF-02, VERIF-03, VERIF-04, VERIF-05, VERIF-06, VERIF-07

See `JOURNEY.md` for the full project arc. This file covers Milestone 2's phases only.

## Context

M1 ("Make It Real") is shipped. Workshops can register and upload certificates, but nothing approves them — the trust layer is missing. The `admin@costas.com` account and `admin` role already exist in `app_metadata`. This milestone builds the admin review surface and the verified badge, making workshop credentials real and visible.

## Exit Criteria

- An admin can sign in to `/admin`, see the list of pending workshop registrations with certificate preview, and approve or reject each with a reason.
- Approved workshops display a "certified" badge (EL + EN) on every surface where workshops appear.
- A non-admin user navigating to `/admin` is redirected and never receives admin data.

---

## Phases

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Admin Surface & Data Layer | Extend the schema with verification fields, protect `/admin` by role, and deliver the pending-workshops review list with cert access | VERIF-01, VERIF-02, VERIF-07 | ready |
| 2 | Approve / Reject Actions & Badge | Wire the approve and reject server actions, propagate the `verified` badge to every workshop surface, and distinguish unverified / rejected workshops visually | VERIF-03, VERIF-04, VERIF-05, VERIF-06 | — |

---

## Phase Details

### Phase 1: Admin Surface & Data Layer

**Goal:** The `admin@costas.com` user can sign in, land on a protected `/admin` route, and see every pending workshop registration with the ability to preview or download the uploaded certificate — without any non-admin user being able to reach the route or its data.

**Requirements covered:**
- VERIF-01: Admin user signs in and lands on a dedicated admin review surface.
- VERIF-02: Admin sees all pending workshop registrations (name, serial, cert preview/download).
- VERIF-07: `/admin` is protected by RLS + middleware; non-admin receives 403 / redirect, never data.

**Success criteria** (observable):
1. Navigating to `/admin` while signed in as `admin@costas.com` renders the admin dashboard; navigating as `owner@…` or `mechanic@…` returns a redirect to `/` (no admin data in the response body).
2. The admin dashboard lists every workshop with `status = pending` and shows: workshop name, certificate serial, registration timestamp, and a link or inline preview of the uploaded certificate (signed URL from `workshop-certs` bucket).
3. The `workshops` table migration adds `status` (enum: `pending | verified | rejected`, default `pending`), `reviewed_at` (timestamptz, nullable), and `rejection_reason` (text, nullable); all existing rows default to `pending`; RLS policy allows `SELECT` on all rows only to `app_metadata.role = admin`.
4. TypeScript compiles (`npx tsc --noEmit`) with no errors after the migration and new route are added.

**Build notes:**
- Middleware check: read `app_metadata.role` via `getClaims()` (already established in M1 patterns); redirect non-admin at the middleware layer before the route renders.
- The `workshop-certs` bucket is private (M1 migration). Generate signed URLs server-side for each cert row using `createSignedUrl` with a short TTL (e.g. 60s) — never expose the service role key client-side.
- Admin RLS policy: `CREATE POLICY "admin_all" ON workshops FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')` — scoped to admin only, separate from the existing mechanic/owner policies.
- New migration file: `supabase/migrations/{timestamp}_workshop_verification.sql`.

**Depends on:** M1 (workshops table, workshop-certs bucket, app_metadata.role pattern, @supabase/ssr setup)

---

### Phase 2: Approve / Reject Actions & Badge

**Goal:** The admin can approve or reject a workshop from the review surface; the action persists to the database with a timestamp; and approved workshops display a "certified" badge everywhere workshops are shown, while unverified or rejected workshops are visually distinguished.

**Requirements covered:**
- VERIF-03: Admin approves a workshop; `status` changes to `verified`, `reviewed_at` is set.
- VERIF-04: Admin rejects a workshop with a reason; `status` changes to `rejected`, `rejection_reason` is stored.
- VERIF-05: Verified workshop displays a "certified" badge (EL + EN) on all workshop surfaces.
- VERIF-06: Unverified / rejected workshops are visually distinguishable from certified ones.

**Success criteria** (observable):
1. Clicking "Approve" on a pending workshop calls the server action, transitions `status` to `verified`, sets `reviewed_at` to now, and the workshop moves out of the pending list in the UI without a full page reload.
2. Clicking "Reject" opens a reason input; submitting calls the server action, transitions `status` to `rejected`, stores `rejection_reason`, and the workshop moves out of the pending list.
3. On the mechanic view and on any owner-facing service history entry that references a workshop, a "Πιστοποιημένο / Certified" badge is visible next to verified workshops; pending and rejected workshops show a "Σε αναμονή / Pending" or "Απορρίφθηκε / Rejected" indicator instead.
4. The badge and status indicators respect the existing design token system (no hardcoded hex; use `positive` green for verified, `muted` for pending, destructive for rejected); bilingual strings added to `lib/i18n.ts`.
5. A non-admin server action call (e.g., crafted fetch with a non-admin JWT) returns a 403 error — the action verifies `app_metadata.role = admin` server-side before touching the DB.

**Build notes:**
- Server actions: `approveWorkshop(workshopId)` and `rejectWorkshop(workshopId, reason)` — both check `getClaims()` for `role = admin` before executing; return typed results.
- Badge component: a small inline chip reusing existing token primitives (`surface`, `positive`, `muted`). Add EL key `certified` / `pending_review` / `rejected` to the i18n dictionary.
- Propagation points: (a) mechanic's own workshop header (already rendered in M1 mechanic view), (b) the `place` field in the owner's service history entries where the workshop name is shown. Grep `workshops` references in `src/` to find all render sites before building.
- Optimistic UI: use React `useOptimistic` (available in React 19) on the admin list so the row transitions immediately on action click without a loading spinner blocking the list.

**Depends on:** Phase 1 (schema migration, admin route, RLS policy)

---

## Coverage Verification

| Requirement | Phase | Covered? |
|-------------|-------|----------|
| VERIF-01 | Phase 1 | ✓ |
| VERIF-02 | Phase 1 | ✓ |
| VERIF-03 | Phase 2 | ✓ |
| VERIF-04 | Phase 2 | ✓ |
| VERIF-05 | Phase 2 | ✓ |
| VERIF-06 | Phase 2 | ✓ |
| VERIF-07 | Phase 1 | ✓ |

All 7 M2 requirements mapped. Unmapped: 0.

---

## When This Milestone Closes

Triggered by `/qualia-milestone` after `/qualia-verify` passes on Phase 2:

1. All phase artifacts are archived to `.planning/archive/milestone-2-verification-trust/`
2. `tracking.json` `milestones[]` gets a summary entry (num, name, phases_completed, shipped_url, closed_at)
3. REQUIREMENTS.md marks VERIF-01..07 as **Complete**
4. M3 (Accounts & Settings) opens — roadmapper regenerates this ROADMAP.md for Milestone 3
5. `state.js init --force --milestone_name "Accounts & Settings"` resets current-phase fields, preserves lifetime + milestones[] history

---

*Last updated: 2026-06-29*
