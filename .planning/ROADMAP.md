# Roadmap · Milestone 6 · Handoff

**Project:** Costas — Car Service Log
**Milestone:** 6 of 6 (CURRENT · FINAL)
**Created:** 2026-06-29
**Phases:** 4
**Requirements covered:** HAND-01..15

See `JOURNEY.md` for the full project arc. This file covers Milestone 6's phases only.

## Context

M1–M5 are shipped and the production demo is **live and public** at https://costas-chi.vercel.app (verified HTTP 200, no SSO gate, on all 12 routes — 2026-06-29). All four capability areas exist: owner logging + multi-vehicle, mechanic visual flow, workshop registration + admin verification, booking & scheduling, reminders & notifications — bilingual EL/EN throughout.

This milestone takes the working platform from "built and live" to "client-owned": a final polish pass, real production content + SEO + analytics, exhaustive cross-browser QA of every journey, and a formal handoff package (credentials, runbook, walkthrough, verified deploy).

**Foundation available:**
- Live production deploy on Vercel (`qualiaproduction` team, project `prj_7rkP7JF97A0QGONyNsUIHenij6wp`), public, HTTP 200.
- 11 Supabase migrations applied; RLS on every table (demo-permissive `using(true)` — see Final-QA note).
- Full bilingual EL/EN string coverage (215/215 at last build).
- DESIGN.md design system in place across all surfaces.

## Exit Criteria

- Every user-facing surface passes the a11y + responsive bar; EL/EN copy is final; analytics are wired.
- A full-flow test of every primary journey (owner, mechanic, admin, reminder) passes on the live production URL.
- Client has credentials, runbook, and recorded walkthrough; `.planning/archive/` contains all milestone verification reports.

---

## Phases

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Polish | Final design pass on all M2–M5 surfaces — states, responsive, a11y, EL/EN copy completeness | HAND-01, HAND-02, HAND-03 | ready |
| 2 | Content + SEO | Real Greek-primary copy, meta tags, OG image, sitemap.xml, robots.txt, analytics | HAND-04, HAND-05, HAND-06 | — |
| 3 | Final QA | Full-flow tests across all four journeys, cross-browser, `/qualia-review` blockers resolved | HAND-07, HAND-08, HAND-09 | — |
| 4 | Handoff | Credentials doc, README update, recorded walkthrough, production URL verification, final `/qualia-report` | HAND-10..15 | — |

---

## Phase Details

### Phase 1: Polish

**Goal:** Every M2–M5 surface (admin verification, settings/profile/vehicles, booking, incoming bookings, reminders, notifications) passes the design quality bar — all interactive elements have loading/empty/error/confirm states, layouts hold at 375px and 1440px, a11y (labels, focus, contrast, keyboard nav) is clean, and EL/EN copy is complete with no missing keys or English leak in Greek mode.

**Requirements covered:**
- HAND-01: Final states/responsive/a11y pass on all M2–M5 surfaces.
- HAND-02: EL/EN copy completeness — no missing keys, no untranslated strings.
- HAND-03: `prefers-reduced-motion` honored; motion intent consistent.

**Success criteria** (observable):
1. Every interactive surface added in M2–M5 renders loading, empty, and error states (and confirm where destructive) — verified by inspection at each route.
2. No layout break at 375px or 1440px on any M2–M5 route.
3. EL/EN string parity holds (build-time count equal); switching language shows no English leak on Greek surfaces.
4. `npx tsc --noEmit` exits 0; no `TODO`/`FIXME` in touched files.

### Phase 2: Content + SEO

**Goal:** Replace placeholder copy with final Greek-primary content; wire production SEO (per-route meta, OG image, sitemap.xml, robots.txt) and privacy-respecting analytics.

**Requirements covered:**
- HAND-04: Final Greek-primary copy across public surfaces.
- HAND-05: SEO — per-route meta tags, OG image, sitemap.xml, robots.txt.
- HAND-06: Analytics wired (Plausible / PostHog).

**Success criteria** (observable):
1. Each public route emits a unique, accurate `<title>` + meta description in EL.
2. `sitemap.xml` and `robots.txt` are served and valid; an OG image renders in a link-preview check.
3. Analytics fires a pageview on navigation (verified in the provider dashboard or network tab).

### Phase 3: Final QA

**Goal:** Exhaustive real-browser QA of every primary journey on the live URL across Chrome/Firefox/Safari, with all `/qualia-review` blockers resolved.

**Requirements covered:**
- HAND-07: Full-flow test of all four journeys (owner, mechanic, admin, reminder) passes on production.
- HAND-08: Cross-browser pass (Chrome + Firefox + Safari).
- HAND-09: `/qualia-review` run; CRITICAL/HIGH findings resolved.

**Success criteria** (observable):
1. Each of the four journeys completes end-to-end on https://costas-chi.vercel.app without console errors.
2. No layout/interaction regression across the three browsers.
3. `/qualia-review` shows zero unresolved CRITICAL/HIGH findings (note: demo-permissive `using(true)` RLS is a documented, accepted demo posture — tightening to per-user policies is a pre-real-launch task, not a demo blocker).

### Phase 4: Handoff

**Goal:** Produce the client-ownership package and verify the final production state.

**Requirements covered:**
- HAND-10..15: Credentials doc, README update, recorded walkthrough, production URL verification, archive of milestone verification reports, final `/qualia-report`.

**Success criteria** (observable):
1. A credentials/runbook doc exists (Supabase project, Vercel project, seeded accounts, env vars) — secrets referenced, not committed.
2. README updated to orient a new owner (what it is, how to run, where the source of truth lives).
3. Recorded walkthrough covering all four roles is linked.
4. Production URL re-verified HTTP 200 + auth flow; `.planning/archive/` holds all milestone verification reports; final `/qualia-report` filed.

---

*Last updated: 2026-06-29*
