---
project: "Costas — Car Service Log"
total_milestones: 6
current_milestone: 6
created: 2026-06-29
project_type: full
---

# Costas — Journey (Full Arc)

The full arc from the shipped demo to client handoff. Every milestone. Every exit criterion.
This file is the **North Star** — all planning downstream must stay architecturally
consistent with it.

## Mission

Turn the shipped bilingual car-service-log demo into a production platform for the Cyprus market. A car owner manages their full vehicle history across multiple cars, books service slots at certified workshops, and receives timely MOT and service reminders. A workshop registers, earns admin-verified certification, manages incoming bookings, and records jobs that feed the owner's history. An admin reviews and approves workshop certificates. Both sides write into one trusted, bilingual service record — Greek-primary, English-available.

## The Path (6 milestones to handoff)

```
M1 (Make It Real) ─── M2 (Verification & Trust) ─── M3 (Accounts & Settings)
   [COMPLETE]              [COMPLETE]                    [COMPLETE]
                   ─── M4 (Booking & Scheduling) ─── M5 (Reminders & Notifications)
                          [COMPLETE]                       [COMPLETE]
                   ─── M6 (Handoff)
                          [CURRENT]
```

---

## Milestone 1 · Make It Real     [COMPLETE]

**Why now:** A polished frontend already existed but ran on in-memory seed data — nothing persisted, there was no auth, and registration was a no-op. The demo's entire value was proving it *actually works* end-to-end with a real backend. This milestone made every flow real.

**Exit criteria** (shipped):
- A car owner can sign in, log a service (with where it was done), and see it persist in their vehicle's history after refresh.
- A mechanic can sign in, record a job against a vehicle plate, and that job appears in the vehicle's history.
- A workshop can register — name + certificate serial + uploaded certificate document lands in Supabase (row + Storage file).
- RLS is on every table; logging in as the owner vs the mechanic shows correctly scoped data.
- The app is deployed (Vercel) and returns HTTP 200 with the auth flow verified, EL/EN intact throughout.

**Phases:**
1. **Backend Foundation & Auth** — Supabase wired, 4-table schema + RLS + Storage bucket from migration #1, email/password auth with seeded owner/mechanic roles, session refresh, deploy preview.
2. **Owner & Mechanic flows go real** — `ServiceLog` + `MechanicLog` read/write the database via server actions (Zod-validated); owner gains the missing "where serviced" field; loading/empty/error states on every data view; i18n preserved.
3. **Workshop registration → real** — `RegisterForm` writes a `workshops` row and uploads the certificate to the `workshop-certs` Storage bucket; success screen reflects persisted data.
4. **Polish & Ship** — `prefers-reduced-motion`, state/responsive/a11y audit against DESIGN.md, wire (or honestly stub) the dead-end nav, deploy to Vercel production, verify HTTP 200 + auth.

**Requirements covered:** AUTH-01..04, DATA-01..02, LOG-01..04, JOB-01..03, REG-01..03, I18N-01, SHIP-01..02

---

## Milestone 2 · Verification & Trust     [CURRENT]

**Why now:** Workshops have registered and uploaded certificates but nothing vouches for them — the admin approval workflow that was explicitly deferred from the demo is now the trust layer that makes the platform credible. Before owners can book (M4) or mechanics can earn a "certified" badge, the verification pipeline must exist. The `admin@costas.com` account and `admin` role already exist in the DB so this milestone has a real foundation to build on.

**Exit criteria:**
- An admin can sign in to `/admin`, review the list of pending workshops (including certificate preview), and approve or reject each with a reason.
- Approved workshops display a "certified" badge (EL + EN) on any surface where workshops appear.
- A non-admin user navigating to `/admin` is redirected (403) and never sees admin data.

**Phases:**
1. **Admin surface & data layer** — add `status` + `reviewed_at` + `rejection_reason` to the `workshops` table via migration; admin-scoped RLS policies; `/admin` route protected by middleware; admin list view of pending workshops with cert preview/download.
2. **Approve / reject actions & badge** — server actions for approve and reject (Zod-validated, admin-only); `verified` badge component in EL/EN; badge propagated to mechanic view and owner history entries; unverified/rejected workshops visually distinguished.

**Requirements covered:** VERIF-01..07

---

## Milestone 3 · Accounts & Settings

**Why now:** The platform currently only works with seeded demo accounts — real users cannot sign up, manage their vehicles, or reset a forgotten password. Before booking (M4) can exist in the wild, real accounts must exist. This milestone replaces the seeded-account assumption with real self-service lifecycle management and wires the currently stubbed `settings` nav.

**Exit criteria:**
- A new user can sign up with email + password and receive the correct role (`owner`).
- An owner can add, edit, and remove vehicles; switching vehicles scopes the service log to the selected vehicle.
- Password reset works end-to-end (request email → click link → set new password).
- The settings page is real and covers profile, vehicle management, and password change.

**Phases:**
1. **Real sign-up & auth lifecycle** — self-service sign-up flow (email + password, role stamped server-side); password reset email + reset page; password change from settings; EL/EN throughout.
2. **Profile & vehicle management** — profile edit (name, phone) persisting to `profiles`; add / edit / remove vehicle (with confirmation); active-vehicle switcher scoping the service log and history; settings page assembling all three panels.

**Requirements covered:** ACCT-01..10

---

## Milestone 4 · Booking & Scheduling

**Why now:** With verified workshops (M2) and real accounts (M3) in place, the platform can close the loop between owners and workshops around a time-aware service event. Booking is the feature that makes the two-sided nature of the platform commercially valuable — without it, the product is a log, not a service platform.

**Exit criteria:**
- An owner can browse the list of verified workshops, select one, and submit a booking request for a specific service type and date.
- A workshop sees its incoming bookings and can confirm, decline, or mark them as done.
- A completed booking automatically creates a service entry in the vehicle's history.
- Booking status is visible (with timestamps) to both owner and workshop at every stage.

**Phases:**
1. **Owner booking flow** — `bookings` table migration (vehicle_id, workshop_id, service_type, preferred_date, status, timestamps); RLS policies; owner browse-workshops → request-booking UI; "my bookings" view with status.
2. **Workshop calendar & management** — workshop's incoming-bookings view; confirm / decline / done server actions; status transitions with timestamps; owner's booking status updates in real time (polling or Supabase Realtime).
3. **Booking close-out → service history** — on `status = done`, auto-create a `service_entries` row tied to the vehicle (kind `workshop_job`); link the booking in the history entry so the owner can trace it back; edge-case handling (cancelled, declined paths).

**Requirements covered:** BOOK-01..10

---

## Milestone 5 · Reminders & Notifications

**Why now:** Service history and bookings now generate enough data to compute meaningful reminders. This milestone turns the passive log into a proactive service — the feature that owners will cite as the reason they keep using the app.

**Exit criteria:**
- MOT-due and next-service reminders are computed from history and sent by email before the deadline.
- In-app banners surface the same reminders to signed-in owners.
- An owner can configure reminder preferences (enable/disable, advance-notice window) from settings.

**Phases:**
1. **Reminder computation engine** — scheduled job (Railway or Vercel Cron) computing MOT-due + next-service dates from `service_entries`; `reminders` table to record sent/dismissed state; idempotency guard (no duplicate sends).
2. **Email + in-app delivery** — transactional email via Resend or Supabase Edge Function (bilingual subject + body template); in-app notification banner on owner dashboard; dismiss action persisting to `reminders`.
3. **Reminder preferences** — preference fields added to `profiles` (email enabled, in-app enabled, advance-notice days); preferences UI in settings; scheduler respects preferences per vehicle/owner.

**Requirements covered:** NOTIF-01..08

---

## Milestone 6 · Handoff     [FINAL]

**Why now:** All four capability areas are built and verified. The client takes ownership of the production system with full credentials, documentation, and a recorded walkthrough covering all four roles.

**Exit criteria:**
- Every user-facing surface passes the a11y + responsive bar, EL/EN copy is final, and analytics are wired.
- A full-flow test of every primary journey passes on the live production URL.
- Client has credentials, runbook, and recorded walkthrough; `.planning/archive/` contains all milestone verification reports.

**Phases (standard for every project):**
1. **Polish** — final design pass on all M2–M5 surfaces (states, responsive, a11y, EL/EN copy completeness); HAND-01..03.
2. **Content + SEO** — real Greek-primary copy, meta tags, OG image, sitemap.xml, robots.txt, analytics (Plausible / PostHog); HAND-04..06.
3. **Final QA** — full-flow tests across all four user journeys (owner, mechanic, admin, reminder), cross-browser (Chrome + Safari + Firefox), `/qualia-review` blockers resolved; HAND-07..09.
4. **Handoff** — credentials doc, README update, Loom walkthrough, production URL verification, final `/qualia-report`; HAND-10..15.

**Requirements covered:** HAND-01..15

---

## Rules for This Journey

1. **The arc covers the entire signed scope.** Every capability in the signed inventory (Workshop verification, Accounts & Settings, Booking & Scheduling, Reminders & Notifications) has REQ-IDs and lands in a milestone.
2. **M1 is complete — do not re-plan it.** The shipped demo is the foundation; M2+ build on it.
3. **Milestones are ordered by dependency.** M2 (trust layer) before M4 (booking requires verified workshops + real accounts). M3 (real accounts) before M4 (booking requires real owners). M4 (history data) before M5 (reminders need rich history).
4. **Preserve the existing design + i18n.** Brownfield — extend, don't rewrite. Every new string goes into `lib/i18n.ts` in both languages.
5. **Exit criteria are observable.** "User can do X" not "Feature Y works."
6. **Real backend, no mocks.** Supabase, real auth, real persistence — the demo philosophy carries through every milestone.

---

*Last updated: 2026-06-29*
