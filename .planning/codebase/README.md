# Codebase Map

**Scanned:** 2026-06-26
**Repo:** costas
**LOC:** 1,202 (src/, 16 source files)

## At a Glance

- **Stack:** Next.js 16.2.9 (App Router, Turbopack) · React 19 · TypeScript 5 · Tailwind v4 — frontend-only, zero non-framework deps.
- **Architecture:** Bilingual (Greek/English) car **service-log** demo with three routes — owner view (`/`), mechanic view (`/mechanic`), workshop registration (`/register`) — layered as routes=wiring, components=logic, lib=pure data/types.
- **Conventions:** Client components with local `useState`; one React context for language; all UI text + sample data flow through a typed i18n dictionary; semantic Tailwind tokens only, never raw hex.
- **Concerns:** 0 security issues; ~4 MEDIUM (no persistence by design, dead-end nav, owner form can't set `place`, no upload validation), several LOW.

## Validated Capabilities (Inferred)

Based on existing code, this project already does:
- **Bilingual EL/EN UI with persisted preference** — context + dictionary, localStorage (evidence: `src/components/LanguageProvider.tsx`, `src/lib/i18n.ts`)
- **Car-owner service log** — record a service (type + date), view sorted history timeline (evidence: `src/components/ServiceLog.tsx`)
- **Mechanic job log** — record work against a vehicle plate, confirmation toast, recent-entries list (evidence: `src/components/MechanicLog.tsx`)
- **Workshop registration** — name + cert serial + certificate upload (drag-drop, image preview, file size), success summary screen (evidence: `src/components/RegisterForm.tsx`)
- **Responsive app shell** — desktop sidebar + mobile drawer, sticky topbar (evidence: `src/components/AppShell.tsx`)
- **Custom accessible service picker** — desktop popover / mobile bottom-sheet listbox with keyboard + click-outside (evidence: `src/components/ServiceSelect.tsx`)
- **Token-based design system** — CSS custom properties surfaced to Tailwind v4 (evidence: `src/app/globals.css`)

These become **Validated reqs** in PROJECT.md when `/qualia-new` runs. The natural NEW frontier: persistence/backend (Supabase), auth, wiring the `vehicles`/`settings` nav, and an owner-side "where was it serviced" input.

## Dimension Details

- [Architecture](./architecture.md)
- [Stack](./stack.md)
- [Conventions](./conventions.md)
- [Concerns](./concerns.md)
- [Onboarding adapter](./onboarding.md)

## Onboarding adapter snapshot

- **Issue tracker:** none; Qualia uses `.planning/decisions/` + `tracking.json`. No git remote, no GitHub repo.
- **Domain docs:** none; Qualia creates `.planning/CONTEXT.md`.
- **Existing agent files:** `CLAUDE.md` (→ `@AGENTS.md`) and `AGENTS.md` (Next 16 breaking-change warning). Qualia appends, never overwrites.
