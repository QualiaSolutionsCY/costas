# Full App — Definition of Done

Per-stack verify checklist. Inherits `rules/constitution.md` and the `web-app` archetype DoD.

## Auth & Access (constitution — non-negotiable)
- [ ] Supabase auth with the chosen model; email verification + password reset wired.
- [ ] **RLS enabled on every table**, policies derived from `app_metadata` (never `user_metadata`).
- [ ] RLS verified as two+ users — each sees only its own rows.
- [ ] Every UPDATE policy has a matching SELECT policy.
- [ ] Postgres views set `security_invoker = true`.
- [ ] Storage upsert grants INSERT + SELECT + UPDATE on the bucket.
- [ ] Sessions revoked before a user is deleted.

## Security
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-only — never `NEXT_PUBLIC_`, never imported in a client component.
- [ ] Mutations use `lib/supabase/server.ts`; client reads use `lib/supabase/client.ts`.
- [ ] Inputs validated with Zod; no `dangerouslySetInnerHTML`, no `eval()`.
- [ ] Security headers (HSTS); CSRF/permission checks on every mutation.

## Schema flow
- [ ] All schema changes are migrations in `supabase/migrations/` — never hand-applied to remote.
- [ ] `npx supabase gen types` run after schema changes.

## App quality
- [ ] Every async surface has loading / empty / error states.
- [ ] Destructive actions confirm; rate limiting on mutating + public endpoints.
- [ ] No N+1 on list views.

## Build & Deploy
- [ ] `npx tsc --noEmit` exits 0; `next build` succeeds.
- [ ] Deploys to Vercel; homepage returns HTTP 200; auth callback responds.
- [ ] Design anti-slop bar met (DESIGN.md); a11y AA.
