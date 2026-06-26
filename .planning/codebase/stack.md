# Stack

**Type:** Frontend-only Next.js demo. No backend, no DB, no auth, no API routes.

## Runtime & framework
- **Next.js 16.2.9** (App Router, Turbopack) — `next.config.ts` pins `turbopack.root` to ignore stray parent lockfiles.
- **React 19.2.4** / react-dom 19.2.4
- **TypeScript 5** (strict via `tsconfig.json`), path alias `@/*` → `src/*`.

## Styling
- **Tailwind CSS v4** via `@tailwindcss/postcss` (PostCSS plugin model — no `tailwind.config.js`).
- Design tokens defined as CSS custom properties in `src/app/globals.css` under `:root`, exposed to Tailwind through `@theme inline` (e.g. `--color-surface`, `--color-foreground`, `--color-accent`, `--color-positive`). Light theme only.
- Fonts: **Geist** + **Geist Mono** via `next/font/google`.

## Key libraries
- **None beyond the framework.** Dependencies are exactly `next`, `react`, `react-dom`. No state manager, no form lib, no i18n lib, no UI kit, no data layer — all hand-rolled (custom React context for i18n, custom listbox, custom icon set).

## Tooling
- **ESLint 9** with `eslint-config-next` 16.2.9 (`eslint.config.mjs`, flat config).
- Scripts: `dev` / `build` / `start` / `lint` (all stock Next.js). No test runner configured.

## Hosting / CI
- **None detected.** No Vercel config, no `railway.*`, no GitHub Actions, no Dockerfile. No git remote set.
- Supabase / OpenRouter / voice stack from the Qualia defaults are **not** present — this is a static demo.

## Versions snapshot
| Thing | Version |
|---|---|
| next | 16.2.9 |
| react / react-dom | 19.2.4 |
| typescript | ^5 |
| tailwindcss | ^4 |
| eslint | ^9 |
| @types/node | ^20 |
