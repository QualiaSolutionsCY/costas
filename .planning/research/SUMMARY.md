# Research Summary — Costas demo (quick scope)

Two focused researchers ran (the risk-bearing dimensions for this brownfield demo): **STACK** (Next.js 16.2.9 conventions, from bundled docs) and **ARCHITECTURE** (Supabase + Next 16 integration). Features/Pitfalls were not separately fanned out — the feature set is already established by the existing app + PROJECT.md scope.

## Stack recommendation
Keep the existing **Next.js 16.2.9 / React 19 / Tailwind v4** frontend; add **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) for Auth + Postgres + Storage. Vercel for deploy. CLI-first Supabase (`npx supabase`, migrations in `supabase/migrations/`).

## Top 3 things that shape the build
1. **Next 16 broke things that look the same in training data.** `cookies()`/`headers()`/`params`/`searchParams` are **async-only** (await everywhere). `middleware.ts` is renamed `proxy.ts` (Node runtime) — though legacy `middleware.ts` still works and is what the Supabase guide uses; `@supabase/ssr` is Node-compatible either way. Turbopack is default; `revalidateTag` needs a 2nd `cacheLife` arg. → STACK.md.
2. **Auth = email + password** (the one recommendation). Lightest *real* auth that demonstrates the owner-vs-mechanic split with no SMTP setup; pre-seed `owner@…` + `mechanic@…`, stamp `app_metadata.role` via the service key, auto-confirm ON. → ARCHITECTURE.md §Recommended demo auth.
3. **4 tables + 1 storage bucket, RLS from migration #1.** `profiles`, `vehicles`, `service_entries` (kind = `owner_log`|`workshop_job`), `workshops`; private bucket `workshop-certs` needs INSERT+SELECT+UPDATE policies for upsert, files namespaced `{uid}/…`. Authorize on `app_metadata.role` via `auth.jwt()`, never `user_metadata`. Use `getClaims()` for the middleware check. → ARCHITECTURE.md §Schema + RLS.

## Table stakes (already built — preserve)
Bilingual EL/EN dictionary as single source of UI strings; custom accessible components; semantic design tokens. The DB layer must not regress these.

## Top pitfall
Copying a v15-era Supabase+Next snippet from memory: sync `cookies()`, single-cookie `get/set/remove`, edge middleware. All three are wrong for 16 — use async `cookies()`, `getAll`/`setAll`, Node runtime. Build from STACK.md + ARCHITECTURE.md, not from recall.
