# Phase 3 Verification — Workshop registration → real

**Verdict: PASS** (2026-06-29)

- `registerWorkshop` server-side validates file (PNG/JPEG/PDF, ≤5MB), uploads to private `workshop-certs` at `{uid}/cert.{ext}` (upsert), upserts `workshops` row, returns a signed URL — `src/lib/register-actions.ts:38-82`.
- `RegisterForm` wired via `useActionState`; drag-drop bridges to the real file input; success screen shows persisted values + "View certificate" signed link — `src/components/RegisterForm.tsx`.
- Storage policies (INSERT+SELECT+UPDATE) present from migration #1. Nullable-column migrations (0004) committed to repo.
