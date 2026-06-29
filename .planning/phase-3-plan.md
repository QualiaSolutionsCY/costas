---
phase: 3
goal: "Registration stops being a no-op — it persists a workshop row and stores the certificate in the private workshop-certs bucket."
tasks: 2
waves: 2
---

# Phase 3: Workshop registration → real

**Goal:** Submitting the workshop registration form persists a real `workshops` row tied to the signed-in mechanic, uploads the certificate to the private `workshop-certs` Storage bucket under `{uid}/…`, saves the object path to `workshops.cert_path`, and the success screen reflects the persisted values (including a working signed-URL link to the stored certificate).

**Why this phase:** Registration is the third and last dead-end flow (`RegisterForm.tsx:43 — "setSubmitted(true); // frontend-only"`). Closing it makes the demo's "real over impressive" promise true on every flow, and exercises the private-bucket + signed-URL path that no other flow touches.

---

## Task 1 — Registration server action: validate, upload cert, persist workshop

**Wave:** 1
**Persona:** backend
**Files:**
- `src/lib/actions/register.ts` (create) — exports `registerWorkshop(prev, formData: FormData): Promise<RegisterResult>` plus the exported `RegisterResult` discriminated-union type and the Zod `registerSchema`.
**Depends on:** none (consumes Phase 1's `workshops` table + `workshop-certs` bucket policies and Phase 2's server-action/`createClient()` auth pattern — does not create them)

**Why:**
Server Actions are reachable by direct POST, not just from the form (`research/STACK.md:29 — "verify auth/authz inside EVERY action"`), and the cert drop path is currently unvalidated (`concerns.md:14 — "accept=… is enforced only by the picker, not on drop"`). A single server-authoritative action is the only place that can safely validate the file, enforce the mechanic role, upload to a private bucket, and write the row in one trusted unit.

**Acceptance Criteria:**
- Calling the action with a valid name, serial, and an image/PDF file ≤ 5 MB creates exactly one `workshops` row whose `owner_id` equals the signed-in mechanic's uid, with the provided `name` and `serial`.
- The certificate file is uploaded to `workshop-certs` under the path `{uid}/cert.<ext>` with `upsert: true`, and that exact path is written to `workshops.cert_path`.
- The action returns a typed success result carrying `name`, `serial`, `certPath`, and a `signedUrl` (a `createSignedUrl` link valid ≥ 5 minutes) for the stored certificate.
- An unauthenticated caller, a caller whose `app_metadata.role` ≠ `mechanic`, an oversized file (> 5 MB), or a wrong MIME type (not `image/*` / `application/pdf`) each return a typed error result with a stable `code` — never throw an unhandled error and never write a partial row.

**Action:**
1. Create `src/lib/actions/register.ts` with a `'use server'` file-top directive (per `research/STACK.md:26-27`).
2. Define `registerSchema` with Zod: `name` (`z.string().trim().min(1)`), `serial` (`z.string().trim().min(1)`), and a file check — accept a `File` from `FormData`, reject if `file.size > 5 * 1024 * 1024` or `!["image/jpeg","image/png","image/webp","application/pdf"].includes(file.type)`. If Zod is not yet a dependency (`grep zod package.json`), run `npm i zod` as the first step.
3. Export `type RegisterResult = { ok: true; name: string; serial: string; certPath: string; signedUrl: string } | { ok: false; code: "unauthenticated" | "not_mechanic" | "invalid_name" | "invalid_serial" | "invalid_file" | "upload_failed" | "db_failed" }`.
4. In `registerWorkshop`: `const supabase = await createClient()` (the async server factory from `src/lib/supabase/server.ts`, per `research/ARCHITECTURE.md:34`). Get the user via `getClaims()`/`getUser()` (the Phase 2 pattern); return `{ ok:false, code:"unauthenticated" }` if absent. Read `app_metadata.role`; return `{ ok:false, code:"not_mechanic" }` if ≠ `"mechanic"`.
5. Parse `formData` fields and the `cert` file through `registerSchema`; map each failure to the matching `invalid_*` code (no throw).
6. Derive `ext` from the validated MIME (`pdf`/`jpg`/`png`/`webp`); upload via `supabase.storage.from("workshop-certs").upload(`${uid}/cert.${ext}`, file, { upsert: true, contentType: file.type })` (per `research/ARCHITECTURE.md:130` — private bucket, upsert needs the INSERT+SELECT+UPDATE policies already shipped in Phase 1). On error return `{ ok:false, code:"upload_failed" }`.
7. Upsert the `workshops` row: `supabase.from("workshops").upsert({ owner_id: uid, name, serial, cert_path: path }, { onConflict: "owner_id" })`. On error return `{ ok:false, code:"db_failed" }`.
8. Create the signed URL: `supabase.storage.from("workshop-certs").createSignedUrl(path, 300)` (per `research/ARCHITECTURE.md:152` — private bucket served via `createSignedUrl`). Return the success result with `signedUrl`.
9. Do NOT import `src/lib/supabase/client.ts` or any `service_role` client here — this action runs under the caller's RLS (per `rules/security.md`).

**Validation:** (builder self-check before commit)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -c "createSignedUrl\|upsert: true\|getClaims\|getUser" src/lib/actions/register.ts` → ≥ `3`
- `grep -c "service_role\|SERVICE_ROLE\|supabase/client" src/lib/actions/register.ts` → `0`
- `grep -c "z\.\|registerSchema" src/lib/actions/register.ts` → ≥ `2`

**Context:** Read @.planning/research/ARCHITECTURE.md @.planning/research/STACK.md @.planning/codebase/concerns.md @src/components/RegisterForm.tsx @.planning/CONTEXT.md @/home/qualiasolutions/.claude/rules/security.md

---

## Task 2 — Wire RegisterForm to the action: real submit, persisted success screen, bilingual states

**Wave:** 2
**Persona:** frontend
**Files:**
- `src/components/RegisterForm.tsx` (modify) — replace the `// frontend-only` submit with the `registerWorkshop` action; render submitting/error states; drive the success screen from the persisted result; add a signed-URL "view certificate" link.
- `src/lib/i18n.ts` (modify) — add the new EL+EN strings and extend the `Translation` type.
**Depends on:** Task 1 (imports `registerWorkshop` and `RegisterResult` from `src/lib/actions/register.ts`)

**Why:**
The form already collects name, serial, and a file (`RegisterForm.tsx:17-19`) and renders a success summary (`RegisterForm.tsx:53-71`), but `submit` is a client no-op (`RegisterForm.tsx:43`) and the summary reads client state plus the static `workshop.name` singleton (`RegisterForm.tsx:63`). Wiring it to the action is what makes REG-01/02/03 observable; without it the action ships unreachable.

**Acceptance Criteria:**
- Submitting a valid registration calls `registerWorkshop`, and on success the screen shows the persisted `name`, `serial`, and certificate filename plus a "View certificate" link that opens the signed URL (REG-03 — driven by the action result, not client state).
- While the action is in flight the submit button shows a submitting label and is disabled (no double-submit); on `ok:false` an inline, human, bilingual error message appears (mapped from the result `code`) and the form stays filled so the user can retry — never a raw code or red wall (per `PRODUCT.md:33-35`).
- A file rejected by the server (too large / wrong type) surfaces the `invalid_file` message in the user's current language; an oversized file does not silently appear "saved".
- Every new string is present in BOTH `el` and `en` in `lib/i18n.ts` — a missing key is a TypeScript build error (I18N invariant, `PRODUCT.md:63`).

**Action:**
1. In `src/lib/i18n.ts`, extend the `Translation` type and BOTH `el`/`en` objects with: `submitting`, `viewCert`, and an error map `regErrors: { unauthenticated; not_mechanic; invalid_name; invalid_serial; invalid_file; upload_failed; db_failed }` — each a calm, actionable EL/EN sentence in the established voice (e.g. EL `invalid_file: "Το αρχείο πρέπει να είναι PDF ή εικόνα έως 5MB."`, EN `"The file must be a PDF or image up to 5MB."`). Keep them next to the existing `reg*` keys (`i18n.ts:105-120`, `:171-186`).
2. In `RegisterForm.tsx`, convert `submit` to drive the Server Action. Build a `FormData` (fields `name`, `serial`, and `cert` = the `file`) and use `useActionState(registerWorkshop, null)` (per `research/STACK.md:28`) or an async handler calling `registerWorkshop`; track `pending` for the button.
3. Replace the `disabled={!valid}` submit label area so it reads `t.submitting` while pending and `t.submitReg` otherwise; keep `disabled` true while pending OR `!valid`.
4. On a `{ ok:false }` result, render an inline error block (use existing token classes — `text-negative`, `text-sm`) showing `t.regErrors[result.code]`; do NOT clear the form fields.
5. On `{ ok:true }`, switch to the existing success layout but source the rows from the result: `name` → `result.name`, `serial` → `result.serial`, and replace the static `workshop.name` row (`RegisterForm.tsx:63`) with the persisted file — add a `t.viewCert` anchor `<a href={result.signedUrl} target="_blank" rel="noopener noreferrer">` styled with `text-accent`. Drop the now-unused `workshop` import if nothing else needs it.
6. Remove the `// frontend-only` comment and the bare `setSubmitted(true)`; the success state is now gated on `result.ok`.
7. Do not introduce raw hex or a native `<select>`; reuse the existing token classes and the established input/button styling (`DESIGN.md:45-46`).

**Validation:** (builder self-check before commit)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0` (proves every new i18n key exists in both `el` and `en`)
- `grep -c "registerWorkshop" src/components/RegisterForm.tsx` → ≥ `1`
- `grep -c "frontend-only" src/components/RegisterForm.tsx` → `0`
- `grep -c "regErrors\|viewCert\|submitting" src/lib/i18n.ts` → ≥ `6` (3 keys × EL+EN, at minimum)
- `node /home/qualiasolutions/.claude/bin/slop-detect.mjs src/components/RegisterForm.tsx` → no critical findings

**Context:** Read @src/components/RegisterForm.tsx @src/lib/i18n.ts @src/lib/data.ts @.planning/DESIGN.md @.planning/PRODUCT.md @src/components/icons.tsx

**Design:**
- Register: product
- Tokens used: `text-negative` (error message), `text-accent` (view-certificate link), `text-positive`/`bg-positive/12` (existing success badge), `bg-surface`/`bg-surface-2`, `text-muted`, `border` — all via Tailwind token classes, no raw hex.
- Scope: component (`RegisterForm`) + its i18n strings.
- Anti-pattern guard: builder runs `node /home/qualiasolutions/.claude/bin/slop-detect.mjs src/components/RegisterForm.tsx` pre-commit; commit blocked on critical findings. No raw hex, no native `<select>`, every string via `t.*` in both `el` and `en`.

---

## Success Criteria

Phase-level truths — observable when this phase is done.

- [ ] Submitting the registration form as the seeded mechanic creates one `workshops` row with that mechanic's `owner_id`, the entered `name`, and `serial`.
- [ ] The certificate file lands in the private `workshop-certs` bucket under `{uid}/cert.<ext>` and `workshops.cert_path` holds that exact path.
- [ ] The success screen shows the persisted `name`/`serial`/file and a working "View certificate" link backed by a `createSignedUrl` (not a client object URL).
- [ ] Server-side validation rejects an oversized or wrong-type file and an unauthenticated/non-mechanic caller with a calm bilingual message — no partial write, no raw error code.
- [ ] EL and EN render on every new string; a missing translation fails the build.

## Verification Contract

Machine-executable checks the verifier runs verbatim. One per task minimum.

### Contract for Task 1 — register action exists
**Check type:** file-exists
**Command:** `test -f src/lib/actions/register.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File does not exist.

### Contract for Task 1 — server-authoritative upload + signed URL + auth
**Check type:** grep-match
**Command:** `grep -c "createSignedUrl\|upsert: true\|getClaims\|getUser" src/lib/actions/register.ts`
**Expected:** ≥ `3`
**Fail if:** Returns 0–2 — the action is missing the private-bucket upload, the signed-URL serve path, or the in-action auth check.

### Contract for Task 1 — no service_role / client import (RLS preserved)
**Check type:** grep-match
**Command:** `grep -c "service_role\|SERVICE_ROLE\|lib/supabase/client" src/lib/actions/register.ts`
**Expected:** `0`
**Fail if:** Returns ≥ 1 — the action bypasses the caller's RLS or leaks the service key into a reachable POST endpoint.

### Contract for Task 1 — server-side file validation present
**Check type:** grep-match
**Command:** `grep -c "5 \* 1024 \* 1024\|file.size\|file.type\|application/pdf" src/lib/actions/register.ts`
**Expected:** ≥ `2`
**Fail if:** Returns 0–1 — the unchecked drop path (concerns.md:14) was not closed on the server.

### Contract for Task 2 — form wired to the action
**Check type:** grep-match
**Command:** `grep -c "registerWorkshop" src/components/RegisterForm.tsx`
**Expected:** ≥ `1`
**Fail if:** Returns 0 — the action exists but the form still does not call it.

### Contract for Task 2 — frontend-only no-op removed
**Check type:** grep-match
**Command:** `grep -c "frontend-only" src/components/RegisterForm.tsx`
**Expected:** `0`
**Fail if:** Returns ≥ 1 — the placeholder submit was not replaced.

### Contract for Task 2 — new bilingual strings present
**Check type:** grep-match
**Command:** `grep -c "regErrors\|viewCert\|submitting" src/lib/i18n.ts`
**Expected:** ≥ `6`
**Fail if:** Returns < 6 — the error/submitting/view-cert strings are missing from one language.

### Contract for Task 2 — type-checks (proves i18n parity + action typing)
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript error — a missing i18n key or a mismatched `RegisterResult` shape both surface here.

### Contract for Phase 3 — end-to-end persistence (behavioral)
**Check type:** behavioral
**Command:** (verifier signs in as the seeded mechanic, submits the form with a real ≤5MB PDF/image)
**Expected:** A `workshops` row appears (`owner_id` = mechanic uid, `cert_path` = `{uid}/cert.<ext>`), the file is in the `workshop-certs` bucket, and the success screen's "View certificate" link opens the file via a signed URL. Submitting a 10 MB file shows the calm bilingual file-error and writes no row.
**Fail if:** No row is written, the file is absent from Storage, the link 403s/expired, or an oversized file is accepted.
