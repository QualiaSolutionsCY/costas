---
phase: 1
goal: "admin@costas.com can sign in, land on a protected /admin route, and review every PENDING workshop with certificate preview — no non-admin can reach the route or its data"
tasks: 3
waves: 2
---

# Phase 1: Admin Surface & Data Layer

**Goal:** The `admin@costas.com` user (role=`admin` in `app_metadata`) can sign in, land on a protected `/admin` route, and see every workshop with `status = pending` — name, serial, registration timestamp, and a signed certificate preview link — while owner/mechanic users hitting `/admin` are redirected to `/` and never receive admin data in the response.
**Why this phase:** M1 captures workshop registrations but nothing reviews them. This phase adds the verification data model and the read-only admin surface that the approve/reject actions in Phase 2 will act on.

> **Migration application:** The live Supabase project is provisioned via the Supabase MCP (project id `kxjzntbilkkskpfgcelr`). The builder WRITES the `.sql` migration file and the app code; the OPERATOR applies the migration through the MCP (`apply_migration`). Do NOT assume `npx supabase` CLI link works. Each task that depends on the migration notes this and proceeds against the regenerated `database.types.ts`, which is the contract the app compiles against.

---

## Task 1 — Schema: workshop verification columns + admin RLS + typegen
**Wave:** 1
**Persona:** backend
**Files:**
- `supabase/migrations/0006_workshop_verification.sql` (create)
- `src/lib/database.types.ts` (modify — add the three columns to the `workshops` Row/Insert/Update)
**Depends on:** none

**Why:** VERIF-07 and success-criterion 3 require the `workshops` table to carry review state (`status`, `reviewed_at`, `rejection_reason`) and an admin-only `SELECT` policy. Without these columns there is nothing for the admin surface to read and no row-level guarantee that only an admin can read every workshop. The app compiles against `database.types.ts`, so the generated types must match the new schema or every workshops query is a type error.

**Acceptance Criteria:**
- The migration adds `status text not null default 'pending' check (status in ('pending','verified','rejected'))`, `reviewed_at timestamptz` (nullable), and `rejection_reason text` (nullable) to `public.workshops`; all pre-existing rows are `pending` by virtue of the default.
- The migration adds an admin-scoped RLS policy `CREATE POLICY "workshops_admin_all" ON public.workshops FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');` — additive, leaving the existing `workshops_select_own` / `workshops_insert_own` / `workshops_update_own` policies (migration 0001:100-105) untouched.
- `src/lib/database.types.ts` `workshops` `Row` gains `status: string`, `reviewed_at: string | null`, `rejection_reason: string | null`; `Insert` gains `status?: string`, `reviewed_at?: string | null`, `rejection_reason?: string | null`; `Update` gains the same three as optional.
- A header comment in the migration states: "Applied via Supabase MCP (project kxjzntbilkkskpfgcelr) by operator — not the CLI."

**Action:**
1. Create `supabase/migrations/0006_workshop_verification.sql`. Use `alter table public.workshops add column ...` for the three columns (status with the CHECK constraint and `default 'pending'`). Then the `workshops_admin_all` policy exactly as quoted above. RLS is already enabled on `workshops` (migration 0001:62) — do not re-enable.
2. Hand-edit `src/lib/database.types.ts` (lines 104-130, the `workshops` block) to add the three fields to `Row`, `Insert`, and `Update` matching the shapes in Acceptance Criteria. Do NOT run `npx supabase gen types` (CLI link is not assumed) — edit by hand to match the migration exactly.
3. Add the operator note comment at the top of the `.sql` file.

**Validation:** (builder self-check)
- `grep -c "status\|reviewed_at\|rejection_reason" supabase/migrations/0006_workshop_verification.sql` → ≥ 3
- `grep -c "workshops_admin_all" supabase/migrations/0006_workshop_verification.sql` → 1
- `grep -c "reviewed_at" src/lib/database.types.ts` → ≥ 3 (Row + Insert + Update)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → 0

**Context:** Read @supabase/migrations/0001_init_schema.sql (workshops table 40-47, RLS 99-105, current_role_claim helper 52-55), @supabase/migrations/0003_allow_admin_role.sql (admin role precedent), @src/lib/database.types.ts (workshops block to extend, 104-130)

---

## Task 2 — Extend role plumbing: getSessionRole + sign-in routing for admin
**Wave:** 1
**Persona:** security
**Files:**
- `src/lib/session.ts` (modify — `SessionRole` type + `getSessionRole`)
- `src/lib/auth-actions.ts` (modify — `signIn` redirect branch)
**Depends on:** none

**Why:** VERIF-01 requires the admin to sign in and land on the admin surface. Today `getSessionRole()` (session.ts:37-41) only returns `'owner' | 'mechanic'` — an `admin` JWT resolves to `null`, so any route gating on it would treat the admin as unauthenticated. And `signIn` (auth-actions.ts:46) routes mechanic→`/mechanic`, everyone else→`/`, so the admin would land on the owner app, not `/admin`. Both seams must learn the `admin` role for the protected route in Task 3 to function.

**Acceptance Criteria:**
- `getSessionRole()` returns `'admin'` when the verified `app_metadata.role` claim is `"admin"`, in addition to the existing `'owner'`/`'mechanic'`; it still returns `null` for any unrecognized value or unauthenticated request.
- The exported `SessionRole` type is `"owner" | "mechanic" | "admin"`.
- After a successful sign-in, an `admin@costas.com` session is redirected to `/admin`; mechanic still goes to `/mechanic`; owner still goes to `/`.
- Authorization is still read ONLY from `app_metadata` (never `user_metadata`) — the existing comment guarantee at session.ts:32-36 is preserved.

**Action:**
1. In `src/lib/session.ts`: change `export type SessionRole = "owner" | "mechanic";` (line 4) to include `"admin"`. In `getSessionRole` (line 40), change the guard to `return role === "owner" || role === "mechanic" || role === "admin" ? role : null;`.
2. In `src/lib/auth-actions.ts` `signIn` (the final `redirect(...)` call, line 46): replace the two-way ternary with an explicit branch — `redirect(role === "admin" ? "/admin" : role === "mechanic" ? "/mechanic" : "/");`. Keep `redirect()` outside any try/catch exactly as it is now (it throws control flow).

**Validation:** (builder self-check)
- `grep -c '"admin"' src/lib/session.ts` → ≥ 2 (type + guard)
- `grep -c '"/admin"' src/lib/auth-actions.ts` → 1
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → 0

**Context:** Read @src/lib/session.ts (full — getClaims, getUser, getSessionRole), @src/lib/auth-actions.ts (signIn redirect logic)

---

## Task 3 — Protected /admin route: pending-workshops review list with cert preview
**Wave:** 2
**Persona:** frontend
**Files:**
- `src/app/admin/page.tsx` (create — async server component: role gate + data fetch + signed URLs)
- `src/components/AdminReviewList.tsx` (create — `"use client"` list rendering bilingual strings via `useLang()`)
- `src/lib/i18n.ts` (modify — add admin keys to the `Translation` type and BOTH `el` + `en` dictionaries)
**Depends on:** Task 1 (workshops `status`/`cert_path` columns + admin RLS + regenerated types), Task 2 (`getSessionRole` returns `'admin'`)

**Why:** VERIF-01, VERIF-02 and VERIF-07 converge here: the admin lands on a real surface that lists every `pending` workshop with a previewable certificate, and the surface refuses non-admins. The certificate bucket is private (migration 0001:130) so signed URLs must be minted server-side; the page is therefore a server component that gates by role, queries the workshops, signs each cert path, and hands plain data to a client list that renders Greek-primary bilingual UI through the existing `useLang()` context.

**Acceptance Criteria:**
- Visiting `/admin` while signed in as `admin@costas.com` renders a page listing every workshop where `status = 'pending'`, each row showing: workshop name, certificate serial (mono, `tabular-nums`), registration timestamp (formatted), and a "View certificate" link that opens the signed cert URL in a new tab.
- Visiting `/admin` as owner or mechanic (or unauthenticated) issues a `redirect('/')` BEFORE any workshop data is fetched — the response body contains no admin data.
- When there are no pending workshops, an empty state is shown (not a blank page) using a bilingual string.
- All UI text comes from `t.*` (i18n), present in BOTH `el` and `en`; the page is Greek-primary by default. No raw hex in JSX — only semantic Tailwind tokens (`bg-surface`, `text-muted`, `text-positive`, `border`, etc.). Certificate signed URLs use a short TTL (60s) and are generated with `createSignedUrl`.

**Action:**
1. `src/lib/i18n.ts`: add these keys to the `Translation` type and to BOTH dictionaries (a missing key is a compile error). Suggested keys + values:
   - `adminTitle` — el: "Επαλήθευση Συνεργείων" / en: "Workshop Verification"
   - `adminSubtitle` — el: "Συνεργεία σε αναμονή έγκρισης." / en: "Workshops awaiting approval."
   - `adminPendingCount` — `(n: number) => string` — el: ``${n} σε αναμονή`` / en: ``${n} pending``
   - `adminColName` — el: "Συνεργείο" / en: "Workshop"
   - `adminColSerial` — el: "Σειριακός" / en: "Serial"
   - `adminColRegistered` — el: "Εγγραφή" / en: "Registered"
   - `adminViewCert` — el: "Προβολή πιστοποιητικού" / en: "View certificate" (note: a similar `viewCert` already exists at i18n.ts:226 — reuse `viewCert` instead of adding a duplicate if the wording matches; only add `adminViewCert` if you need different copy)
   - `adminEmpty` — el: "Κανένα συνεργείο σε αναμονή" / en: "No workshops pending review"
2. `src/app/admin/page.tsx` (server component, `async function`):
   - `const role = await getSessionRole();` then `if (role !== "admin") redirect("/");` (import `redirect` from `next/navigation`, `getSessionRole` from `@/lib/session`).
   - `const supabase = await createClient();` (from `@/lib/supabase/server`). Query: `supabase.from("workshops").select("id, name, serial, cert_path, created_at").eq("status", "pending").order("created_at", { ascending: false })`. The admin RLS policy from Task 1 authorizes this read.
   - For each row with a `cert_path`, mint a signed URL: `await supabase.storage.from("workshop-certs").createSignedUrl(row.cert_path, 60)` and attach `signedUrl` to the row object (null when no cert).
   - Render a header (logo block + `LanguageToggle`, mirroring `src/app/login/page.tsx:18-29`) and pass the prepared array to `<AdminReviewList workshops={...} />`. Keep the page a Server Component; the client list reads `useLang()`.
3. `src/components/AdminReviewList.tsx` (`"use client"`): accept `workshops: { id: string; name: string; serial: string; created_at: string; signedUrl: string | null }[]`. Use `const { t } = useLang();`. Render `t.adminTitle`, `t.adminSubtitle`, `t.adminPendingCount(workshops.length)`, then a list of cards (`rounded-xl border bg-surface p-4` per DESIGN.md §5) — name (`font-medium`), serial (`font-mono tabular-nums text-muted`), formatted `created_at`, and an `<a target="_blank" rel="noopener noreferrer">` "View certificate" link when `signedUrl` is present. Render the `t.adminEmpty` empty state when the array is empty. Use the existing `<Icon name="shield" />` / `<Icon name="file" />` glyphs (icons.tsx) for affordance.

**Validation:** (builder self-check)
- `grep -c 'getSessionRole' src/app/admin/page.tsx` → 1 and `grep -c 'redirect("/")' src/app/admin/page.tsx` → ≥ 1
- `grep -c 'createSignedUrl' src/app/admin/page.tsx` → 1
- `grep -c 'AdminReviewList' src/app/admin/page.tsx` → 1 (imported + used)
- `grep -c 'adminTitle\|adminEmpty' src/lib/i18n.ts` → ≥ 4 (type + both langs, each key)
- `grep -rniE "#[0-9a-f]{3,6}" src/app/admin/page.tsx src/components/AdminReviewList.tsx` → 0 (no raw hex)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → 0

**Context:** Read @src/app/login/page.tsx (header + LanguageToggle pattern to mirror), @src/lib/session.ts (getSessionRole), @src/lib/supabase/server.ts (createClient seam), @src/lib/register-actions.ts (createSignedUrl usage at 76-79, CERT_BUCKET constant), @src/components/LanguageProvider.tsx (useLang contract), @src/lib/i18n.ts (Translation type + dictionaries to extend), @.planning/DESIGN.md (tokens + card/input patterns)

**Design:**
- Register: product
- Tokens used: `bg-background`, `bg-surface`, `bg-surface-2`, `text-foreground`, `text-muted`, `text-positive`, `text-accent`, `border`, `rounded-xl`, `rounded-lg`, `font-mono`/`tabular-nums` (for serial + date)
- Scope: page (`/admin`) + one list component
- States required: populated list AND empty state (`adminEmpty`) — both must render; Greek-primary, bilingual via `useLang()`
- Anti-pattern guard: builder runs `node bin/slop-detect.mjs src/app/admin src/components/AdminReviewList.tsx` pre-commit if `bin/slop-detect.mjs` exists; commit blocked on critical findings. No raw hex, no hardcoded UI strings (every string via `t.*` in both `el` and `en`), no native `<select>`.

---

## Success Criteria
- [ ] Navigating to `/admin` as `admin@costas.com` renders the dashboard; navigating as owner/mechanic returns `redirect('/')` with no admin data in the body. (VERIF-01, VERIF-07)
- [ ] The dashboard lists every `status = 'pending'` workshop with name, serial, registration timestamp, and a signed-URL certificate preview link. (VERIF-02)
- [ ] Migration `0006_workshop_verification.sql` adds `status` (pending|verified|rejected, default pending), `reviewed_at`, `rejection_reason`, and an admin-only `SELECT`/ALL RLS policy; existing rows default to `pending`. (VERIF-07)
- [ ] `npx tsc --noEmit` exits 0 after the migration types, role plumbing, and route are added.
- [ ] All new UI strings exist in BOTH `el` and `en` in `lib/i18n.ts`; no raw hex in the new JSX.

---

## Verification Contract

### Contract for Task 1 — migration columns
**Check type:** grep-match
**Command:** `grep -cE "status|reviewed_at|rejection_reason" supabase/migrations/0006_workshop_verification.sql`
**Expected:** Non-zero (≥ 3)
**Fail if:** Returns 0 — the verification columns are not in the migration.

### Contract for Task 1 — admin RLS policy
**Check type:** grep-match
**Command:** `grep -c "workshops_admin_all" supabase/migrations/0006_workshop_verification.sql`
**Expected:** `1`
**Fail if:** Returns 0 — no admin-scoped RLS policy; non-admins could read all workshops.

### Contract for Task 1 — types regenerated
**Check type:** grep-match
**Command:** `grep -c "reviewed_at" src/lib/database.types.ts`
**Expected:** Non-zero (≥ 3 — Row, Insert, Update)
**Fail if:** Returns 0 — types diverge from schema; workshops queries with new columns are type errors.

### Contract for Task 2 — getSessionRole admin case
**Check type:** grep-match
**Command:** `grep -c '"admin"' src/lib/session.ts`
**Expected:** Non-zero (≥ 2 — type union + guard)
**Fail if:** Returns 0 — admin sessions resolve to null and the route gate fails closed against the admin.

### Contract for Task 2 — sign-in routes admin to /admin
**Check type:** grep-match
**Command:** `grep -c '"/admin"' src/lib/auth-actions.ts`
**Expected:** `1`
**Fail if:** Returns 0 — admin lands on the owner app instead of the admin surface.

### Contract for Task 3 — route gates by role
**Check type:** grep-match
**Command:** `grep -c "getSessionRole" src/app/admin/page.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — the route does not check role; non-admins reach admin data (VERIF-07 fail).

### Contract for Task 3 — non-admin redirect
**Check type:** grep-match
**Command:** `grep -c 'redirect("/")' src/app/admin/page.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — no redirect for non-admins.

### Contract for Task 3 — signed cert URL minted server-side
**Check type:** grep-match
**Command:** `grep -c "createSignedUrl" src/app/admin/page.tsx`
**Expected:** `1`
**Fail if:** Returns 0 — certificate not previewable, or path exposed without a signed URL.

### Contract for Task 3 — list component wired
**Check type:** grep-match
**Command:** `grep -c "AdminReviewList" src/app/admin/page.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — the list component exists but is never rendered.

### Contract for Task 3 — bilingual keys present
**Check type:** grep-match
**Command:** `grep -c "adminTitle" src/lib/i18n.ts`
**Expected:** Non-zero (≥ 3 — type + el + en)
**Fail if:** Fewer than 3 — a key is missing from one language (compile error) or the type.

### Contract for Task 3 — no raw hex in new JSX
**Check type:** command-exit
**Command:** `grep -rniE "#[0-9a-f]{3,6}" src/app/admin/page.tsx src/components/AdminReviewList.tsx | wc -l`
**Expected:** `0`
**Fail if:** Non-zero — raw hex bypasses the semantic token system (DESIGN.md §2 ban).

### Contract for Phase — compiles clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript error after all three tasks.

### Contract for Phase — admin route protection (behavioral)
**Check type:** behavioral
**Command:** (manual verification by verifier — requires migration applied via MCP + dev server) Sign in as `admin@costas.com` / `123456789` → lands on `/admin` showing pending workshops with cert links. Sign in as owner/mechanic, navigate to `/admin` → redirected to `/`, no workshop data in response.
**Expected:** Admin sees the pending list; non-admin is redirected with no admin data.
**Fail if:** Non-admin reaches the list, OR admin sees an empty/erroring page when pending workshops exist.
