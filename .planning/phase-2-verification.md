# M2 Phase 2 Verification — Approve / Reject Actions & Badge

**Verdict: PASS** (2026-06-29) — build clean (tsc 0), contract-runner 14/14, EL/EN 129/129.

- VERIF-03/04: `approveWorkshop`/`rejectWorkshop` server actions (`src/lib/admin-actions.ts`) verify `getSessionRole()==='admin'` BEFORE any DB write (403 backstop to RLS); set status=verified/rejected + reviewed_at + rejection_reason.
- VERIF-05: `<WorkshopBadge>` "certified" (positive green) on mechanic header + owner hero/history for verified workshops.
- VERIF-06: pending (muted) / rejected (negative) visually distinguished via the same badge.
- Admin list uses React 19 `useOptimistic` — reviewed rows leave the pending list without reload.
