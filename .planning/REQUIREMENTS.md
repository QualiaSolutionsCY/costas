# Requirements: Costas — Car Service Log

**Defined:** 2026-06-29
**Core Value:** A car owner and a workshop both write into one trusted, bilingual vehicle service history — and it persists.

Demo project — a single milestone. No Handoff milestone (the demo is the artifact). Each requirement has a stable REQ-ID and is atomic, testable, user-centric.

---

## Milestone 1 · Make It Real

Replace the in-memory frontend with a real Supabase backend so every flow (owner log, mechanic job, workshop registration) authenticates, persists, and is access-scoped — without losing the existing bilingual UI or design.

### Auth

- [ ] **AUTH-01**: A user can sign in and sign out with email + password; the session persists across a page refresh.
- [ ] **AUTH-02**: A signed-in user is either an **owner** or a **mechanic**, determined by `app_metadata.role` (server-set), and sees the matching surface.
- [ ] **AUTH-03**: Session tokens refresh automatically (middleware) so a logged-in user is not silently logged out.
- [ ] **AUTH-04**: A seeded `owner@…` and `mechanic@…` account exist so the demo shows both roles instantly (auto-confirm on).

### Data

- [ ] **DATA-01**: `profiles`, `vehicles`, `service_entries`, `workshops` exist via migration with RLS enabled and policies authorizing on `app_metadata.role` / `auth.uid()`.
- [ ] **DATA-02**: RLS is verified by signing in as two different users — each sees only the rows they're entitled to (owner sees their vehicle's entries; mechanic sees jobs they logged).

### Owner service log

- [ ] **LOG-01**: An owner can log a service (type + date) and it persists to `service_entries` (kind `owner_log`).
- [ ] **LOG-02**: An owner can record **where** the service was done (the `place` field the model/UI already supports but the form never set).
- [ ] **LOG-03**: The owner's service history reads from the database, sorted newest-first.
- [ ] **LOG-04**: The history view has proper loading, empty, and error states.

### Mechanic job log

- [ ] **JOB-01**: A mechanic can record a job against a vehicle plate (type + date) and it persists to `service_entries` (kind `workshop_job`).
- [ ] **JOB-02**: A job recorded by a mechanic appears in that vehicle's service history.
- [ ] **JOB-03**: The mechanic's "recent entries" list reads from the database with a clear "saved" confirmation.

### Workshop registration

- [ ] **REG-01**: A workshop registration writes a real `workshops` row (name, certificate serial).
- [ ] **REG-02**: The uploaded certificate is stored in the private `workshop-certs` Supabase Storage bucket, path persisted to `workshops.cert_path`.
- [ ] **REG-03**: The success screen reflects the persisted registration (not just client state).

### Internationalization

- [ ] **I18N-01**: Greek (default) and English are preserved end-to-end; every new string is added to the `lib/i18n.ts` dictionary in both languages (a missing translation is a build error).

### Ship

- [ ] **SHIP-01**: Deployed to Vercel production; homepage returns HTTP 200 and the auth flow works on the live URL.
- [ ] **SHIP-02**: `prefers-reduced-motion` respected; loading/empty/error states present on every data-backed view; responsive verified at 375 / 768 / 1440px; a11y bar of the existing components preserved.

---

## Out of Scope

Explicit exclusions (PROJECT.md). Prevents scope creep on the demo.

| Feature | Reason |
|---------|--------|
| Multi-vehicle management per owner | Demo uses the one demo vehicle; multi-vehicle is a full-project feature |
| Settings page functionality | `settings` nav stays a stub for the demo |
| Workshop certificate *verification* (admin approval) | Registration captures the cert; approval workflow is post-demo |
| Payments / booking / scheduling / notifications | Out of the service-log core |
| Native mobile app | Web, mobile-first, is the demo surface |

---

## Traceability

Single milestone — every requirement maps to a phase in `ROADMAP.md`.

| Requirement | Milestone | Phase | Status |
|-------------|-----------|-------|--------|
| AUTH-01 | M1 | Phase 1 | Pending |
| AUTH-02 | M1 | Phase 1 | Pending |
| AUTH-03 | M1 | Phase 1 | Pending |
| AUTH-04 | M1 | Phase 1 | Pending |
| DATA-01 | M1 | Phase 1 | Pending |
| DATA-02 | M1 | Phase 1 | Pending |
| LOG-01 | M1 | Phase 2 | Pending |
| LOG-02 | M1 | Phase 2 | Pending |
| LOG-03 | M1 | Phase 2 | Pending |
| LOG-04 | M1 | Phase 2 | Pending |
| JOB-01 | M1 | Phase 2 | Pending |
| JOB-02 | M1 | Phase 2 | Pending |
| JOB-03 | M1 | Phase 2 | Pending |
| REG-01 | M1 | Phase 3 | Pending |
| REG-02 | M1 | Phase 3 | Pending |
| REG-03 | M1 | Phase 3 | Pending |
| I18N-01 | M1 | Phases 2–4 | Pending |
| SHIP-01 | M1 | Phase 4 | Pending |
| SHIP-02 | M1 | Phase 4 | Pending |

**Coverage:** 19 requirements, all mapped to a phase. Unmapped: 0.

---

## Requirement Quality Rules
1. **ID format:** `{CATEGORY}-{NUMBER}` — stable across the project's life
2. **User-centric:** "User can X" — not "System does Y"
3. **Atomic:** one capability per requirement
4. **Testable:** the observable behavior is nameable
5. **Independent:** minimal dependencies
6. **Assigned to exactly one milestone:** no duplicates, no gaps

## Status Values
- **Pending** · **In Progress** · **Complete** · **Blocked**

---

*Last updated: 2026-06-29*
