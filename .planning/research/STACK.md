# Next.js 16.2.9 — App Router conventions for a Supabase data + auth layer

Source of truth: bundled docs at `node_modules/next/dist/docs/`. Version confirmed `16.2.9` (`node_modules/next/package.json`).
Every claim cites the bundled doc path. Do NOT recall from older training data — several APIs changed in 16.

## Server/Client components

- Layouts and pages are **Server Components by default**; add `"use client"` only for state, event handlers, lifecycle (`useEffect`), browser APIs, or custom hooks — `01-app/01-getting-started/05-server-and-client-components.md:11,19-24`.
- Fetch data (DB/Supabase) directly in async Server Components; use API keys/secrets here without exposing them to the client — `…/05-server-and-client-components.md:26-31`.
- `"use client"` marks a **boundary**: the file AND everything in its import/render module graph go to the client bundle. You don't need the directive on every child — `…/05-server-and-client-components.md:174-178`.
- Server Components passed as `children`/props to a Client Component are NOT pulled into the client graph — they render on the server. Use this to interleave (e.g. server-rendered `<Cart>` inside client `<Modal>`) — `…/05-server-and-client-components.md:178,295-345`.
- React **context is not supported in Server Components** — wrap providers in a `"use client"` component and render as deep as possible — `…/05-server-and-client-components.md:347-417`.
- Only `NEXT_PUBLIC_`-prefixed env vars reach the client; others become `""`. Use the `server-only` package to hard-fail accidental server-code imports into client (critical for the Supabase **service_role** key) — `…/05-server-and-client-components.md:549-555`.

## Route Handlers

- File convention is `route.ts|js` in `app/`; export named async functions per HTTP method: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`. Unsupported method → 405 — `01-app/01-getting-started/15-route-handlers.md:31-43`.
- Signature uses Web `Request`/`Response`; Next extends with `NextRequest`/`NextResponse` for helpers — `…/15-route-handlers.md:15,45-47`.
- A `route.js` and `page.js` **cannot** coexist at the same segment (conflict) — `…/15-route-handlers.md:39,155-163`.
- Not cached by default; only `GET` can opt in via `export const dynamic = 'force-static'` — `…/15-route-handlers.md:49-51`.
- Typed params via the global `RouteContext<'/users/[id]'>` helper; **params are async** — `await ctx.params` — `…/15-route-handlers.md:187-198`.
- Supabase auth callback (`/auth/callback`) is a Route Handler — read cookies via async `cookies()` (see below).

## Server Actions

- **Recommended mutation path in 16.** A Server Function is an async fn marked `'use server'` (inline in the function body, or a file-top directive to export all). Called from client over the network; in form/action context = "Server Action" — `01-app/01-getting-started/07-mutating-data.md:13,17-37`.
- Cannot be defined in Client Components — define in a `'use server'` file and import, or pass as a prop — `…/07-mutating-data.md:133-197`.
- Invoke via `<form action={fn}>` (auto-receives `FormData`), `formAction`, event handlers, or `useEffect` — `…/07-mutating-data.md:199-332`. Pending UI via `useActionState` — `…/07-mutating-data.md:336-356`.
- **SECURITY (per rules/security.md too):** Server Functions are reachable by direct POST, not just your UI — verify auth/authz inside EVERY action (`await auth()` / Supabase `getUser()`) — `…/07-mutating-data.md:30-31`.
- Post-mutation: `revalidatePath`/`revalidateTag` (next/cache), `redirect` (next/navigation), or new `refresh()` to refresh the client router — `…/07-mutating-data.md:376-499`.
- You can `get/set/delete` cookies inside a Server Action via async `cookies()` — this is how Supabase writes refreshed session cookies — `…/07-mutating-data.md:501-526`.

## Middleware → renamed to Proxy (BREAKING, 16)

- `middleware.ts` is **deprecated and renamed to `proxy.ts`**. Same functionality, clarified purpose — `01-app/01-getting-started/16-proxy.md:13-15`; `01-app/02-guides/upgrading/version-16.md:625-650`.
- Convention: single `proxy.ts` (or `.js`) at project root / `src` level (same level as `app`). Export `proxy` (named) or default; optional `export const config = { matcher: '...' }` — `…/16-proxy.md:33-76`.
- **CRITICAL for Supabase:** the `proxy` runtime is **`nodejs` and cannot be configured to edge**. If your auth/session lib only supports the Edge runtime, you must KEEP using `middleware` (legacy) instead — `…/version-16.md:629`; `01-app/02-guides/authentication.md:1124`. (`@supabase/ssr` supports Node, so `proxy.ts` is fine.)
- Config flags renamed: `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize` — `…/version-16.md:650`.
- Proxy is for **optimistic checks only** — read session from cookie, never do DB checks (runs on every route incl. prefetches). Real authz belongs in a Data Access Layer near the data — `01-app/02-guides/authentication.md:29,1024-1031,1119`. Read cookie via `req.cookies.get('session')?.value` — `authentication.md:1123`.
- The v16 codemod renames the file + flags automatically — `…/version-16.md:78-85`.

## Breaking changes / async APIs

- **Async Request APIs — sync access fully REMOVED in 16** (was a temporary v15 shim). These are now async-only and MUST be awaited — `…/version-16.md:294-306`:
  - `cookies()`, `headers()`, `draftMode()` — e.g. `const c = await cookies()` — `01-app/03-api-reference/04-functions/cookies.md:6,67`.
  - `params` in `layout/page/route/default`, OG/icon image files; `searchParams` in `page` — all `Promise<...>`, `await` them — `…/version-16.md:303-304`. Confirmed in page example `…/05-server-and-client-components.md:39-45`.
  - Migration: `npx next typegen` generates `PageProps`/`LayoutProps`/`RouteContext` helpers — `…/version-16.md:308-326`.
- `revalidateTag` now **requires a 2nd arg** (a `cacheLife` profile, e.g. `'max'`); 1-arg form is a TS error. New `updateTag` (Server-Action-only, read-your-writes) and `refresh()` added to `next/cache` — `…/version-16.md:453-561`.
- Turbopack is **default** for `next dev`/`next build` (drop `--turbopack` flags); a custom `webpack` config now fails the build unless you pass `--webpack` — `…/version-16.md:114-166`.
- `next lint` removed (use ESLint/Biome directly; `next build` no longer lints); ESLint defaults to **flat config** — `…/version-16.md:964-970,1093-1115`.
- `serverRuntimeConfig`/`publicRuntimeConfig` removed → use env vars; wrap with `connection()` from `next/server` to force runtime reads — `…/version-16.md:1127-1199`.
- `images.domains` deprecated → use `images.remotePatterns`. Node 20.9+, TS 5.1+ required — `…/version-16.md:106-112,889-916`.
- Parallel-route slots now require explicit `default.js` or builds fail — `…/version-16.md:942-962`.

## Metadata

- Existing `export const metadata` pattern is correct and supported — static `Metadata` object exported from `layout.js`/`page.js` — `01-app/01-getting-started/14-metadata-and-og-images.md:43-67`.
- `metadata` object and `generateMetadata` are **Server-Component-only** — cannot live in a `"use client"` file — `…/14-metadata-and-og-images.md:27`.
- Data-dependent metadata: export async `generateMetadata({ params, searchParams }, parent)`; **`params`/`searchParams` are Promises — await them** — `…/14-metadata-and-og-images.md:69-89`.
- Charset + viewport meta tags are auto-injected; viewport config moved to `generateViewport` — `…/14-metadata-and-og-images.md:30-41`.
