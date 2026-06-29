# M2 Phase 1 Verification — Admin Surface & Data Layer

**Verdict: PASS** (2026-06-29) — build clean (tsc 0 errors), contract-runner 10/10.

- VERIF-01/07: `/admin` gated by `getSessionRole()==='admin'` → `redirect('/')` for non-admins (no admin data in response) — `src/app/admin/page.tsx`. Admin role recognized in `src/lib/session.ts`; sign-in routes admin→/admin in `src/lib/auth-actions.ts`.
- VERIF-02: pending workshops listed with name, serial, registration date, 60s signed cert URL — `src/app/admin/page.tsx` + `src/components/AdminReviewList.tsx`.
- Schema: `workshops.status|reviewed_at|rejection_reason` + admin RLS policy applied (migration 0006, live). Types extended. EL/EN parity maintained.
