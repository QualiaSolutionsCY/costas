# Roadmap · Milestone 3 · Accounts & Settings

**Project:** Costas — Car Service Log
**Milestone:** 3 of 6 (CURRENT)
**Created:** 2026-06-29
**Phases:** 2
**Requirements covered:** ACCT-01, ACCT-02, ACCT-03, ACCT-04, ACCT-05, ACCT-06, ACCT-07, ACCT-08, ACCT-09, ACCT-10

See `JOURNEY.md` for the full project arc. This file covers Milestone 3's phases only.

## Context

M1 ("Make It Real") and M2 ("Verification & Trust") are shipped. The platform has a real backend, real auth, and a working admin approval pipeline — but every real user account is still a seeded demo credential. The optional-login model (M1 migration `0004_demo_no_login_public_access`) lets anonymous callers use the app, but there is no way to register as a new owner, recover a forgotten password, or manage vehicles beyond adding them. The `SettingsPanel` in `AppShell.tsx` shows only language preference and an About row. This milestone replaces the seeded-account assumption with a real self-service lifecycle and turns the stub `settings` nav into a real surface.

**Foundation available:**
- `@supabase/ssr` client + server + middleware already wired (`lib/supabase/`)
- `app_metadata.role` authorization pattern established (`session.ts` `getSessionRole()`)
- `auth-actions.ts` `signIn` / `signOut` server actions with `useActionState` pattern
- `profiles` table (id, full_name, role, created_at) with `profiles_select_own` + `profiles_update_own` RLS policies
- `vehicles` table with owner RLS (select/insert/update own) + anonymous demo policies
- `handle_new_user()` trigger auto-creates a `profiles` row on signup
- Login page (`/login`) with Zod validation, bilingual strings, and design-system form components

## Exit Criteria

- A new user can sign up with email + password at `/signup` and is immediately placed in the owner flow with `role = owner` in `app_metadata`.
- Password reset works end-to-end: request form → Supabase sends reset email → user follows link → sets new password → is redirected to login.
- A signed-in owner can view and edit their profile (display name, phone) from settings; changes persist across sessions.
- An owner can add, edit, and remove vehicles from settings; removing requires a confirmation prompt.
- The settings page is real, covers three panels (Profile, Vehicles, Security), and is reachable from the sidebar `settings` nav item.

---

## Phases

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Real Sign-up & Auth Lifecycle | Deliver self-service registration, password reset, and in-settings password change so real users can create and maintain accounts | ACCT-01, ACCT-02, ACCT-03 | ready |
| 2 | Profile, Vehicles & Settings Surface | Wire the profile edit, full vehicle CRUD (edit + remove), active-vehicle switcher, and the real settings page that assembles all three panels | ACCT-04, ACCT-05, ACCT-06, ACCT-07, ACCT-08, ACCT-09, ACCT-10 | — |

---

## Phase Details

### Phase 1: Real Sign-up & Auth Lifecycle

**Goal:** Any visitor can register as an owner with email + password; existing users can request a password-reset email and follow the link to set a new password; signed-in users can change their password from within the app — with all surfaces in EL/EN and fully integrated into the existing auth pattern.

**Requirements covered:**
- ACCT-01: A new owner can register with email + password; the account is created with `role = owner` in `app_metadata`.
- ACCT-02: A user can request a password-reset email and follow the link to set a new password.
- ACCT-03: A signed-in user can change their password from the settings surface.

**Success criteria** (observable):
1. Visiting `/signup` renders a bilingual form (email, password, confirm password). Submitting valid credentials calls `supabase.auth.signUp()` server-side, auto-sets `app_metadata.role = owner` via a Supabase `auth.users` trigger or `admin.updateUserById` in the signup server action, auto-confirms the user (matching M1's `enable_signup` + `autoconfirm` settings), and redirects to `/` — the owner dashboard.
2. A signup attempt with an already-registered email returns an inline bilingual error message; mismatched passwords are caught client-side before submission.
3. Visiting `/forgot-password` and submitting a registered email calls `supabase.auth.resetPasswordForEmail()` server-side; the user sees a confirmation message in EL/EN ("Check your inbox"). Clicking the reset link in the email lands on `/auth/reset-password` with a valid `code` query parameter.
4. On `/auth/reset-password` the user can type a new password and submit; `supabase.auth.exchangeCodeForSession()` + `updateUser({ password })` complete the reset; the user is redirected to `/login` with a success toast.
5. `npx tsc --noEmit` exits 0 after all new routes and server actions are added; no `TODO` or `FIXME` markers remain in touched files.

**Build notes:**
- Sign-up server action: call `supabase.auth.admin.createUser()` (using the service role key — server only) with `app_metadata: { role: 'owner' }` and `email_confirm: true`. This is the correct approach to stamp `app_metadata` at creation; `signUp()` alone cannot set `app_metadata` without an admin call.
- The `handle_new_user()` trigger already creates the `profiles` row on `auth.users` insert — no extra insert needed in the server action.
- Forgot-password page: a standalone route `/forgot-password` with a single email field, not inside the AppShell (unauthenticated surface). Style matches the existing `/login` card pattern.
- Auth callback: the existing `/auth/callback/route.ts` handles the PKCE code exchange; `/auth/reset-password` is a new route that reads `?code=` from the URL, calls `exchangeCodeForSession`, then renders the new-password form.
- Password change from settings (ACCT-03): implemented as a server action in the new `account-actions.ts` file — calls `supabase.auth.updateUser({ password: newPassword })` with the current session. This is Phase 2's settings surface entry point; the form component is built here, wired in Phase 2.
- Add `signUpLink` (EL: "Εγγραφή", EN: "Sign up") and `forgotPassword` (EL: "Ξέχασα τον κωδικό", EN: "Forgot password") keys to `lib/i18n.ts` in both languages; a missing translation is already a type error.

**Depends on:** M1 + M2 (Supabase setup, `@supabase/ssr` pattern, `auth-actions.ts`, `/auth/callback` route, design tokens)

---

### Phase 2: Profile, Vehicles & Settings Surface

**Goal:** A signed-in owner can view and edit their profile (name, phone), perform full CRUD on their vehicles (add / edit / remove with confirmation), switch the active vehicle to scope the service log, and reach all three capabilities from a real settings page wired to the sidebar `settings` nav item — with all strings bilingual and all states (loading, empty, error, confirm) handled.

**Requirements covered:**
- ACCT-04: An owner can view and edit their profile (display name, phone).
- ACCT-05: Profile changes persist to `profiles` and are visible on next sign-in.
- ACCT-06: An owner can add a new vehicle (plate, make, model, year) to their account.
- ACCT-07: An owner can edit an existing vehicle's details.
- ACCT-08: An owner can remove a vehicle from their account (with confirmation prompt).
- ACCT-09: An owner with multiple vehicles can switch the active vehicle; the service log and history scope to the selected vehicle.
- ACCT-10: The currently stubbed `settings` nav links to a real settings page covering profile, vehicle management, and password change.

**Success criteria** (observable):
1. Clicking "Settings" in the sidebar renders a real settings page (not the current `SettingsPanel` stub) with three sections: **Profile**, **Vehicles**, and **Security**. A signed-out visitor sees a prompt to sign in; a signed-in owner sees their data.
2. On the Profile section, editing display name or phone and saving calls the `updateProfile` server action, which writes to `profiles` via `profiles_update_own` RLS policy. After saving, the updated name is visible in the profile section immediately (optimistic or revalidate) and persists after a hard refresh.
3. The `profiles` table gains a `phone` column via a new migration (`0007_profiles_phone.sql`) — `text, nullable`. The `updateProfile` action validates name (min 1, max 80) and phone (optional, E.164 or local format, max 20) with Zod before writing.
4. On the Vehicles section, an owner can tap "Edit" on any vehicle row — an inline form pre-filled with plate, make/model, and year allows updating and saving via `updateVehicle` server action; the row updates without full page reload. Tapping "Remove" opens a bilingual confirmation dialog ("Are you sure? / Είσαι σίγουρος?"); confirming calls `removeVehicle` which deletes the row; the vehicle disappears from the list.
5. An owner with 2+ vehicles can click any vehicle in the Vehicles section (or in the existing vehicle switcher on the log panel) to set it as the active vehicle; the service log and history immediately scope to that vehicle's `service_entries`. Active vehicle identity persists across a page reload (stored in a server-set cookie or URL param — not localStorage, to avoid hydration mismatch).
6. The Password Change sub-section in Security calls the `changePassword` server action (built in Phase 1) from a two-field form (new password + confirm); success shows a bilingual confirmation; an error (e.g. weak password rejected by Supabase) shows the Supabase error message in EL/EN.
7. `npx tsc --noEmit` exits 0; no `TODO`/`FIXME`/placeholder markers remain in touched files; every new i18n key is present in both `el` and `en` dictionaries.

**Build notes:**
- `profiles` currently lacks a `phone` column — add it in migration `0007_profiles_phone.sql`. The existing `profiles_update_own` policy covers the new column with no changes needed.
- `updateVehicle` and `removeVehicle` server actions go in `owner-actions.ts` alongside the existing `addVehicle`. Schemas: `vehicleEditSchema` (id + model + plate, optional year) and `vehicleRemoveSchema` (id only), both Zod-validated. RLS already covers update/delete via `vehicles_update_owner` (from migration `0001`); add `vehicles_delete_owner` if not already present (check: `0001` has no delete policy — add one in `0007`).
- Active vehicle switcher: the existing `ServiceLog` component receives `vehicles` and `initialEntries` as props from the server page. To scope on switch, pass `activeVehicleId` as a cookie-backed URL search param (`?v={id}`), read it in `page.tsx` to hydrate the correct initial entries, and let the client's existing vehicle-switch handler append `?v=` on navigation. This avoids a full rewrite of the client state model.
- The Settings surface replaces the `SettingsPanel` function in `AppShell.tsx` — the existing `active === "settings"` branch should render a new `<SettingsPage>` server component (streamed from the layout) rather than the inline `SettingsPanel`. Since `AppShell` is a client component, the cleanest approach is to make the settings panel a separate route (`/settings`) and navigate to it on sidebar click, matching the owner-only gate pattern from M2.
- Vehicle add form already exists (M1 `addVehicle`); the year field is new — add `year` (integer, optional, 1900–2030) to `vehicleSchema` and to the `vehicles` table via `0007` migration.
- Language: add i18n keys for `editVehicle`, `removeVehicle`, `confirmRemove`, `confirmRemoveHint`, `profileSection`, `vehiclesSection`, `securitySection`, `phoneLabel`, `phonePlaceholder`, `saveProfile`, `profileSaved`, `changePassword`, `currentPassword`, `newPassword`, `confirmPassword`, `passwordChanged` in both EL and EN.

**Depends on:** Phase 1 (account-actions.ts `changePassword`, `/auth/reset-password` pattern, signup server action)

---

## Coverage Verification

Every requirement in this milestone maps to exactly one phase.

| Requirement | Phase | Covered? |
|-------------|-------|----------|
| ACCT-01 | Phase 1 | ✓ |
| ACCT-02 | Phase 1 | ✓ |
| ACCT-03 | Phase 1 | ✓ |
| ACCT-04 | Phase 2 | ✓ |
| ACCT-05 | Phase 2 | ✓ |
| ACCT-06 | Phase 2 | ✓ |
| ACCT-07 | Phase 2 | ✓ |
| ACCT-08 | Phase 2 | ✓ |
| ACCT-09 | Phase 2 | ✓ |
| ACCT-10 | Phase 2 | ✓ |

All 10 M3 requirements mapped. Unmapped: 0.

---

## When This Milestone Closes

Triggered by `/qualia-milestone` after `/qualia-verify` passes on Phase 2:

1. All phase artifacts are archived to `.planning/archive/milestone-3-accounts-settings/`
2. `tracking.json` `milestones[]` gets a summary entry (num, name, phases_completed, shipped_url, closed_at)
3. REQUIREMENTS.md marks ACCT-01..10 as **Complete**
4. M4 (Booking & Scheduling) opens — roadmapper regenerates this ROADMAP.md for Milestone 4
5. `state.js init --force --milestone_name "Booking & Scheduling"` resets current-phase fields, preserves lifetime + milestones[] history

---

*Last updated: 2026-06-29*
