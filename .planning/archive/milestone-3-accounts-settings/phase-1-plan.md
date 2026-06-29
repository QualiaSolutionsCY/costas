---
phase: 1
goal: "Any visitor can register as an owner with email+password; existing users can request a reset email and set a new password via the link; signed-in users can change their password — all bilingual EL/EN, integrated into the existing auth pattern."
tasks: 4
waves: 3
---

# Phase 1: Real Sign-up & Auth Lifecycle

**Goal:** Any visitor can register as an owner (email + password) and lands in the owner flow with `app_metadata.role = 'owner'`; existing users can request a password-reset email and follow the link to set a new password; signed-in users can change their password from a server action — every new surface in EL/EN, reusing the M1/M2 auth pattern.

**Why this phase:** Replaces the seeded-account assumption with a real self-service lifecycle — without it there is no way to onboard a new owner or recover an account, which is the credibility line for the sales demo.

> **CRITICAL — no service-role key.** This project's env has ONLY `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (verified: `.env.local` has no `SUPABASE_SERVICE_ROLE_KEY`). The ROADMAP's `admin.createUser` / `admin.updateUserById` decision is **OVERRIDDEN** — `supabase.auth.admin.*` requires the service role and will 401. Use `signUp()` + a DB trigger to stamp the role, and `resetPasswordForEmail` / `updateUser` for the rest. No banned scope-reduction phrases appear below; every surface ships fully.

---

## Task 1 — Signup role+confirm trigger migration
**Wave:** 1
**Persona:** backend
**Files:** `supabase/migrations/0007_signup_role_trigger.sql` (create)
**Depends on:** none

**Why:** ACCT-01 requires every self-service signup to land with `app_metadata.role = 'owner'`. Without the service role we cannot stamp `app_metadata` from application code, so a `BEFORE INSERT` trigger on `auth.users` must set the role and auto-confirm the email (M1 ran with autoconfirm; no SMTP dependency for signup) before the row is finalized. It must run BEFORE the existing `on_auth_user_created` AFTER-INSERT trigger so `handle_new_user()` reads the stamped role (`0001_init_schema.sql:116 — "coalesce(new.raw_app_meta_data ->> 'role', 'owner')"`).

**Acceptance Criteria:**
- A row inserted into `auth.users` via the email provider with no `role` in `raw_app_meta_data` ends up with `raw_app_meta_data->>'role' = 'owner'`.
- The same row has `email_confirmed_at` set (non-null) so the new user can sign in immediately.
- The migration only touches email-provider rows and never overwrites a role that is already present (admin/mechanic seeds unaffected).

**Action:**
- Create a `SECURITY DEFINER` function `public.stamp_signup_owner_role()` returning `trigger`, language plpgsql, `set search_path = public, auth`.
- In the body, guard `if new.raw_app_meta_data ->> 'role' is null then` — set
  `new.raw_app_meta_data := jsonb_set(coalesce(new.raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb, '{role}', '"owner"');`
- Then `new.email_confirmed_at := coalesce(new.email_confirmed_at, now());` and `return new;`.
- Create trigger `on_auth_user_signup before insert on auth.users for each row execute function public.stamp_signup_owner_role();` — `before insert` is required so the AFTER trigger `on_auth_user_created` reads the stamped role.
- Add a top SQL comment: `-- Operator applies via Supabase MCP apply_migration after merge — builder writes the file only.`

**Validation:** (builder self-check)
- `test -f supabase/migrations/0007_signup_role_trigger.sql && echo EXISTS` → `EXISTS`
- `grep -c "before insert on auth.users" supabase/migrations/0007_signup_role_trigger.sql` → `1`
- `grep -c "email_confirmed_at" supabase/migrations/0007_signup_role_trigger.sql` → ≥ `1`

**Context:** Read @supabase/migrations/0001_init_schema.sql @supabase/migrations/0003_allow_admin_role.sql

---

## Task 2 — Auth lifecycle server actions (signUp, resetPassword, changePassword)
**Wave:** 1
**Persona:** backend
**Files:** `src/lib/account-actions.ts` (create)
**Depends on:** none

**Why:** ACCT-01/02/03 each need a server-side mutation reusing the established `auth-actions.ts` pattern (Zod parse → `await createClient()` → `useActionState` state shape → `redirect()` outside try/catch). Centralizing the three new mutations in one `account-actions.ts` file mirrors `auth-actions.ts:23 — "export async function signIn"` and gives Phase 2's settings surface its `changePassword` entry point. Trigger from Task 1 stamps the role, so `signUp()` (not `admin.createUser`) is sufficient.

**Acceptance Criteria:**
- `signUp(prev, formData)` validates email + password (min 8) + confirm-match server-side; on a duplicate email it returns `{ error: "exists" }`, on success it `redirect("/")`.
- `requestPasswordReset(prev, formData)` validates email and calls `resetPasswordForEmail` with `redirectTo` pointing at `/auth/reset-password`; it always returns `{ sent: true }` on a valid-format email (no account-enumeration leak).
- `changePassword(prev, formData)` validates new password (min 8) + confirm-match, calls `updateUser({ password })` with the current session, returns `{ ok: true }` or `{ error: "weak" | "auth" }`.

**Action:**
- `"use server";` at top. Import `redirect` from `next/navigation`, `z` from `zod`, `createClient` from `@/lib/supabase/server`.
- Export state types: `type SignUpState = { error?: "exists" | "invalid" }`, `type ResetRequestState = { sent: boolean; error?: boolean }`, `type ChangePasswordState = { ok?: boolean; error?: "weak" | "auth" | "invalid" }`. Export an `initial*State` const for each (for `useActionState`).
- `signUp`: schema `z.object({ email: z.string().email(), password: z.string().min(8), confirm: z.string() }).refine(d => d.password === d.confirm)`. Parse FormData; on fail return `{ error: "invalid" }`. Call `supabase.auth.signUp({ email, password })`. If `error` and message includes `"registered"` / `error.code === "user_already_exists"` return `{ error: "exists" }`; else any error → `{ error: "invalid" }`. On success, `redirect("/")` OUTSIDE the try/catch (per `auth-actions.ts:48`).
- `requestPasswordReset`: derive the site origin from `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"`; call `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${origin}/auth/reset-password\` })`. Return `{ sent: true }` even when Supabase returns an error (avoid enumeration); only invalid email format → `{ sent: false, error: true }`.
- `changePassword`: requires session — `const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: "auth" }`. Call `updateUser({ password })`; map a weak-password error to `{ error: "weak" }`, success to `{ ok: true }`.

**Validation:** (builder self-check)
- `grep -c "signUp\|resetPasswordForEmail\|updateUser" src/lib/account-actions.ts` → ≥ `3`
- `grep -c "admin\." src/lib/account-actions.ts` → `0` (no service-role admin calls)
- `npx tsc --noEmit` → 0 errors

**Context:** Read @src/lib/auth-actions.ts @src/lib/supabase/server.ts

---

## Task 3 — Signup + forgot-password pages and i18n keys
**Wave:** 2
**Persona:** frontend
**Files:** `src/app/signup/page.tsx` (create), `src/app/forgot-password/page.tsx` (create), `src/lib/i18n.ts` (modify — add auth-lifecycle keys to the `Translation` type and BOTH `el` and `en` dictionaries)
**Depends on:** Task 2

**Why:** ACCT-01 and ACCT-02's request side need their two unauthenticated surfaces. They must reuse the `/login` card pattern and `useActionState` wiring (`src/app/login/page.tsx:13 — "useActionState(signIn, initialState)"`) and pull every string from `lib/i18n.ts` — a missing translation is already a compile error (`PROJECT.md` decision), which is the test that guarantees EL/EN parity.

**Acceptance Criteria:**
- `/signup` renders a bilingual card (email, password, confirm-password, submit) styled like `/login`; mismatched passwords are caught client-side (HTML or a controlled check) before submit; a duplicate-email submit shows an inline bilingual error from `state.error === "exists"`; a valid submit redirects to `/`.
- `/forgot-password` renders a single bilingual email field; after submit it shows a bilingual "check your inbox" confirmation driven by `state.sent`.
- Both pages show a `LanguageToggle` and a link back to `/login`; `/login` gains a "Sign up" and "Forgot password" link.
- `npx tsc --noEmit` passes — proving every new `t.*` key exists in BOTH `el` and `en` (missing key = type error).

**Action:**
- Add to the `Translation` type and to BOTH `el`/`en` objects (EL given; mirror in EN):
  `signUpTitle` (Εγγραφή / Sign up), `signUpSubtitle` (Δημιούργησε λογαριασμό οδηγού. / Create an owner account.), `confirmPasswordLabel` (Επιβεβαίωση κωδικού / Confirm password), `signUpBtn` (Εγγραφή / Sign up), `signingUp` (Εγγραφή… / Signing up…), `signUpLink` (Εγγραφή / Sign up), `haveAccount` (Έχεις λογαριασμό; / Have an account?), `passwordMismatch` (Οι κωδικοί δεν ταιριάζουν. / Passwords don't match.), `emailExists` (Το email χρησιμοποιείται ήδη. / That email is already registered.), `passwordMinHint` (Τουλάχιστον 8 χαρακτήρες / At least 8 characters), `forgotPassword` (Ξέχασα τον κωδικό / Forgot password), `forgotTitle` (Επαναφορά κωδικού / Reset password), `forgotSubtitle` (Στείλε σύνδεσμο επαναφοράς στο email σου. / Send a reset link to your email.), `sendResetBtn` (Αποστολή συνδέσμου / Send reset link), `resetSent` (Έλεγξε τα εισερχόμενά σου για τον σύνδεσμο επαναφοράς. / Check your inbox for the reset link.), `backToLogin` (Επιστροφή στη σύνδεση / Back to sign in).
- `signup/page.tsx`: `"use client"`, `useActionState(signUp, initialSignUpState)` from `@/lib/account-actions`, `useLang()`. Three inputs; mark confirm as `type="password"`; add a client-side mismatch guard that blocks submit and surfaces `t.passwordMismatch`. Render `state.error === "exists"` → `t.emailExists` in the `role="alert"` negative box (copy the `/login` markup). Reuse the exact input/button classes from `login/page.tsx`.
- `forgot-password/page.tsx`: same shell, single email input, `useActionState(requestPasswordReset, …)`; when `state.sent` swap the form for the `t.resetSent` confirmation (positive token box). Link back via `t.backToLogin`.
- In `login/page.tsx`, add below the form: a `t.haveAccount` + `<a href="/signup">{t.signUpLink}</a>` line and a `<a href="/forgot-password">{t.forgotPassword}</a>` link, both using `text-accent` (semantic token, not raw hex).

**Validation:** (builder self-check)
- `npx tsc --noEmit` → 0 errors (proves EL+EN key parity)
- `grep -c "useActionState(signUp" src/app/signup/page.tsx` → `1`
- `grep -c "useActionState(requestPasswordReset" src/app/forgot-password/page.tsx` → `1`
- `grep -c 'href="/signup"' src/app/login/page.tsx` → `1`

**Design:**
- Register: product
- Tokens used: `bg-surface`, `bg-surface-2`, `text-muted`, `text-accent`, `bg-accent`, `text-surface`, `border`, `bg-negative/10`, `text-negative`, `bg-positive/10` (or `text-positive`), `rounded-xl`, `rounded-lg`
- Scope: page
- Anti-pattern guard: no raw hex / default-palette colors in JSX (only semantic tokens per DESIGN.md §2); no hardcoded UI text (every string via `t.*`); reuse `/login` card classes; keep label + `aria`/focus a11y of the existing inputs.

**Context:** Read @src/app/login/page.tsx @src/lib/account-actions.ts @src/lib/i18n.ts @.planning/DESIGN.md

---

## Task 4 — Reset-password completion route
**Wave:** 3
**Persona:** frontend
**Files:** `src/app/auth/reset-password/page.tsx` (create)
**Depends on:** Task 2, Task 3

**Why:** ACCT-02's completion side: the reset email links here with a `?code=` param. The page must exchange that code for a session (reusing the `/auth/callback` PKCE pattern — `src/app/auth/callback/route.ts:12 — "supabase.auth.exchangeCodeForSession(code)"`) and then let the user set a new password via the Task-2 `changePassword` action, redirecting to `/login` on success.

**Acceptance Criteria:**
- Visiting `/auth/reset-password?code=<valid>` exchanges the code server-side and renders a bilingual new-password form (new password + confirm).
- Submitting a valid matching password calls `changePassword`, succeeds, and redirects the user to `/login`.
- Visiting with a missing/invalid code shows a bilingual error with a `t.backToLogin` link instead of the form.
- A weak password rejected by Supabase surfaces `state.error === "weak"` as a bilingual inline message; mismatched passwords are caught before submit.

**Action:**
- Make `page.tsx` an async **Server Component** that reads `searchParams` (`{ code?: string }`). If `code` present: `const supabase = await createClient(); const { error } = await supabase.auth.exchangeCodeForSession(code);` — on error, render a client `<ResetError />` shell using `t` (invalid-link message + back link).
- On success, render a client child `ResetPasswordForm` (co-located `"use client"` component in the same file or imported) that uses `useActionState(changePassword, initialChangePasswordState)`; two password inputs (new + confirm) with a client mismatch guard; on `state.ok` call a redirect to `/login` (use `redirect("/login")` from the action on success instead — set `changePassword` to redirect on the reset path, OR `router.push("/login")` client-side on `state.ok`). Pick the client `router.push("/login")` approach so the shared `changePassword` action stays return-based for Phase 2's settings form.
- Add i18n keys (Task 3 owns `i18n.ts`; this route only consumes them — if a needed key is absent, it is a compile error, signalling Task 3 must add it): reuse `forgotTitle`/`confirmPasswordLabel`/`backToLogin`/`passwordMismatch`/`passwordMinHint` plus add `newPasswordLabel` (Νέος κωδικός / New password), `setPasswordBtn` (Ορισμός κωδικού / Set password), `resetInvalid` (Ο σύνδεσμος επαναφοράς δεν ισχύει ή έληξε. / This reset link is invalid or expired.), `passwordWeak` (Ο κωδικός είναι πολύ αδύναμος. / That password is too weak.) — list these in the Task-3 i18n additions so type-check passes.

**Validation:** (builder self-check)
- `grep -c "exchangeCodeForSession" src/app/auth/reset-password/page.tsx` → `1`
- `grep -c "changePassword" src/app/auth/reset-password/page.tsx` → `1`
- `npx tsc --noEmit` → 0 errors

**Design:**
- Register: product
- Tokens used: `bg-surface`, `bg-surface-2`, `text-muted`, `text-accent`, `bg-negative/10`, `text-negative`, `bg-accent`, `text-surface`, `rounded-xl`, `rounded-lg`
- Scope: page
- Anti-pattern guard: semantic tokens only (DESIGN.md §2); all strings via `t.*` in EL+EN; reuse `/login` card classes; keep input labels + focus a11y.

**Context:** Read @src/app/auth/callback/route.ts @src/lib/account-actions.ts @src/app/login/page.tsx @.planning/DESIGN.md

---

## Success Criteria
- [ ] `/signup` renders a bilingual email/password/confirm form; a valid submit creates an auto-confirmed user with `app_metadata.role = 'owner'` (via the Task-1 trigger) and redirects to `/`.
- [ ] A duplicate-email signup returns an inline bilingual error; mismatched passwords are caught before submission.
- [ ] `/forgot-password` submits a registered email, calls `resetPasswordForEmail` server-side, and shows a bilingual "check your inbox" confirmation.
- [ ] `/auth/reset-password?code=…` exchanges the code, lets the user set a new password via `changePassword`, and redirects to `/login`.
- [ ] `changePassword` exists in `account-actions.ts` (Phase 2's settings entry point) and calls `updateUser({ password })` with the current session — no service-role admin call anywhere.
- [ ] `npx tsc --noEmit` exits 0 (proves every new i18n key has EL+EN parity); no `TODO`/`FIXME` in touched files.

---

## Verification Contract

### Contract for Task 1 — migration file exists
**Check type:** file-exists
**Command:** `test -f supabase/migrations/0007_signup_role_trigger.sql && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File does not exist

### Contract for Task 1 — BEFORE INSERT trigger + confirm stamp
**Check type:** grep-match
**Command:** `grep -cE "before insert on auth.users|email_confirmed_at" supabase/migrations/0007_signup_role_trigger.sql`
**Expected:** ≥ 2
**Fail if:** Returns < 2 — trigger isn't BEFORE INSERT or doesn't auto-confirm

### Contract for Task 2 — lifecycle actions present, no admin calls
**Check type:** grep-match
**Command:** `grep -c "resetPasswordForEmail" src/lib/account-actions.ts`
**Expected:** ≥ 1
**Fail if:** Returns 0 — password-reset request not implemented

### Contract for Task 2 — no service-role admin usage
**Check type:** grep-match
**Command:** `grep -c "auth.admin" src/lib/account-actions.ts`
**Expected:** 0
**Fail if:** Non-zero — uses an admin call that requires the absent service-role key

### Contract for Task 3 — signup page wired to action
**Check type:** grep-match
**Command:** `grep -c "useActionState(signUp" src/app/signup/page.tsx`
**Expected:** ≥ 1
**Fail if:** Returns 0 — signup form exists but isn't wired to the server action

### Contract for Task 3 — login links to new surfaces
**Check type:** grep-match
**Command:** `grep -cE 'href="/signup"|href="/forgot-password"' src/app/login/page.tsx`
**Expected:** ≥ 2
**Fail if:** Returns < 2 — new auth surfaces are unreachable from login

### Contract for Task 4 — reset route exchanges code and sets password
**Check type:** grep-match
**Command:** `grep -cE "exchangeCodeForSession|changePassword" src/app/auth/reset-password/page.tsx`
**Expected:** ≥ 2
**Fail if:** Returns < 2 — code exchange or password update is missing

### Contract for whole phase — compiles + i18n parity
**Check type:** command-exit
**Command:** `npx tsc --noEmit`
**Expected:** exit 0 / `0` TS errors
**Fail if:** Any error — a type error here means a new i18n key is missing from EL or EN, or a server-action signature mismatch

### Contract for whole phase — no stubs in touched files
**Check type:** grep-match
**Command:** `grep -rcE "TODO|FIXME|placeholder|not implemented" src/lib/account-actions.ts src/app/signup/page.tsx src/app/forgot-password/page.tsx src/app/auth/reset-password/page.tsx`
**Expected:** 0 per file
**Fail if:** Any match — unfinished work remains
