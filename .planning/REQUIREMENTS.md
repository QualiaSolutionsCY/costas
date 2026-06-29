# Requirements: Costas — Car Service Log

**Defined:** 2026-06-29
**Updated:** 2026-06-29 (extended to full arc — client signed)
**Core Value:** A car owner and a workshop both write into one trusted, bilingual vehicle service history — and it persists.

Requirements are grouped by the milestone that delivers them. Each requirement
has a stable REQ-ID and is atomic, testable, and user-centric.

---

## Milestone 1 · Make It Real     [COMPLETE]

Replace the in-memory frontend with a real Supabase backend so every flow (owner log, mechanic job, workshop registration) authenticates, persists, and is access-scoped — without losing the existing bilingual UI or design.

### Auth

- [x] **AUTH-01**: A user can sign in and sign out with email + password; the session persists across a page refresh.
- [x] **AUTH-02**: A signed-in user is either an **owner** or a **mechanic**, determined by `app_metadata.role` (server-set), and sees the matching surface.
- [x] **AUTH-03**: Session tokens refresh automatically (middleware) so a logged-in user is not silently logged out.
- [x] **AUTH-04**: A seeded `owner@…` and `mechanic@…` account exist so the demo shows both roles instantly (auto-confirm on).

### Data

- [x] **DATA-01**: `profiles`, `vehicles`, `service_entries`, `workshops` exist via migration with RLS enabled and policies authorizing on `app_metadata.role` / `auth.uid()`.
- [x] **DATA-02**: RLS is verified by signing in as two different users — each sees only the rows they're entitled to (owner sees their vehicle's entries; mechanic sees jobs they logged).

### Owner service log

- [x] **LOG-01**: An owner can log a service (type + date) and it persists to `service_entries` (kind `owner_log`).
- [x] **LOG-02**: An owner can record **where** the service was done (the `place` field the model/UI already supports but the form never set).
- [x] **LOG-03**: The owner's service history reads from the database, sorted newest-first.
- [x] **LOG-04**: The history view has proper loading, empty, and error states.

### Mechanic job log

- [x] **JOB-01**: A mechanic can record a job against a vehicle plate (type + date) and it persists to `service_entries` (kind `workshop_job`).
- [x] **JOB-02**: A job recorded by a mechanic appears in that vehicle's service history.
- [x] **JOB-03**: The mechanic's "recent entries" list reads from the database with a clear "saved" confirmation.

### Workshop registration

- [x] **REG-01**: A workshop registration writes a real `workshops` row (name, certificate serial).
- [x] **REG-02**: The uploaded certificate is stored in the private `workshop-certs` Supabase Storage bucket, path persisted to `workshops.cert_path`.
- [x] **REG-03**: The success screen reflects the persisted registration (not just client state).

### Internationalization

- [x] **I18N-01**: Greek (default) and English are preserved end-to-end; every new string is added to the `lib/i18n.ts` dictionary in both languages (a missing translation is a build error).

### Ship

- [x] **SHIP-01**: Deployed to Vercel production; homepage returns HTTP 200 and the auth flow works on the live URL.
- [x] **SHIP-02**: `prefers-reduced-motion` respected; loading/empty/error states present on every data-backed view; responsive verified at 375 / 768 / 1440px; a11y bar of the existing components preserved.

---

## Milestone 2 · Verification & Trust

An admin surface to review uploaded workshop certificates, approve or reject workshops, and surface a verified badge on approved workshops — giving owners and mechanics confidence that the platform vouches for certified workshops. — [capability_inventory §1 Workshop verification]

### Admin review

- [ ] **VERIF-01**: An admin user (`admin@costas.com`, `app_metadata.role = admin`) can sign in and land on a dedicated admin review surface. — [capability_inventory §1]
- [ ] **VERIF-02**: The admin can see all pending workshop registrations with their uploaded certificate (name, serial, cert preview/download). — [capability_inventory §1]
- [ ] **VERIF-03**: The admin can approve a workshop; the workshop's `status` field changes to `verified` and the record is timestamped. — [capability_inventory §1]
- [ ] **VERIF-04**: The admin can reject a workshop with a reason; the workshop's `status` changes to `rejected` and the reason is stored. — [capability_inventory §1]

### Trust signals

- [ ] **VERIF-05**: A verified workshop displays a "certified" badge (in EL + EN) on any surface where workshops are shown (mechanic view, owner history). — [capability_inventory §1]
- [ ] **VERIF-06**: Unverified workshops are visually distinguishable (pending / rejected state) so owners and mechanics can tell at a glance whether a workshop is certified. — [capability_inventory §1]

### Access control

- [ ] **VERIF-07**: The admin route is protected by RLS + middleware; a non-admin user who navigates to `/admin` receives a 403 / redirect, never admin data. — [capability_inventory §1, PROJECT.md §Requirements — RLS on every table]

---

## Milestone 3 · Accounts & Settings

Real self-service account management replaces the seeded demo accounts — an owner can sign up, edit their profile and vehicles, and reset their password — so the app is usable by real users rather than only demo credentials. — [capability_inventory §2 Accounts & settings]

### Sign-up & auth lifecycle

- [ ] **ACCT-01**: A new owner can register with email + password (real sign-up, not just seeded accounts); the account is created with `role = owner` in `app_metadata`. — [capability_inventory §2]
- [ ] **ACCT-02**: A user can request a password-reset email and follow the link to set a new password. — [capability_inventory §2]
- [ ] **ACCT-03**: A signed-in user can change their password from the settings surface. — [capability_inventory §2]

### Owner profile

- [ ] **ACCT-04**: An owner can view and edit their profile (display name, phone). — [capability_inventory §2]
- [ ] **ACCT-05**: Profile changes persist to `profiles` and are visible on next sign-in. — [capability_inventory §2]

### Vehicle management

- [ ] **ACCT-06**: An owner can add a new vehicle (plate, make, model, year) to their account. — [capability_inventory §2]
- [ ] **ACCT-07**: An owner can edit an existing vehicle's details. — [capability_inventory §2]
- [ ] **ACCT-08**: An owner can remove a vehicle from their account (with confirmation prompt). — [capability_inventory §2]
- [ ] **ACCT-09**: An owner with multiple vehicles can switch the active vehicle; the service log and history scope to the selected vehicle. — [capability_inventory §2]

### Settings surface

- [ ] **ACCT-10**: The currently stubbed `settings` nav links to a real settings page covering profile, vehicle management, and password change. — [capability_inventory §2, PROJECT.md §Out of Scope — "settings page functionality" was demo exclusion, now included]

---

## Milestone 4 · Booking & Scheduling

An owner can book a service slot at a verified workshop; the workshop sees and manages its incoming bookings — connecting the two sides of the platform around a shared, time-aware service event. — [capability_inventory §3 Booking & scheduling]

### Owner booking flow

- [ ] **BOOK-01**: An owner can browse verified workshops and select one to book a service slot. — [capability_inventory §3]
- [ ] **BOOK-02**: An owner can request a booking specifying service type, preferred date, and vehicle. — [capability_inventory §3]
- [ ] **BOOK-03**: A booking request lands with status `requested` and is visible to the owner in a "my bookings" view. — [capability_inventory §3]
- [ ] **BOOK-04**: An owner can cancel a pending (`requested`) booking. — [capability_inventory §3]

### Workshop calendar & management

- [ ] **BOOK-05**: A mechanic/workshop user can see all incoming booking requests for their workshop. — [capability_inventory §3]
- [ ] **BOOK-06**: A workshop can confirm a booking request; status transitions to `confirmed` and the owner sees the update. — [capability_inventory §3]
- [ ] **BOOK-07**: A workshop can mark a confirmed booking as done; status transitions to `done`. — [capability_inventory §3]
- [ ] **BOOK-08**: A workshop can decline a booking request with a reason; status transitions to `declined` and the owner sees the reason. — [capability_inventory §3]

### Status visibility

- [ ] **BOOK-09**: Booking status (`requested → confirmed → done / declined`) is always visible to both owner and workshop with timestamps. — [capability_inventory §3]
- [ ] **BOOK-10**: A completed booking (`done`) automatically creates a `service_entries` record in the vehicle's history so the booking closes the loop with the service log. — [capability_inventory §3]

---

## Milestone 5 · Reminders & Notifications

The platform proactively surfaces upcoming MOT deadlines and next-service dates computed from the vehicle's history, and delivers timely reminders via email or in-app notification — so owners never miss a service event. — [capability_inventory §4 Reminders & notifications]

### Computed reminders

- [ ] **NOTIF-01**: The system computes each vehicle's MOT-due date from the latest MOT entry + 1-year interval and surfaces a reminder when due within 30 days. — [capability_inventory §4]
- [ ] **NOTIF-02**: The system computes a next-service date based on the latest service entry + the owner's configured interval (default: 12 months / 15 000 km) and surfaces a reminder when due within 30 days. — [capability_inventory §4]
- [ ] **NOTIF-03**: Reminders are computed server-side on a scheduled basis (not just at page load) so the owner receives them even when they haven't opened the app. — [capability_inventory §4]

### Delivery

- [ ] **NOTIF-04**: An owner receives an email notification for each computed reminder (subject and body bilingual EL/EN). — [capability_inventory §4]
- [ ] **NOTIF-05**: An in-app notification or banner surfaces the same reminder to a signed-in owner on their next visit. — [capability_inventory §4]
- [ ] **NOTIF-06**: A dismissed in-app notification does not reappear until the next reminder cycle. — [capability_inventory §4]

### Preferences

- [ ] **NOTIF-07**: An owner can configure reminder preferences in settings (enable/disable email reminders, enable/disable in-app banners, adjust advance-notice window). — [capability_inventory §4]
- [ ] **NOTIF-08**: Reminder preference changes persist to `profiles` and take effect on the next scheduled reminder run. — [capability_inventory §4]

---

## Milestone 6 · Handoff     [FINAL]

**Why now:** All features are built and verified. The client takes ownership of the production system with credentials, documentation, and a recorded walkthrough.

### Polish

- [ ] **HAND-01**: Every user-facing page has all interactive states (hover, focus, loading, error, empty) verified in EL + EN.
- [ ] **HAND-02**: Responsive verified at 375 / 768 / 1440 / 1920px across all new M2–M5 surfaces.
- [ ] **HAND-03**: WCAG AA contrast + keyboard navigation verified on all new surfaces.

### Content + SEO

- [ ] **HAND-04**: Real copy (Greek-primary) replaces all placeholder text on every page.
- [ ] **HAND-05**: Meta tags, OG image, sitemap.xml, robots.txt present and correct.
- [ ] **HAND-06**: Analytics wired (Plausible or PostHog) with event tracking on key flows (sign-up, booking, reminder click).

### Final QA

- [ ] **HAND-07**: Full-flow test of every primary user journey: owner sign-up → add vehicle → book → receive reminder; mechanic record job → admin verify; admin review → approve/reject.
- [ ] **HAND-08**: Cross-browser verified (Chrome + Safari + Firefox) for all primary flows.
- [ ] **HAND-09**: `/qualia-review` scored diagnostics reviewed; all CRITICAL and HIGH findings resolved.

### Handoff

- [ ] **HAND-10**: Production URL returns HTTP 200; auth flow works; key API endpoints respond under 500ms.
- [ ] **HAND-11**: README updated with architecture overview, local dev setup, env vars, and migration runbook.
- [ ] **HAND-12**: Credentials document delivered to client (Supabase keys, Vercel tokens, admin account, any third-party keys).
- [ ] **HAND-13**: Recorded walkthrough (Loom or equivalent) covering all four roles: owner, mechanic, admin, and the reminder system.
- [ ] **HAND-14**: `.planning/archive/` contains every milestone's verification reports.
- [ ] **HAND-15**: Final `/qualia-report` submitted; `lifetime.milestones_completed` incremented to 6.

---

## Out of Scope

Explicit exclusions — drawn from PROJECT.md §Out of Scope (demo phase) and confirmed not in the signed capability set.

| Feature | Reason |
|---------|--------|
| Native mobile app | Web, mobile-first is the agreed surface — PROJECT.md §Out of Scope |
| Payments / invoicing | Not in the signed capability inventory |
| SMS reminders | Capability inventory specifies email + in-app; SMS requires Telnyx integration and a separate consent flow |
| Workshop marketplace / discovery search | Out of scope; owners browse the verified list, no search/filter beyond that |

---

## Traceability

Every requirement maps to exactly one milestone + phase.

| Requirement | Milestone | Phase | Status |
|-------------|-----------|-------|--------|
| AUTH-01 | M1 | Phase 1 | Complete |
| AUTH-02 | M1 | Phase 1 | Complete |
| AUTH-03 | M1 | Phase 1 | Complete |
| AUTH-04 | M1 | Phase 1 | Complete |
| DATA-01 | M1 | Phase 1 | Complete |
| DATA-02 | M1 | Phase 1 | Complete |
| LOG-01 | M1 | Phase 2 | Complete |
| LOG-02 | M1 | Phase 2 | Complete |
| LOG-03 | M1 | Phase 2 | Complete |
| LOG-04 | M1 | Phase 2 | Complete |
| JOB-01 | M1 | Phase 2 | Complete |
| JOB-02 | M1 | Phase 2 | Complete |
| JOB-03 | M1 | Phase 2 | Complete |
| REG-01 | M1 | Phase 3 | Complete |
| REG-02 | M1 | Phase 3 | Complete |
| REG-03 | M1 | Phase 3 | Complete |
| I18N-01 | M1 | Phases 2–4 | Complete |
| SHIP-01 | M1 | Phase 4 | Complete |
| SHIP-02 | M1 | Phase 4 | Complete |
| VERIF-01 | M2 | Phase 1 | Complete |
| VERIF-02 | M2 | Phase 1 | Complete |
| VERIF-03 | M2 | Phase 1 | Complete |
| VERIF-04 | M2 | Phase 1 | Complete |
| VERIF-05 | M2 | Phase 2 | Complete |
| VERIF-06 | M2 | Phase 2 | Complete |
| VERIF-07 | M2 | Phase 1 | Complete |
| ACCT-01 | M3 | Phase 1 | Complete |
| ACCT-02 | M3 | Phase 1 | Complete |
| ACCT-03 | M3 | Phase 1 | Complete |
| ACCT-04 | M3 | Phase 2 | Complete |
| ACCT-05 | M3 | Phase 2 | Complete |
| ACCT-06 | M3 | Phase 2 | Complete |
| ACCT-07 | M3 | Phase 2 | Complete |
| ACCT-08 | M3 | Phase 2 | Complete |
| ACCT-09 | M3 | Phase 2 | Complete |
| ACCT-10 | M3 | Phase 2 | Complete |
| BOOK-01 | M4 | Phase 1 | Complete |
| BOOK-02 | M4 | Phase 1 | Complete |
| BOOK-03 | M4 | Phase 1 | Complete |
| BOOK-04 | M4 | Phase 1 | Complete |
| BOOK-05 | M4 | Phase 2 | Complete |
| BOOK-06 | M4 | Phase 2 | Complete |
| BOOK-07 | M4 | Phase 2 | Complete |
| BOOK-08 | M4 | Phase 2 | Complete |
| BOOK-09 | M4 | Phase 3 | Complete |
| BOOK-10 | M4 | Phase 3 | Complete |
| NOTIF-01 | M5 | Phase 1 | Complete |
| NOTIF-02 | M5 | Phase 1 | Complete |
| NOTIF-03 | M5 | Phase 1 | Complete |
| NOTIF-04 | M5 | Phase 2 | Complete |
| NOTIF-05 | M5 | Phase 2 | Complete |
| NOTIF-06 | M5 | Phase 2 | Complete |
| NOTIF-07 | M5 | Phase 3 | Complete |
| NOTIF-08 | M5 | Phase 3 | Complete |
| HAND-01 | M6 | Polish | Pending |
| HAND-02 | M6 | Polish | Pending |
| HAND-03 | M6 | Polish | Pending |
| HAND-04 | M6 | Content + SEO | Pending |
| HAND-05 | M6 | Content + SEO | Pending |
| HAND-06 | M6 | Content + SEO | Pending |
| HAND-07 | M6 | Final QA | Pending |
| HAND-08 | M6 | Final QA | Pending |
| HAND-09 | M6 | Final QA | Pending |
| HAND-10 | M6 | Handoff | Pending |
| HAND-11 | M6 | Handoff | Pending |
| HAND-12 | M6 | Handoff | Pending |
| HAND-13 | M6 | Handoff | Pending |
| HAND-14 | M6 | Handoff | Pending |
| HAND-15 | M6 | Handoff | Pending |

**Coverage:** 65 requirements total across 6 milestones. Unmapped: 0.

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
