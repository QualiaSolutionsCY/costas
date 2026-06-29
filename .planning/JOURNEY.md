---
project: "Costas — Car Service Log"
total_milestones: 1
current_milestone: 1
created: 2026-06-29
project_type: demo
---

# Costas — Journey (Demo)

A **demo** journey: one milestone, one shippable artifact. The demo IS the deliverable — built to win a client conversation. If the client signs, `/qualia-milestone` extends this into a full arc (multi-vehicle, workshop verification, settings, notifications). No "Handoff" milestone — the demo is complete in itself.

## Mission

Turn the existing bilingual (Greek/English) car-service-log frontend into a **real, working product**: real Supabase backend, real auth distinguishing car owners from workshops, real persistence of every flow. A Cypriot car owner logs and reviews their vehicle's service history; a certified workshop registers and records jobs against vehicle plates — both writing into one trusted history, in Greek or English.

## The Path (1 milestone — demo)

```
M1 (Make It Real)
│
└── [CURRENT]
```

---

## Milestone 1 · Make It Real     [CURRENT]

**Why now:** A polished frontend already exists but runs on in-memory seed data — nothing persists, there's no auth, and registration is a no-op. The demo's entire value is proving it *actually works* end-to-end with a real backend. This milestone makes every flow real.

**Exit criteria** (what "shipped" means):
- A car owner can sign in, log a service (with **where** it was done), and see it persist in their vehicle's history after refresh.
- A mechanic can sign in, record a job against a vehicle plate, and that job appears in the vehicle's history.
- A workshop can register — name + certificate serial + uploaded certificate document lands in Supabase (row + Storage file).
- RLS is on every table; logging in as the owner vs the mechanic shows correctly scoped data.
- The app is deployed (Vercel) and returns HTTP 200 with the auth flow verified, EL/EN intact throughout.

**Phases:**
1. **Backend Foundation & Auth** — Supabase wired (`@supabase/ssr`), 4-table schema + RLS + Storage bucket from migration #1, email/password auth with seeded owner/mechanic roles, session refresh, deploy preview.
2. **Owner & Mechanic flows go real** — `ServiceLog` + `MechanicLog` read/write the database via server actions (Zod-validated); owner gains the missing "where serviced" field; loading/empty/error states on every data view; i18n preserved.
3. **Workshop registration → real** — `RegisterForm` writes a `workshops` row and uploads the certificate to the `workshop-certs` Storage bucket; success screen reflects persisted data.
4. **Polish & Ship** — `prefers-reduced-motion`, state/responsive/a11y audit against DESIGN.md, wire (or honestly stub) the dead-end nav, deploy to Vercel production, verify HTTP 200 + auth.

**Requirements covered:** AUTH-01..04, DATA-01..02, LOG-01..04, JOB-01..03, REG-01..03, I18N-01, SHIP-01..02

**Research flags:** Phase 1 must build from `.planning/research/STACK.md` + `ARCHITECTURE.md` (Next 16 async APIs, `@supabase/ssr` patterns), not from recall.

---

## Rules for This Journey

1. **Demo = 1 milestone, no Handoff.** The demo is its own complete artifact. Extension to a full project is handled by `/qualia-milestone` only if the client signs.
2. **Real backend, no mocks.** Demo philosophy is non-negotiable: real Supabase, real auth, real persistence. No seed-data-in-components survives in the shipped demo.
3. **Preserve the existing design + i18n.** Brownfield — extend, don't rewrite. Every UI string stays in the EL/EN dictionary; semantic tokens only.
4. **Exit criteria are observable.** "Owner can log a service that persists" — not "DB works."

---

*Last updated: 2026-06-29*
