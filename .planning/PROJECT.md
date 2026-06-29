---
project_type: full
---

# Costas — Car Service Log

## Client
Demo (sales conversation — Cyprus market). Internal Qualia demo build.

## Project Type
**Demo** — a single shippable milestone. Built to win a client conversation: a real, working bilingual car-service log with a real backend (Supabase), not a mockup. Extensible into a full project via `/qualia-milestone` if the client signs.

## What We're Building
A bilingual (Greek / English) **car service-log** for the Cyprus market, with two perspectives on one shared service history:

- **Car owner** (`/`) — keeps the full service history of their vehicle: what was done, when, and where. Records new services from a curated list (Full service, MOT/ΜΟΤ, brakes, tyres, clutch, …).
- **Mechanic / workshop** (`/mechanic`) — a certified workshop records a job against a vehicle plate; the job lands in that vehicle's history.
- **Workshop registration** (`/register`) — a workshop signs up with name + certificate serial + an uploaded certificate document to activate a mechanic account.

The frontend already exists (Next.js 16 + React 19 + Tailwind v4, full bilingual UI, custom design system, accessible components). **The demo's job is to make it real** — replace the in-memory seed data with a real Supabase backend, real auth, and real persistence, and wire the currently dead-end navigation.

## Requirements
- [ ] Supabase backend: schema for vehicles, service entries, workshops, mechanic job logs — RLS on every table
- [ ] Real auth distinguishing the **owner** role from the **mechanic/workshop** role (lightest real auth that demonstrates both flows)
- [ ] Owner can log a service that **persists** (and capture *where* it was serviced — the model supports `place` but the form never sets it today)
- [ ] Mechanic can record a job against a plate that **persists** to that vehicle's history
- [ ] Workshop registration writes a real row; certificate uploads to Supabase Storage (real bucket + policies)
- [ ] Service history reads from the database, sorted, with proper empty states
- [ ] Bilingual EL/EN preserved end-to-end (the i18n dictionary stays the single source of UI strings)
- [ ] Deployed (Vercel) with HTTP 200 + auth flow verified

## Out of Scope
- Multi-vehicle management per owner beyond the demo vehicle (the `vehicles` nav can stay a focused stub or get a minimal real list — decided in roadmap)
- Settings page functionality (the `settings` nav)
- Payments, booking, scheduling, notifications
- Native mobile app
- Certificate *verification* workflow (admin approving a workshop) — registration captures it; approval is post-demo

## Stack
Next.js 16.2.9 (App Router, Turbopack) / React 19 / TypeScript / Tailwind v4 / Supabase (Auth + Postgres + Storage, RLS) / Vercel. `stack_id: full-app`.

## Design Direction
**Preserve and codify the existing design language** (this is brownfield — the current UI is clean and intentional). Clean & minimal "product" register: tinted-neutral light theme, semantic design tokens (`surface`, `foreground`, `muted`, `accent` indigo, `positive` green), Geist + Geist Mono, generous radii, restrained motion (popIn / sheetUp / slideIn). Greek-primary. See `.planning/DESIGN.md` — it documents what's already built so builders extend rather than reinvent.

## Decisions
| Decision | Why |
|----------|-----|
| Treat as a **demo** (1 milestone), not a full project | It lives in `demos/`, the goal is to win a client conversation; multi-milestone arc is deferred to `/qualia-milestone` if signed |
| **Brownfield** — extend the existing app, don't re-scaffold | A working bilingual frontend already exists; the value-add is a real backend, not a rewrite |
| **Supabase backend (real, no mocks)** | Demo philosophy is non-negotiable: real backend, real auth, real persistence. No seed-data-in-components in the shipped demo |
| **DESIGN.md documents the existing system** rather than proposing a new one | The current design is good and intentional; redesigning a working demo wastes effort and risks regression |
| i18n dictionary stays the single source of UI strings | Strongest existing convention; a missing translation is already a compile error — keep that guarantee |
