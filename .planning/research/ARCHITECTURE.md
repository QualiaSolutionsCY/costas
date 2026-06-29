# Supabase + Next.js 16 Integration — Architecture Research

Target: `/home/qualiasolutions/Projects/demos/costas` — Next 16.2.9, React 19.2.4, App Router. No backend yet.
Stack: `@supabase/ssr` + `@supabase/supabase-js`. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only).
Verified: `cookies()` is async in Next 16 (`node_modules/next/dist/docs/.../cookies.md:67-68` — async since v15.0.0-RC).

Sources:
- Supabase SSR / Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs · https://supabase.com/docs/guides/auth/server-side/creating-a-client
- getClaims vs getUser: https://supabase.com/docs/guides/auth/server-side/advanced-guide · https://supabase.com/docs/reference/javascript/auth-getclaims · GH https://github.com/supabase/supabase/issues/39947
- Storage RLS: https://supabase.com/docs/guides/storage/security/access-control
- RBAC / app_metadata: https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac · https://supabase.com/docs/guides/database/postgres/row-level-security
- Anonymous / magic link: https://supabase.com/docs/guides/auth/auth-anonymous · https://supabase.com/docs/guides/auth/auth-email-passwordless
- Migrations: https://supabase.com/docs/guides/local-development/overview

## Client setup

Install: `npm i @supabase/ssr @supabase/supabase-js`. Two files, `createClient` factory each.

`src/lib/supabase/client.ts` (browser, client components):
```ts
import { createBrowserClient } from "@supabase/ssr";
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
```

`src/lib/supabase/server.ts` (server components, actions, route handlers) — async because `cookies()` is async in Next 16:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component — middleware refreshes the session instead.
          }
        },
      },
    },
  );
};
```
Use `getAll`/`setAll` only — the older single-cookie `get/set/remove` API is deprecated (creating-a-client guide). Service-role client (server-only, bypasses RLS) is a separate factory using `SUPABASE_SERVICE_ROLE_KEY`; never import it into a client component.

## Middleware/session

Server Components cannot write cookies, so token refresh must happen in `middleware.ts` via an `updateSession` util. The refresh call (`getClaims`/`getUser`) both revalidates the token AND triggers the `setAll` cookie write.

`src/middleware.ts`:
```ts
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

`src/lib/supabase/middleware.ts` (`updateSession`) — create `NextResponse.next`, build a server client whose `getAll` reads `request.cookies` and `setAll` writes to BOTH `request` and `response`, then call the auth check. **Do not run code between client creation and the auth call** (Supabase warns this causes random logouts). Return the same `response` object you mutated.

Auth check choice (docs in transition, advanced-guide + GH#39947):
- `getClaims()` — **recommended default** for new projects (asymmetric signing keys default). Verifies JWT locally via WebCrypto + cached JWKS, no network round-trip; avoids flooding the Auth server when Next renders server components in parallel.
- `getUser()` — network call; authoritative (detects ban/delete/server logout instantly). Use when freshness matters.
- `getSession()` — NEVER for authorization; only to read raw tokens. Its user object is spoofable from cookies.

For this demo use `getClaims()` in middleware. The `is_anonymous` and role claims are read from the returned claims.

## Schema + RLS sketch

All tables: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Roles live in `app_metadata` (`auth.jwt()->'app_metadata'->>'role'`), NEVER `user_metadata` (user-editable → auth bypass). Role values: `owner`, `mechanic`.

Tables:
- `profiles` — `id uuid pk references auth.users`, `display_name`, `created_at`. Role mirrored here optionally for joins.
- `vehicles` — `id`, `owner_id uuid references auth.users`, `plate text unique`, `make`, `model`, `year`.
- `service_entries` — `id`, `vehicle_id references vehicles`, `logged_by uuid references auth.users`, `kind` (`owner_log`|`workshop_job`), `description`, `cost`, `service_date`, `created_at`.
- `workshops` — `id`, `owner_id uuid references auth.users` (the mechanic account), `name`, `cert_path text` (Storage object path), `verified bool default false`.

RLS policies (sketch):
```sql
-- Owners see/insert only their own vehicles
create policy vehicles_owner_select on vehicles for select to authenticated
  using (owner_id = (select auth.uid()));
create policy vehicles_owner_write on vehicles for insert to authenticated
  with check (owner_id = (select auth.uid()));

-- Owners see service entries on their vehicles; mechanics see entries they logged
create policy svc_select on service_entries for select to authenticated
  using (
    exists (select 1 from vehicles v where v.id = vehicle_id and v.owner_id = (select auth.uid()))
    or logged_by = (select auth.uid())
  );
-- Owners log against own vehicles; mechanics (role claim) log workshop jobs against any plate
create policy svc_insert on service_entries for insert to authenticated
  with check (
    logged_by = (select auth.uid())
    and (
      exists (select 1 from vehicles v where v.id = vehicle_id and v.owner_id = (select auth.uid()))
      or (auth.jwt()->'app_metadata'->>'role') = 'mechanic'
    )
  );

-- Every UPDATE policy needs a matching SELECT policy (constitution). Workshop owner manages own row.
create policy workshops_select on workshops for select to authenticated
  using (owner_id = (select auth.uid()));
create policy workshops_insert on workshops for insert to authenticated
  with check (owner_id = (select auth.uid()) and (auth.jwt()->'app_metadata'->>'role') = 'mechanic');
create policy workshops_update on workshops for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
```
Role is set server-side with the service-role key:
`UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"mechanic"}'::jsonb WHERE id = ...`.
For richer RBAC, Supabase's canonical pattern is a Custom Access Token Auth Hook + an `authorize()` SQL helper — overkill for this demo; stamping `app_metadata.role` is enough.

## Storage (cert upload)

Private bucket `workshop-certs`. Store each file under a per-user folder so the path's first segment is the uid: `{auth.uid()}/cert.pdf`. The drag-drop uploader uploads with `upsert: true`, which needs INSERT + SELECT + UPDATE policies on `storage.objects`.

```sql
-- INSERT: only into your own folder
create policy cert_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'workshop-certs'
    and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
  );
-- SELECT: read your own (required for upsert + signed-url download)
create policy cert_select on storage.objects for select to authenticated
  using (
    bucket_id = 'workshop-certs'
    and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
  );
-- UPDATE: overwrite your own (required for upsert)
create policy cert_update on storage.objects for update to authenticated
  using (
    bucket_id = 'workshop-certs'
    and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
  );
```
`storage.foldername(name)[1]` extracts the first path segment; `auth.jwt()->>'sub'` is the uid. Without all three, upsert fails. Bucket is private — serve files via `createSignedUrl`. Persist the returned object path to `workshops.cert_path`.

## Migrations flow

CLI-first (`npx supabase`); never hand-edit a remote DB (constitution).
1. `npx supabase init` — scaffolds `supabase/`.
2. `npx supabase migration new init_schema` — creates `supabase/migrations/<timestamp>_init_schema.sql`. Put all DDL + RLS + bucket creation here.
3. `npx supabase start` then `npx supabase db reset` — apply locally, idempotent rebuild from migrations.
4. `npx supabase link --project-ref <ref>` — link remote once.
5. `npx supabase db push` — apply migrations to remote.
6. `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts` — regenerate after every schema change.
Flow is local container → (staging branch) → production. All schema changes are migration files in `supabase/migrations/`, applied through CLI/CI.

## Recommended demo auth

**ONE recommendation: email + password.** Lightest *real* auth that cleanly demonstrates the two-role (owner vs mechanic) split:
- No SMTP setup needed (magic link / OTP require a configured email provider; Supabase's built-in sender is rate-limited and dev-only — a live-demo footgun).
- No PKCE same-browser constraint that breaks magic links when a demo link is opened on another device.
- Deterministic for a demo: you can pre-seed an `owner@…` and a `mechanic@…` account, stamp `app_metadata.role` on each via the service key, and log in instantly to show each side.
- Anonymous sign-in is tempting for "try instantly" but needs CAPTCHA/Turnstile to avoid DB-bloat abuse and can't cleanly carry a pre-assigned role — more setup than email/password for no demo benefit.

Confirm sign-up email auto-confirm is ON in the demo project so password sign-up needs no inbox.
