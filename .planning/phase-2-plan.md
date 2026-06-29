---
phase: 2
goal: "Admin approves/rejects a workshop (persists with timestamp/reason); approved workshops show a certified badge on every workshop surface; pending/rejected visually distinguished."
tasks: 3
waves: 2
---

# Phase 2: Approve / Reject Actions & Badge

**Goal:** The admin can approve or reject a workshop from `/admin`; the action persists to the database with a timestamp (approve) or reason (reject); approved workshops display a "Πιστοποιημένο / Certified" badge everywhere a workshop is shown, while pending and rejected workshops are visually distinguished. Covers VERIF-03, VERIF-04, VERIF-05, VERIF-06.

**Why this phase:** It closes the trust loop M1 opened — registration captured workshop credentials but nothing made them real or visible. This phase makes verification an enforceable, server-checked action and surfaces the result so an owner can see "this job was done by a verified workshop."

---

## Task 1 — Admin approve/reject server actions + badge i18n keys
**Wave:** 1
**Persona:** security
**Files:**
- `src/lib/admin-actions.ts` (CREATE — exports `approveWorkshop(workshopId: string)`, `rejectWorkshop(workshopId: string, reason: string)`, and `type AdminActionResult`)
- `src/lib/i18n.ts` (MODIFY — add `certified`, `pendingReview`, `rejected`, `rejectReasonLabel`, `rejectReasonPlaceholder`, `approveBtn`, `rejectBtn`, `confirmReject`, `cancelReject` keys to the `Translation` type and both `el` + `en` dictionaries)
**Depends on:** none

**Why:** VERIF-03/04 require approve and reject to persist server-side, and VERIF-05's success criterion #5 is non-negotiable: a crafted non-admin call must be rejected *server-side before any DB write* — the admin RLS policy (`0006:21 — "workshops_admin_all"`) is the database backstop, but the action must also verify `app_metadata.role === 'admin'` in code so a non-admin gets an explicit `forbidden` result, not a silent RLS no-op. The i18n keys exist because a missing key is a compile error (`DESIGN.md:70`) and every badge/button string must be bilingual.

**Acceptance Criteria:**
- An admin calling `approveWorkshop(id)` sets that workshop's `status` to `verified` and `reviewed_at` to the current timestamp; the function returns `{ ok: true }`.
- An admin calling `rejectWorkshop(id, reason)` sets `status` to `rejected`, stores `reason` in `rejection_reason`, sets `reviewed_at`, and returns `{ ok: true }`.
- A caller whose `app_metadata.role !== 'admin'` (or unauthenticated) gets `{ ok: false, error: 'forbidden' }` and NO database row is mutated.
- An empty/whitespace `reason` passed to `rejectWorkshop` returns `{ ok: false, error: 'reason' }` without a DB write.
- Both `el` and `en` dictionaries contain all nine new keys; `npx tsc --noEmit` passes.

**Action:**
1. Create `src/lib/admin-actions.ts` with `"use server"` at the top. Follow the established pattern in `src/lib/mechanic-actions.ts:1-8` (import `createClient` from `@/lib/supabase/server`, `revalidatePath` from `next/cache`, `z` from `zod`).
2. Add a private guard: `const role = await getSessionRole();` (import `getSessionRole` from `@/lib/session` — it reads ONLY `app_metadata.role`, see `session.ts:37-43`). `if (role !== 'admin') return { ok: false, error: 'forbidden' };`. Call this guard FIRST in both actions, before any Supabase write.
3. Export `type AdminActionResult = { ok: true } | { ok: false; error: 'forbidden' | 'reason' | 'save' }`.
4. `approveWorkshop(workshopId: string)`: after the guard, validate `workshopId` is a non-empty string (`z.string().uuid()` — return `{ ok: false, error: 'save' }` on parse fail). Then `await supabase.from('workshops').update({ status: 'verified', reviewed_at: new Date().toISOString() }).eq('id', workshopId)`. On error return `{ ok: false, error: 'save' }`. On success `revalidatePath('/admin')` then `return { ok: true }`.
5. `rejectWorkshop(workshopId: string, reason: string)`: after the guard, `const trimmed = reason.trim(); if (!trimmed) return { ok: false, error: 'reason' };` then validate the uuid. `update({ status: 'rejected', rejection_reason: trimmed, reviewed_at: new Date().toISOString() }).eq('id', workshopId)`. Same error handling + `revalidatePath('/admin')`.
6. In `src/lib/i18n.ts`: add to the `Translation` type (after `adminNoCert` on line 141): `certified: string; pendingReview: string; rejected: string; rejectReasonLabel: string; rejectReasonPlaceholder: string; approveBtn: string; rejectBtn: string; confirmReject: string; cancelReject: string;`. Then add Greek values in the `el` block (after `adminNoCert` line 289) and English values in the `en` block (after `adminNoCert` line 435). Greek: `certified: "Πιστοποιημένο"`, `pendingReview: "Σε αναμονή"`, `rejected: "Απορρίφθηκε"`, `rejectReasonLabel: "Λόγος απόρριψης"`, `rejectReasonPlaceholder: "Γιατί απορρίπτεται;"`, `approveBtn: "Έγκριση"`, `rejectBtn: "Απόρριψη"`, `confirmReject: "Επιβεβαίωση απόρριψης"`, `cancelReject: "Άκυρο"`. English: `certified: "Certified"`, `pendingReview: "Pending"`, `rejected: "Rejected"`, `rejectReasonLabel: "Rejection reason"`, `rejectReasonPlaceholder: "Why is it rejected?"`, `approveBtn: "Approve"`, `rejectBtn: "Reject"`, `confirmReject: "Confirm rejection"`, `cancelReject: "Cancel"`.

**Validation:** (builder self-check)
- `grep -c "getSessionRole\|role !== 'admin'" src/lib/admin-actions.ts` → ≥ 2 (guard present in both actions)
- `grep -c "\"use server\"" src/lib/admin-actions.ts` → 1
- `grep -c "certified\|pendingReview\|rejected" src/lib/i18n.ts` → ≥ 6 (3 keys × 2 dictionaries)
- `npx tsc --noEmit` → exit 0, no `error TS`

**Context:** Read @src/lib/mechanic-actions.ts (server-action + zod + revalidatePath pattern), @src/lib/session.ts (getSessionRole reads app_metadata only), @src/lib/i18n.ts (dictionary shape — both el and en must stay in sync), @supabase/migrations/0006_workshop_verification.sql (admin RLS backstop + status/reviewed_at/rejection_reason columns), @.planning/PROJECT.md

---

## Task 2 — WorkshopBadge component + verified-names helper
**Wave:** 1
**Persona:** frontend
**Files:**
- `src/components/WorkshopBadge.tsx` (CREATE — client component, exports `WorkshopBadge` and `type WorkshopStatus = 'verified' | 'pending' | 'rejected'`)
- `src/lib/workshop-status.ts` (CREATE — server module, exports `getVerifiedWorkshopNames(): Promise<Set<string>>`)
**Depends on:** none

**Why:** VERIF-05/06 require ONE consistent badge primitive reused on every workshop surface (mechanic header, owner hero, owner history entries) so verified/pending/rejected are visually unmistakable and never drift apart. The helper exists because the owner side has no FK from `service_entries.place` (free text, `database.types.ts:44`) to a workshop — the only honest way to mark an owner history entry "verified" is to resolve its `place` against the set of currently-verified workshop names. Centralizing the lookup in one server module keeps the owner page a thin wiring layer (`architecture.md` §4).

**Acceptance Criteria:**
- `<WorkshopBadge status="verified" />` renders a green chip with the shield icon and the `t.certified` label; `status="pending"` renders a muted chip with `t.pendingReview`; `status="rejected"` renders a negative-toned chip with `t.rejected`.
- The badge uses ONLY semantic tokens — no raw hex, no default Tailwind palette colors.
- The badge is bilingual: switching language swaps the label via `useLang()`.
- `getVerifiedWorkshopNames()` returns a `Set<string>` of `workshops.name` where `status = 'verified'`; returns an empty Set on error (never throws).

**Action:**
1. Create `src/components/WorkshopBadge.tsx` as a `"use client"` component. Import `useLang` from `./LanguageProvider` and `Icon` from `./icons` (the shield glyph already exists — used at `MechanicLog.tsx:146`).
2. Export `type WorkshopStatus = 'verified' | 'pending' | 'rejected'`. Props: `{ status: WorkshopStatus; className?: string }`.
3. Render a single inline chip. Match the existing positive-chip pattern at `ServiceLog.tsx:180-182` (`inline-flex items-center gap-1 ... rounded-full ... px-2 py-0.5 text-[11px] font-medium`). Map status → token classes:
   - `verified`: `bg-positive/10 text-positive`, icon `shield`, label `t.certified`.
   - `pending`: `bg-surface-2 text-muted`, icon `shield`, label `t.pendingReview`.
   - `rejected`: `bg-negative/10 text-negative`, icon `shield`, label `t.rejected`.
   Icon size `h-3 w-3` to match `ServiceLog.tsx:181`.
4. Create `src/lib/workshop-status.ts` with `import "server-only";` (pattern from `session.ts:1`) and `import { createClient } from "@/lib/supabase/server";`. Export `async function getVerifiedWorkshopNames(): Promise<Set<string>>`: query `supabase.from('workshops').select('name').eq('status', 'verified')`; on error or null data `return new Set()`; else `return new Set(data.map((r) => r.name))`.

**Validation:** (builder self-check)
- `grep -cE "#[0-9a-fA-F]{6}|bg-(red|green|blue|yellow|gray)-" src/components/WorkshopBadge.tsx` → 0 (no raw hex / default palette)
- `grep -c "t.certified\|t.pendingReview\|t.rejected" src/components/WorkshopBadge.tsx` → 3
- `grep -c "server-only" src/lib/workshop-status.ts` → 1
- `npx tsc --noEmit` → exit 0 (depends on Task 1's i18n keys existing — Task 1 is in the same wave; if keys are missing, this is a wave-ordering bug, escalate)

**Context:** Read @src/components/ServiceLog.tsx (existing positive-chip pattern at lines 180-182, the owner hero badge this replaces), @src/components/MechanicLog.tsx (shield icon usage at line 146, the certified line this replaces), @src/lib/session.ts (server-only module pattern), @.planning/DESIGN.md (token table §2, chip patterns §5)

**Design:**
- Register: product
- Tokens used: `bg-positive/10`, `text-positive`, `bg-surface-2`, `text-muted`, `bg-negative/10`, `text-negative`, `rounded-full`, `text-[11px]`
- Scope: component
- Anti-pattern guard: builder runs `node bin/slop-detect.mjs src/components/WorkshopBadge.tsx` pre-commit if the script exists; otherwise verify the grep in Validation returns 0. Commit blocked on any raw hex or default Tailwind palette color in JSX (`DESIGN.md:69`).

---

## Task 3 — Wire approve/reject into AdminReviewList; propagate badge to mechanic + owner surfaces
**Wave:** 2
**Persona:** frontend
**Files:**
- `src/components/AdminReviewList.tsx` (MODIFY — add per-row Approve / Reject controls with optimistic removal)
- `src/components/MechanicLog.tsx` (MODIFY — accept a `workshopStatus` prop; replace the hardcoded `{t.mechCertified}` certified line at lines 145-148 with `<WorkshopBadge>`)
- `src/app/mechanic/page.tsx` (MODIFY — fetch the signed-in mechanic's workshop status and pass it to `MechanicLog`)
- `src/components/ServiceLog.tsx` (MODIFY — replace the hardcoded hero badge at lines 180-182 with `<WorkshopBadge>` driven by the matched workshop's status; mark history entries whose `place` matches a verified workshop)
- `src/app/page.tsx` (MODIFY — fetch verified workshop names, pass down to `ServiceLog`)
**Depends on:** Task 1 (admin-actions), Task 2 (WorkshopBadge + getVerifiedWorkshopNames)

**Why:** This is the user-visible payoff: VERIF-03/04 success criteria #1 and #2 require the row to leave the pending list *without a full page reload* on approve/reject (optimistic UI), and VERIF-05/06 require the badge on EVERY workshop surface. The mechanic header (`MechanicLog.tsx:145-148`) and owner hero (`ServiceLog.tsx:180-182`) both currently hardcode `{t.mechCertified}` unconditionally — that asserts "certified" even for an unverified workshop, which is exactly the trust gap this milestone closes.

**Acceptance Criteria:**
- On `/admin`, each pending row shows an "Approve" and a "Reject" button. Clicking Approve removes the row from the list immediately (optimistic) and calls `approveWorkshop`; the workshop's `status` is `verified` in the DB.
- Clicking Reject reveals an inline reason input + confirm; submitting removes the row optimistically and calls `rejectWorkshop` with the reason; `rejection_reason` is stored.
- On `/mechanic`, a signed-in mechanic whose workshop is `verified` sees the green certified badge in the header; a `pending` workshop sees the muted "Pending" badge; `rejected` sees the negative "Rejected" badge. (When no signed-in workshop row exists — anonymous demo use — the header falls back to the existing hardcoded `workshop.name` from `data.ts` and shows no DB-backed status.)
- On `/` (owner), the vehicle hero badge reflects whether the most-recent service's `place` matches a verified workshop; each history entry whose `place` matches a verified workshop name shows the certified badge.
- `npx tsc --noEmit` passes; no full-page reload occurs on approve/reject.

**Action:**
1. **AdminReviewList** (`src/components/AdminReviewList.tsx`): import `useOptimistic` and `useTransition` from `react`, and `approveWorkshop`, `rejectWorkshop` from `@/lib/admin-actions`. Wrap the rendered list with `const [optimistic, removeOptimistic] = useOptimistic(workshops, (state, removedId: string) => state.filter((w) => w.id !== removedId))`. Render the controls inside the existing `<div className="mt-3 border-t pt-3">` (line 72), beside the cert link. Approve button (`t.approveBtn`) reuses the bordered-control style from line 78 but tinted positive (`text-positive hover:bg-positive/10`). On click: `startTransition(() => { removeOptimistic(w.id); approveWorkshop(w.id); })`. Reject button (`t.rejectBtn`, `text-negative`) toggles a local `rejectingId` state that swaps the row footer for an inline reason `<input>` (style from `ServiceLog.tsx:256` input pattern) + a confirm button (`t.confirmReject`) and cancel (`t.cancelReject`). Confirm: `startTransition(() => { removeOptimistic(w.id); rejectWorkshop(w.id, reason); })`. Keep all strings via `t.*`.
2. **MechanicLog** (`src/components/MechanicLog.tsx`): add a prop `workshopStatus?: WorkshopStatus` to the component signature (import `WorkshopBadge`, `type WorkshopStatus` from `./WorkshopBadge`). Replace the certified `<p>` at lines 145-148 — when `workshopStatus` is provided, render `<WorkshopBadge status={workshopStatus} />` followed by `· {t.workshopCity}`; when absent, keep the existing `{t.mechCertified} · {t.workshopCity}` fallback so anonymous demo use is unchanged.
3. **mechanic/page.tsx** (`src/app/mechanic/page.tsx`): convert to fetch the workshop. Import `getSessionRole` is NOT needed; instead `import { createClient } from "@/lib/supabase/server"`. `const supabase = await createClient(); const { data } = await supabase.from('workshops').select('status').maybeSingle();` — the `workshops_select_own` policy (`0001:100`) scopes this to the caller's own row. Map `data?.status` (`'verified'|'pending'|'rejected'`) to the `WorkshopStatus` prop (pass `undefined` when no row). Pass `workshopStatus={status}` to `<MechanicLog>`.
4. **ServiceLog** (`src/components/ServiceLog.tsx`): add a prop `verifiedWorkshops: string[]` (a serializable list — convert the Set to an array at the page boundary). Import `WorkshopBadge` from `./WorkshopBadge`. Build `const verifiedSet = new Set(verifiedWorkshops)`. Hero badge (lines 180-182): derive the latest entry's place — replace the hardcoded chip with `<WorkshopBadge status={verifiedSet.has(entries[0]?.place ?? '') ? 'verified' : 'pending'} />`. History entries (the `entry.place` block at lines 304-308): when `entry.place && verifiedSet.has(entry.place)`, append a `<WorkshopBadge status="verified" />` next to the place line.
5. **page.tsx** (`src/app/page.tsx`): `import { getVerifiedWorkshopNames } from "@/lib/workshop-status"`. `const verified = await getVerifiedWorkshopNames();` and pass `verifiedWorkshops={[...verified]}` to `<ServiceLog>`.

**Validation:** (builder self-check)
- `grep -c "approveWorkshop\|rejectWorkshop" src/components/AdminReviewList.tsx` → ≥ 2 (actions wired into the list)
- `grep -c "useOptimistic" src/components/AdminReviewList.tsx` → 1
- `grep -c "WorkshopBadge" src/components/MechanicLog.tsx src/components/ServiceLog.tsx` → ≥ 2 (badge on both surfaces)
- `grep -c "getVerifiedWorkshopNames" src/app/page.tsx` → 1
- `grep -c "from('workshops')\|from(\"workshops\")" src/app/mechanic/page.tsx` → 1 (mechanic page fetches own workshop status)
- `npx tsc --noEmit` → exit 0, no `error TS`

**Context:** Read @src/components/AdminReviewList.tsx (the list this wires actions into; per-row footer at lines 72-89), @src/components/MechanicLog.tsx (header certified line 145-148; this is a client component with hooks — add the prop, don't break useActionState), @src/app/mechanic/page.tsx (currently no DB fetch; becomes async with a scoped workshop query), @src/components/ServiceLog.tsx (hero badge 180-182; history place block 304-308), @src/app/page.tsx (owner page wiring), @src/lib/admin-actions.ts (Task 1 — approve/reject signatures), @src/components/WorkshopBadge.tsx (Task 2 — badge + WorkshopStatus type), @src/lib/workshop-status.ts (Task 2 — getVerifiedWorkshopNames), @.planning/DESIGN.md

**Design:**
- Register: product
- Tokens used: `text-positive`, `bg-positive/10`, `text-negative`, `bg-negative/10`, `text-muted`, `bg-surface-2`, `border`, `rounded-lg`, `rounded-full`
- Scope: section (admin list + mechanic header + owner hero/history)
- Anti-pattern guard: builder runs `node bin/slop-detect.mjs src/components/AdminReviewList.tsx src/components/ServiceLog.tsx src/components/MechanicLog.tsx` pre-commit if the script exists. Commit blocked on any raw hex / default Tailwind palette in the modified JSX, and on any hardcoded (non-`t.*`) UI string (`DESIGN.md:69-70`).

---

## Success Criteria
- [ ] Admin clicks Approve on a pending workshop → `status` becomes `verified`, `reviewed_at` is set, row leaves the pending list without a full page reload (VERIF-03).
- [ ] Admin clicks Reject, enters a reason, confirms → `status` becomes `rejected`, `rejection_reason` stored, row leaves the list (VERIF-04).
- [ ] A verified workshop shows the "Πιστοποιημένο / Certified" badge on the mechanic header and on matching owner history surfaces; pending/rejected show distinct indicators (VERIF-05, VERIF-06).
- [ ] All badge/button strings are bilingual (present in both `el` and `en`); no raw hex in any new/modified JSX (`DESIGN.md`).
- [ ] A non-admin `approveWorkshop`/`rejectWorkshop` call returns `forbidden` and mutates no row (VERIF-05 criterion #5).
- [ ] `npx tsc --noEmit` exits 0.

---

## Verification Contract

### Contract for Task 1 — admin-actions exist
**Check type:** file-exists
**Command:** `test -f src/lib/admin-actions.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File does not exist

### Contract for Task 1 — server-side admin guard before DB write
**Check type:** grep-match
**Command:** `grep -c "getSessionRole" src/lib/admin-actions.ts`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — the action does not verify the role server-side, so a non-admin crafted call could reach the DB

### Contract for Task 1 — both actions return forbidden for non-admin
**Check type:** grep-match
**Command:** `grep -c "forbidden" src/lib/admin-actions.ts`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — no explicit forbidden path; VERIF criterion #5 unmet

### Contract for Task 1 — both actions write the right columns
**Check type:** grep-match
**Command:** `grep -cE "status: 'verified'|status: 'rejected'|reviewed_at|rejection_reason" src/lib/admin-actions.ts`
**Expected:** ≥ 3
**Fail if:** Fewer than 3 — approve/reject don't persist the full state transition

### Contract for Task 1 — bilingual badge keys present
**Check type:** grep-match
**Command:** `grep -c "certified:" src/lib/i18n.ts`
**Expected:** `2` (one in el, one in en)
**Fail if:** Not 2 — a missing key is a compile error and breaks one language

### Contract for Task 2 — WorkshopBadge exists with no raw hex
**Check type:** grep-match
**Command:** `grep -cE "#[0-9a-fA-F]{6}|bg-(red|green|blue|yellow|gray)-[0-9]" src/components/WorkshopBadge.tsx`
**Expected:** `0`
**Fail if:** Non-zero — raw hex or default Tailwind palette violates the token system (DESIGN.md:69)

### Contract for Task 2 — verified-names helper is server-only
**Check type:** grep-match
**Command:** `grep -c "server-only" src/lib/workshop-status.ts`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — the helper could be imported client-side and leak the query

### Contract for Task 3 — actions wired into the admin list
**Check type:** grep-match
**Command:** `grep -c "approveWorkshop\|rejectWorkshop" src/components/AdminReviewList.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — the actions exist but aren't called from the list (the #1 wiring failure mode)

### Contract for Task 3 — optimistic removal on action
**Check type:** grep-match
**Command:** `grep -c "useOptimistic" src/components/AdminReviewList.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — row won't leave the list without a full reload, violating VERIF-03/04 criterion #1

### Contract for Task 3 — badge propagated to mechanic + owner
**Check type:** grep-match
**Command:** `grep -rc "WorkshopBadge" src/components/MechanicLog.tsx src/components/ServiceLog.tsx | grep -c ":[1-9]"`
**Expected:** `2`
**Fail if:** Not 2 — the badge is missing from a workshop surface, violating VERIF-05/06

### Contract for Task 3 — mechanic page fetches own workshop status
**Check type:** grep-match
**Command:** `grep -cE "from\\(['\"]workshops['\"]\\)" src/app/mechanic/page.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — the mechanic header status is still hardcoded, not DB-backed

### Contract for Tasks 1–3 — compiles clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript compilation errors

### Contract for Task 1 — non-admin call is rejected (behavioral)
**Check type:** behavioral
**Command:** (verifier signs in as `owner@costas.demo`, then invokes the `approveWorkshop` server action with a real pending workshop id via a crafted form/fetch)
**Expected:** The action returns `forbidden` and the workshop's `status` in the DB is unchanged (still `pending`)
**Fail if:** The status changes, or the action returns `ok: true` for a non-admin caller
