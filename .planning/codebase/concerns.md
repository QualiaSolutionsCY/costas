# Concerns

Documented, not fixed. This is a **frontend-only demo**, so most "concerns" are by-design for a demo and only become real if the project goes to production. Severity reflects production impact.

## By design (demo scope) — not bugs, but blockers for "real"
- **No persistence.** All data is `useState`; every form resets on refresh. `RegisterForm.submit` is explicitly `// frontend-only` (`RegisterForm.tsx:43`). Seed data is hardcoded in `lib/i18n.ts`. → To productionize: Supabase + RLS per Qualia infra defaults.
- **No backend / auth / API.** No `app/api/`, no Supabase client, no session. The mechanic and owner views are unauthenticated and share the same static `car`/`workshop` singletons (`lib/data.ts:14,19`).
- **No tests.** No test runner in `package.json`; zero test files.

## MEDIUM
- **Missing empty states.** `ServiceLog` / `MechanicLog` history lists assume seed data always exists; if `added` + seed were empty, the list renders nothing with no empty-state message (`ServiceLog.tsx:82`, `MechanicLog.tsx:123`).
- **`vehicles` / `settings` nav go nowhere** — both render a hardcoded "Coming soon" placeholder (`AppShell.tsx:54-58`). Dead-end nav for two of three items.
- **Owner-side `ServiceLog` has no "where/place" input.** The data model (`LogEntry.place`) and history rendering support `place`, and seed entries have it, but the owner's log form only captures service + date — never `place` (`ServiceLog.tsx:54-68`). New entries can never set the field the model/UI is built around.
- **No file-type/size validation on certificate upload.** `RegisterForm` accepts the dropped file as-is; `accept="image/*,application/pdf"` is enforced only by the picker, not on drop (`RegisterForm.tsx:31-36`).

## LOW
- **Date handling is naive.** `todayISO()` uses `new Date().toISOString()` (UTC) — off-by-one near midnight in Cyprus time. Duplicated in two files (`ServiceLog.tsx:9`, `MechanicLog.tsx:11`).
- **`<img>` instead of `next/image`** for the cert preview, with an inline eslint-disable (`RegisterForm.tsx:145`). Fine for a blob preview; flagged for completeness.
- **Object URL lifecycle:** `setSelected` revokes the previous preview URL but the last one is not revoked on unmount (`RegisterForm.tsx:26`) — minor leak in a demo.
- **`AGENTS.md` warns the Next.js version has breaking changes** vs. training data — read `node_modules/next/dist/docs/` before non-trivial framework work.

## Security
- Nothing exposed: no secrets, no `.env`, no service keys, no `dangerouslySetInnerHTML`, no `eval`. Clean for a static demo. (All Qualia security gates apply the moment a backend is added.)
