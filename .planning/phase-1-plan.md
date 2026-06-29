---
phase: 1
goal: "The app talks to a real Supabase project with RLS on from the first migration, and a user can sign in as an owner or a mechanic."
tasks: 3
waves: 2
---

# Phase 1: Backend Foundation & Auth

**Goal:** The app talks to a real Supabase project with RLS on from the first migration, and a user can sign in as an owner or a mechanic — sessions persist across refresh, and the seeded `owner@…` / `mechanic@…` accounts land on the correct surface seeing only their entitled rows.
**Why this phase:** Every later flow (owner log, mechanic job, workshop registration) writes to and reads from this backend. Without a real Supabase client, an RLS-protected schema, and role-aware auth, the demo is still a mockup. This is the foundation the other three phases stand on.

> **Stack reality (do NOT recall from training data):** This is Next.js **16.2.9**. `cookies()` is async. `revalidateTag` needs a 2nd arg. Turbopack is default (no `--turbopack` flag). The `AGENTS.md` / `node_modules/next/dist/docs/` warning is real — the research files below override your memory. `middleware.ts` still works in 16 (renamed-but-supported as `proxy.ts`); the Supabase guide uses `middleware.ts`, so this plan uses `middleware.ts`.

---

## Task 1 — Supabase clients + middleware session refresh + env wiring
**Wave:** 1
**Persona:** backend
**Files:**
- `src/lib/supabase/client.ts` (create — exports `createClient()` browser factory)
- `src/lib/supabase/server.ts` (create — exports async `createClient()` + `createServiceClient()` server-only factory)
- `src/lib/supabase/middleware.ts` (create — exports `updateSession(request)`)
- `src/middleware.ts` (create — root middleware calling `updateSession` + matcher)
- `package.json` (modify — add `@supabase/ssr`, `@supabase/supabase-js`, `server-only`)
- `.env.local` (create — the three env vars from `.planning/env.required.json`, gitignored)
- `.env.example` (create — same keys, empty values, committed)

**Depends on:** none

**Why:** Server Components in Next 16 cannot write cookies, so session-token refresh must live in middleware or the user is silently logged out (AUTH-03). Every server action and page in later phases imports these factories — they are the single seam to Supabase. The `service_role` key must be quarantined to a server-only module so it can never reach the client bundle (constitution: "service_role key is server-only").

**Acceptance Criteria:**
- `src/lib/supabase/server.ts` exports an **async** `createClient()` (because `cookies()` is async in Next 16) and a separate `createServiceClient()` that uses `SUPABASE_SERVICE_ROLE_KEY` and is guarded by `import "server-only"`.
- `src/lib/supabase/client.ts` exports a `createClient()` browser factory using `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- A request to any route refreshes the session cookie via `middleware.ts` → `updateSession`; a logged-in user stays logged in after a refresh.
- `npx tsc --noEmit` passes; `SUPABASE_SERVICE_ROLE_KEY` appears in NO file under `src/` that is reachable from a `"use client"` component.

**Action:**
1. `npm i @supabase/ssr @supabase/supabase-js server-only` (these are NOT yet in `package.json` — current deps are only `next`, `react`, `react-dom`).
2. Create `src/lib/supabase/client.ts` exactly per `research/ARCHITECTURE.md §Client setup` — `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL!, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)`.
3. Create `src/lib/supabase/server.ts`: async `createClient()` awaiting `cookies()`, using `getAll`/`setAll` ONLY (the single-cookie `get/set/remove` API is deprecated), with the `try/catch` around `setAll` per the research file. Add a second export `createServiceClient()` that builds a `createServerClient`/`createClient` with `SUPABASE_SERVICE_ROLE_KEY`, no cookie persistence, and put `import "server-only";` at the top of this file so a client import hard-fails the build.
4. Create `src/lib/supabase/middleware.ts` exporting `updateSession(request)`: build `NextResponse.next({ request })`, create a server client whose `getAll` reads `request.cookies` and `setAll` writes to BOTH `request.cookies` and the response, then call `await supabase.auth.getClaims()`. **Put NO code between client creation and the `getClaims()` call** (Supabase warns this causes random logouts). Return the mutated response.
5. Create `src/middleware.ts` per `research/ARCHITECTURE.md §Middleware/session` — import `updateSession`, export `middleware`, export the `config.matcher` excluding `_next/static`, `_next/image`, `favicon.ico`, and image extensions.
6. Create `.env.local` with the three keys from `.planning/env.required.json` (operator fills real values — flag this to the operator). Create `.env.example` with the same keys and empty values. Confirm `.env*` is already in `.gitignore` (it is, line: `.env*`).

**Validation:** (builder self-check)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -rl "SUPABASE_SERVICE_ROLE_KEY" src/ | xargs grep -L 'server-only'` → empty (every file referencing the service key also imports `server-only`)
- `grep -c "getAll" src/lib/supabase/server.ts` → ≥ 1 (uses the non-deprecated cookie API)
- `grep -c "await cookies()" src/lib/supabase/server.ts` → ≥ 1 (async, Next 16 correct)

**Context:** Read @.planning/research/ARCHITECTURE.md (§Client setup, §Middleware/session), @.planning/research/STACK.md (§Middleware → Proxy, §Breaking changes), @.planning/env.required.json, @.planning/codebase/concerns.md, @rules/security.md, @rules/infrastructure.md

---

## Task 2 — Migration: schema + RLS on every table + `workshop-certs` Storage bucket
**Wave:** 1
**Persona:** security
**Files:**
- `supabase/migrations/<timestamp>_init_schema.sql` (create via `npx supabase migration new init_schema` — all DDL + RLS + bucket + storage policies)
- `supabase/config.toml` (created by `npx supabase init` — keep `auth.enable_confirmations = false` / email auto-confirm ON for the demo)
- `src/lib/supabase/database.types.ts` (create — generated by `npx supabase gen types`)

**Depends on:** none

**Why:** The constitution is non-negotiable: RLS on every table from migration #1, authorized on `app_metadata.role` / `auth.uid()`, never `user_metadata`. DATA-01 and DATA-02 require `profiles`, `vehicles`, `service_entries`, `workshops` to exist with policies that make an owner see only their vehicle's entries and a mechanic see only jobs they logged. The private `workshop-certs` bucket with INSERT+SELECT+UPDATE policies must exist now so Phase 3's upsert upload works without a schema change.

**Acceptance Criteria:**
- All four tables (`profiles`, `vehicles`, `service_entries`, `workshops`) exist with `ENABLE ROW LEVEL SECURITY` and explicit policies; `service_entries.kind` is constrained to `owner_log` | `workshop_job`.
- Owner SELECT/INSERT policies scope to `owner_id = auth.uid()`; mechanic INSERT on `service_entries` is gated by `auth.jwt()->'app_metadata'->>'role' = 'mechanic'`.
- A private bucket `workshop-certs` exists with INSERT + SELECT + UPDATE policies on `storage.objects` keyed to `(storage.foldername(name))[1] = auth.jwt()->>'sub'` (per-uid folder, required for upsert).
- `npx supabase db reset` applies the migration cleanly with no SQL errors; `database.types.ts` regenerates and `npx tsc --noEmit` still passes.

**Action:**
1. `npx supabase init` (scaffolds `supabase/`; this dir does NOT exist yet — verified). In `supabase/config.toml`, ensure email confirmations are OFF (auto-confirm ON) so seeded/sign-up accounts need no inbox (AUTH-04).
2. `npx supabase migration new init_schema`. In the generated SQL file, author the DDL for the four tables per `research/ARCHITECTURE.md §Schema + RLS sketch`:
   - `profiles(id uuid pk references auth.users, display_name text, role text, created_at timestamptz default now())`
   - `vehicles(id uuid pk default gen_random_uuid(), owner_id uuid references auth.users, plate text unique not null, make text, model text, year int)`
   - `service_entries(id uuid pk default gen_random_uuid(), vehicle_id uuid references vehicles, logged_by uuid references auth.users, kind text not null check (kind in ('owner_log','workshop_job')), description text, cost numeric, place text, service_date date, created_at timestamptz default now())`
   - `workshops(id uuid pk default gen_random_uuid(), owner_id uuid references auth.users, name text not null, cert_serial text, cert_path text, verified boolean default false, created_at timestamptz default now())`
3. `ALTER TABLE … ENABLE ROW LEVEL SECURITY` on all four, then author the policies from the research sketch verbatim — vehicles owner select/insert; service_entries select (own-vehicle OR logged_by) and insert (logged_by + own-vehicle OR mechanic role); workshops select/insert/update. **Every UPDATE policy has a matching SELECT policy** (constitution) — the workshops update + select pair satisfies this.
4. Create the `workshop-certs` bucket (private) and the three `storage.objects` policies (INSERT, SELECT, UPDATE) from `research/ARCHITECTURE.md §Storage` — all three are required for Phase 3's `upsert: true`.
5. Add a `handle_new_user()` trigger on `auth.users` that inserts a `profiles` row, so every signup has a profile.
6. `npx supabase start` then `npx supabase db reset` to apply locally. Then `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`.

**Validation:** (builder self-check)
- `npx supabase db reset 2>&1 | grep -iE "error|fail"` → empty (migration applies clean)
- `grep -c "ENABLE ROW LEVEL SECURITY" supabase/migrations/*_init_schema.sql` → ≥ 4 (one per table)
- `grep -c "app_metadata'->>'role'" supabase/migrations/*_init_schema.sql` → ≥ 1 (authorizes on app_metadata, not user_metadata)
- `grep -c "workshop-certs" supabase/migrations/*_init_schema.sql` → ≥ 4 (bucket create + 3 storage policies)
- `grep -c "user_metadata" supabase/migrations/*_init_schema.sql` → `0` (never authorize on user-editable metadata)

**Context:** Read @.planning/research/ARCHITECTURE.md (§Schema + RLS sketch, §Storage, §Migrations flow), @.planning/CONTEXT.md (Flagged ambiguities — role lives in app_metadata), @rules/security.md, @rules/constitution.md (Supabase security + Schema flow)

---

## Task 3 — Email/password auth: login/logout, role routing, seeded accounts, bilingual strings
**Wave:** 2
**Persona:** backend
**Files:**
- `src/app/login/page.tsx` (create — bilingual login form, Server-Component shell wrapping a client form)
- `src/app/login/actions.ts` (create — `'use server'` actions: `signIn`, `signOut`)
- `src/components/LoginForm.tsx` (create — `"use client"` form using existing token classes + `useLang`)
- `src/app/auth/confirm/route.ts` (create — auth callback route handler, async `cookies()`)
- `src/lib/auth.ts` (create — `getSessionRole()` server helper reading `app_metadata.role` from claims)
- `src/app/page.tsx` (modify — gate to authenticated `owner`; redirect unauthenticated → `/login`, mechanic → `/mechanic`)
- `src/app/mechanic/page.tsx` (modify — gate to authenticated `mechanic`; redirect unauthenticated → `/login`, owner → `/`)
- `src/lib/i18n.ts` (modify — add the `auth` block of strings in BOTH `el` and `en`)
- `supabase/seed.sql` (create — seeds `owner@costas.demo` + `mechanic@costas.demo`, stamps `app_metadata.role`, creates the demo `vehicles` row + a `service_entries` row so RLS scoping is demonstrable)

**Depends on:** Task 1 (imports `src/lib/supabase/server.ts`, `client.ts`), Task 2 (needs `profiles`/`vehicles` tables + role stamping target; `supabase/` dir + `database.types.ts`)

**Why:** AUTH-01/02/04 and DATA-02 turn the static frontend into a real two-role app: a user signs in with email+password, the session persists, and `app_metadata.role` (server-controlled, never `user_metadata` — CONTEXT.md "role lives in `app_metadata`") routes owner to `/` and mechanic to `/mechanic`. Seeded accounts let the demo show both sides instantly with no inbox. Without the seed `vehicles`+`service_entries` rows, DATA-02 ("two users see correctly scoped data") cannot be demonstrated.

**Acceptance Criteria:**
- Visiting `/` or `/mechanic` while signed out redirects to `/login`. The login form is bilingual (EL default), uses the existing token classes (`bg-surface-2`, `bg-foreground`, `text-muted`, `rounded-lg`) — no raw hex, no native `<select>`.
- Signing in as `owner@costas.demo` lands on `/` (owner surface); signing in as `mechanic@costas.demo` lands on `/mechanic`. An owner hitting `/mechanic` is redirected to `/`, and a mechanic hitting `/` is redirected to `/mechanic`.
- After sign-in, refreshing the page keeps the user logged in (session persists — AUTH-01/03). Sign-out clears the session and returns to `/login`.
- Both seeded accounts exist with `app_metadata.role` stamped; the seeded owner sees the demo vehicle's `service_entries` and the mechanic sees only the job they logged (DATA-02 — verifiable by signing in as each).

**Action:**
1. Add an `auth` block to `Translation` in `src/lib/i18n.ts` (a missing translation is a build error — keep that guarantee). Add to BOTH `el` and `en`: `signInTitle`, `emailLabel`, `passwordLabel`, `signInBtn`, `signOutBtn`, `signInError` (human, actionable per PRODUCT brand voice — e.g. EL `"Λάθος email ή κωδικός"` / EN `"Wrong email or password"`), `signingIn`. Mirror the existing `Translation` type shape (nested object or flat keys consistent with current style).
2. Create `src/lib/auth.ts` exporting `getSessionRole()`: `await createClient()` (server), `const { data } = await supabase.auth.getClaims()`, return `{ uid, role }` from `data.claims.app_metadata?.role` (or `null` if unauthenticated). This is the Data-Access-Layer authz check (STACK.md: real authz belongs near the data, not in middleware).
3. Create `src/app/login/actions.ts` (`'use server'`): `signIn(formData)` calls `supabase.auth.signInWithPassword({ email, password })`, validates with Zod first (`z.object({ email: z.string().email(), password: z.string().min(1) })`), and on success reads the role and `redirect()`s (`/` for owner, `/mechanic` for mechanic). `signOut()` calls `supabase.auth.signOut()` then `redirect('/login')`. Verify input server-side — never trust the client (STACK.md §Server Actions).
4. Create `src/components/LoginForm.tsx` (`"use client"`): a `<form action={signIn}>` with email + password inputs styled with the existing input classes from DESIGN.md §5, a primary button (`bg-foreground … text-surface`), `useActionState` for pending + error display, and `useLang()` for all copy. Render via `src/app/login/page.tsx` (Server Component shell, can hold `generateMetadata`/`metadata`).
5. Create `src/app/auth/confirm/route.ts` — auth callback Route Handler reading async `cookies()` and exchanging the code (per STACK.md §Route Handlers — params/cookies async). Keep it minimal; email auto-confirm is ON so this is the standard `verifyOtp`/`exchangeCodeForSession` callback.
6. Gate `src/app/page.tsx`: make it an async Server Component that calls `getSessionRole()`; if `null` → `redirect('/login')`, if `role === 'mechanic'` → `redirect('/mechanic')`, else render `<AppShell><ServiceLog /></AppShell>` as today. Gate `src/app/mechanic/page.tsx` symmetrically (mechanic-only; owner → `/`, unauth → `/login`). Wire a sign-out control (calling the `signOut` action) into the existing surface — the `Topbar`/`Sidebar` is the natural home; reuse `Icon name="key"` or `"close"`, no new icon set.
7. Create `supabase/seed.sql`: insert two `auth.users` via the seed (email `owner@costas.demo`, `mechanic@costas.demo`, password e.g. `demo1234`, `email_confirmed_at` set), stamp `raw_app_meta_data` with `{"role":"owner"}` / `{"role":"mechanic"}`, create the demo `vehicles` row (`plate = 'ΚΧΡ 412'`, `model = 'VW Golf 2019'`, `owner_id` = the owner) and one `service_entries` row each (an `owner_log` on that vehicle, and a `workshop_job` `logged_by` the mechanic) so DATA-02 scoping is observable. Reference the seed from `config.toml` so `db reset` runs it.

**Validation:** (builder self-check)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -c "signInWithPassword" src/app/login/actions.ts` → ≥ 1 (real auth call, not a stub)
- `grep -c "redirect" src/app/page.tsx` → ≥ 1 AND `grep -c "getSessionRole\|getClaims" src/app/page.tsx src/lib/auth.ts` → ≥ 1 (page is gated by real role check)
- `grep -c "signInWithPassword\|signIn" src/components/LoginForm.tsx src/app/login/actions.ts | paste -sd+ | bc` → ≥ 1 (form is wired to the action, not dead)
- `node -e "const fs=require('fs');const s=fs.readFileSync('src/lib/i18n.ts','utf8');process.exit((s.match(/signInBtn/g)||[]).length>=2?0:1)"` → exit 0 (the auth string exists in both `el` and `en`)
- `grep -c "app_meta" supabase/seed.sql` → ≥ 2 (both roles stamped on app_metadata)

**Context:** Read @.planning/research/STACK.md (§Server Actions, §Route Handlers, §Server/Client components, §Middleware), @.planning/research/ARCHITECTURE.md (§Recommended demo auth, §Schema + RLS — role stamping), @.planning/DESIGN.md (§2 Color, §3 Typography, §5 Components, §10 Anti-pattern checklist), @.planning/PRODUCT.md (Brand voice — errors human/actionable), @src/lib/i18n.ts, @src/components/LanguageProvider.tsx, @src/app/page.tsx, @src/app/mechanic/page.tsx, @src/components/AppShell.tsx, @rules/security.md

**Design:**
- Register: product
- Tokens used: `bg-surface`, `bg-surface-2`, `bg-foreground`, `text-surface`, `text-muted`, `border`, `rounded-lg`, `rounded-xl`, `text-positive` (saved/confirm), `text-negative` (error)
- Scope: page (`/login`) + topbar control
- Anti-pattern guard: no raw hex / default Tailwind palette in JSX; every string via `t.*` present in both `el` and `en`; Geist face (no `Inter`/`system-ui` primary); a11y labels + keyboard on the form inputs; loading + error states on the sign-in form

---

## Success Criteria
- [ ] A user can sign in and sign out with email + password; refresh keeps them logged in (AUTH-01, AUTH-03).
- [ ] A signed-in user is owner or mechanic per `app_metadata.role` (server-set) and lands on the matching surface (AUTH-02).
- [ ] Seeded `owner@costas.demo` + `mechanic@costas.demo` accounts exist with auto-confirm on (AUTH-04).
- [ ] `profiles`, `vehicles`, `service_entries`, `workshops` exist via migration with RLS enabled and policies on `auth.uid()` / `app_metadata.role`; a private `workshop-certs` bucket exists with INSERT+SELECT+UPDATE policies (DATA-01).
- [ ] Signing in as the seeded owner vs mechanic shows only entitled rows — RLS verified with two users (DATA-02).
- [ ] EL/EN preserved: every new auth string is in both languages (a missing translation is a build error).

## Verification Contract

### Contract for Task 1 — Supabase clients (files exist)
**Check type:** file-exists
**Command:** `test -f src/lib/supabase/client.ts && test -f src/lib/supabase/server.ts && test -f src/lib/supabase/middleware.ts && test -f src/middleware.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Any of the four client/middleware files is missing.

### Contract for Task 1 — service key quarantined (security)
**Check type:** command-exit
**Command:** `grep -rl "SUPABASE_SERVICE_ROLE_KEY" src/ | xargs -r grep -L 'server-only' | wc -l`
**Expected:** `0`
**Fail if:** Any file referencing the service-role key does not import `server-only` (key could reach the client bundle).

### Contract for Task 1 — async cookies + non-deprecated cookie API
**Check type:** grep-match
**Command:** `grep -c "await cookies()" src/lib/supabase/server.ts; grep -c "getAll" src/lib/supabase/server.ts`
**Expected:** Both ≥ 1
**Fail if:** Either returns 0 — server client is not Next-16-correct (sync cookies) or uses the deprecated single-cookie API.

### Contract for Task 2 — RLS on every table
**Check type:** grep-match
**Command:** `grep -c "ENABLE ROW LEVEL SECURITY" supabase/migrations/*_init_schema.sql`
**Expected:** Non-zero (≥ 4 — one per table)
**Fail if:** Fewer than 4 — a table is missing RLS (constitution violation).

### Contract for Task 2 — authorizes on app_metadata, never user_metadata
**Check type:** command-exit
**Command:** `grep -c "user_metadata" supabase/migrations/*_init_schema.sql`
**Expected:** `0`
**Fail if:** Any policy references `user_metadata` (user-editable → auth bypass).

### Contract for Task 2 — Storage bucket + policies
**Check type:** grep-match
**Command:** `grep -c "workshop-certs" supabase/migrations/*_init_schema.sql`
**Expected:** Non-zero (≥ 4 — bucket create + INSERT + SELECT + UPDATE policies)
**Fail if:** Fewer than 4 — upsert in Phase 3 will fail.

### Contract for Task 2 — migration applies clean
**Check type:** command-exit
**Command:** `npx supabase db reset 2>&1 | grep -ciE "error|failed"`
**Expected:** `0`
**Fail if:** Migration or seed raises a SQL error.

### Contract for Task 3 — login wired to real auth call
**Check type:** grep-match
**Command:** `grep -c "signInWithPassword" src/app/login/actions.ts`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — login action is a stub, not a real Supabase sign-in.

### Contract for Task 3 — pages gated by role
**Check type:** grep-match
**Command:** `grep -c "redirect" src/app/page.tsx; grep -c "getSessionRole\|getClaims" src/app/page.tsx src/lib/auth.ts`
**Expected:** Both ≥ 1
**Fail if:** `src/app/page.tsx` has no redirect or no role check — surfaces are unguarded.

### Contract for Task 3 — bilingual auth strings
**Check type:** command-exit
**Command:** `node -e "const s=require('fs').readFileSync('src/lib/i18n.ts','utf8');process.exit((s.match(/signInBtn/g)||[]).length>=2?0:1)"`
**Expected:** exit `0`
**Fail if:** `signInBtn` does not appear in both `el` and `en` (a missing translation is a build error).

### Contract for Task 3 — seeded accounts with roles
**Check type:** grep-match
**Command:** `grep -c "app_meta" supabase/seed.sql; grep -c "owner@costas.demo\|mechanic@costas.demo" supabase/seed.sql`
**Expected:** Both ≥ 2
**Fail if:** Both seed accounts are not present with `app_metadata.role` stamped.

### Contract for Phase (compiles)
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript compilation error across the touched files.
