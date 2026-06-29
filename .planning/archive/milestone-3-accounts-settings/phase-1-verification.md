# M3 Phase 1 Verification — Real Sign-up & Auth Lifecycle

**Verdict: PASS** (2026-06-29) — build clean (tsc 0), contract-runner 13/13, EL/EN 149/149. Trigger validated end-to-end (test signup → role=owner, auto-confirmed, profile created).

- ACCT-01: `/signup` → `supabase.auth.signUp()`; migration 0007 trigger stamps `app_metadata.role='owner'` + auto-confirms (no service-role key needed). `src/app/signup/page.tsx`, `src/lib/account-actions.ts`.
- ACCT-02: duplicate email → bilingual `errEmailExists`; password mismatch caught client + server.
- ACCT-03: `/forgot-password` → `resetPasswordForEmail`; `/auth/reset-password` exchanges code + `updateUser({password})`; `changePassword` reusable for settings security. `src/app/auth/reset-password/`.
