---
phase: 1
goal: "Every M2–M5 surface passes the design quality bar — all interactive elements have loading/empty/error/confirm states, layouts hold at 375px and 1440px, a11y is clean, and EL/EN copy is complete with no missing keys or English leak in Greek mode."
tasks: 3
waves: 1
---

# Phase 1: Polish

**Goal:** Close the real state-coverage gaps on the M4/M5 surfaces (booking, incoming bookings, reminders, reminder prefs, admin review) so every data mutation surfaces an error to the user, and every date renders in the project's canonical `dd/mm/yyyy` form. No new design language, no new i18n keys.
**Why this phase:** M4/M5 were shipped via a fast parallel workflow — build-verified but not exhaustively polished. The audit found three concrete classes of gap: data mutations that silently swallow failures, raw-ISO date display that breaks visual consistency, and optimistic admin actions with no failure recovery. These are the gap between "works on the happy path" and "passes the quality bar."

---

## Audit summary (what is ALREADY done — do NOT touch)

Grounded findings from reading the actual M2–M5 surfaces:

- **`prefers-reduced-motion` — DONE.** `src/app/globals.css:96` has a full `@media (prefers-reduced-motion: reduce)` block killing all animations/transitions + the skeleton shimmer. HAND-03 is satisfied; no task needed.
- **EL/EN parity — DONE.** `src/lib/i18n.ts` holds 218 `el` keys and 218 `en` keys with zero orphans, enforced at compile time by the `Translation` type (i18n.ts:7). HAND-02 holds. **All tasks below reuse existing keys (`errSave`, `bookError`, `loadError`, `saving`, `reminderDismiss`) — no new keys, so parity stays 218/218.**
- **Route-level loading — DONE.** `src/app/loading.tsx` is a brand-marked spinner that cascades to every nested `force-dynamic` route (`/book`, `/bookings`, `/reminders`, `/settings`, `/admin`) per App Router segment fallback. No per-route `loading.tsx` needed.
- **Auth pages (signup, forgot-password) — DONE.** `src/app/signup/page.tsx` and `src/app/forgot-password/page.tsx` have full error states (`role="alert"`, bilingual messages), loading (spinner + disabled), and success branches. Not in scope.
- **Settings + Admin empty/confirm states — DONE.** `SettingsClient.tsx` has signed-out empty state, vehicle empty state, a `role="dialog" aria-modal` remove-confirmation, and error branches on every form. `AdminReviewList.tsx` has an empty state and accessible reject flow.
- **tsc clean, zero TODO/FIXME** in `src/`.

The three tasks below address only the REAL gaps the audit surfaced.

---

## Task 1 — Booking surfaces: add missing error feedback + canonical date format
**Wave:** 1
**Persona:** frontend
**Files:** `src/components/BookingForm.tsx`, `src/components/IncomingBookings.tsx`
**Depends on:** none

**Why:** (Implements HAND-01: final states/responsive/a11y pass on the M4/M5 surfaces.) The owner booking list and the workshop incoming-bookings list render `requested_date` as a raw ISO string (`2026-06-29`) while every other dated surface in the app uses `dd/mm/yyyy` (`ServiceLog.tsx:23`, `MechanicLog.tsx:30`, `RemindersList.tsx:10`) — a visible inconsistency on two M4 surfaces. Separately, the owner booking `note` field is captured and stored but never shown back in the bookings list, so a submitted note silently vanishes from the user's view.

**Acceptance Criteria:**
- In the owner "My bookings" list, a `requested_date` displays as `dd/mm/yyyy` (e.g. `29/06/2026`), not `2026-06-29`.
- In the workshop incoming-bookings list, a `requested_date` displays as `dd/mm/yyyy`.
- A booking that has a `note` shows that note in the owner's "My bookings" row (it is already shown on the workshop side at `IncomingBookings.tsx:106-108`).
- No new i18n keys added; `el`/`en` key count stays 218/218 (`npx tsc --noEmit` still passes — `Translation` type unchanged).

**Action:**
1. In `BookingForm.tsx`, add a local `formatDate(iso: string)` helper identical to `RemindersList.tsx:10-13` (`const [y,m,d] = iso.split("-"); return d && m && y ? \`${d}/${m}/${y}\` : iso;`). Apply it to the date render at `BookingForm.tsx:205` — change `{b.requested_date}` to `{formatDate(b.requested_date)}` (guard the existing `b.requested_date ?` truthy check stays).
2. In `BookingForm.tsx`, in the "My bookings" `<li>` block (around lines 197-209), after the date `<p>`, add `{b.note ? <p className="mt-0.5 text-xs text-muted">{b.note}</p> : null}` using semantic `text-muted` token only.
3. In `IncomingBookings.tsx`, add the same local `formatDate` helper and apply it at line 102 — change `{booking.requested_date}` to `{formatDate(booking.requested_date)}` inside the existing truthy guard.

**Validation:** (builder self-check)
- `grep -c "formatDate" src/components/BookingForm.tsx` → ≥ 2 (definition + use)
- `grep -c "formatDate" src/components/IncomingBookings.tsx` → ≥ 2
- `grep -c "b.note" src/components/BookingForm.tsx` → ≥ 1
- `npx tsc --noEmit` → exits 0
- `grep -rnE "#[0-9a-fA-F]{3,6}" src/components/BookingForm.tsx src/components/IncomingBookings.tsx` → no matches (no raw hex)

**Context:** Read @src/components/BookingForm.tsx, @src/components/IncomingBookings.tsx, @src/components/RemindersList.tsx (canonical `formatDate`), @.planning/DESIGN.md

**Design:**
- Register: product
- Tokens used: `text-muted`, `text-positive`, `text-negative`, `bg-surface`, `font-mono`, `tabular-nums` — all existing
- Scope: component
- Anti-pattern guard: builder runs `node bin/slop-detect.mjs src/components/BookingForm.tsx src/components/IncomingBookings.tsx` pre-commit (if present); commit blocked on critical findings. No raw hex, no new font, reuse existing `formatDate` pattern rather than introducing a date library.

---

## Task 2 — Reminder surfaces: add error states to prefs save + reminder dismiss
**Wave:** 1
**Persona:** frontend
**Files:** `src/components/ReminderPrefs.tsx`, `src/components/RemindersList.tsx`
**Depends on:** none

**Why:** Two reminder mutations silently swallow failures. `ReminderPrefs.tsx:79-84` renders only the `state.ok` success branch — when `updateReminderPrefs` returns `{ok:false}` (a parse failure on `advance_days` outside 1–90, or a DB error: `reminder-prefs-actions.ts:68,71,83`) the user sees nothing happen. `RemindersList.tsx:54` destructures `const [, action, pending]`, discarding the action result entirely — when `dismissReminder` returns `{ok:false}` (`notification-actions.ts:37,54`) the dismiss appears to do nothing with no explanation. A mutation that can fail must tell the user when it does (Design Quality Rubric — States dimension).

**Acceptance Criteria:**
- When reminder-prefs save fails (e.g. advance-days out of the 1–90 range, or DB error), the prefs card shows a `text-negative` error message; on success it still shows the existing `reminderPrefsSaved` confirmation.
- When a reminder dismiss fails, the reminder row shows a `text-negative` error message instead of silently doing nothing; the Dismiss button returns to its enabled state.
- No new i18n keys: reuse `t.errSave` (defined `i18n.ts:99`, both locales) for both error messages. Key count stays 218/218.

**Action:**
1. In `ReminderPrefs.tsx`, the action state already exists as `const [state, action, pending]` (line 29) with shape `{ok:boolean}`. After the existing `state.ok` block (lines 79-84), add an `else`-style branch: `{!state.ok && state.error ? <p className="text-xs font-medium text-negative">{t.errSave}</p> : null}`. Since the current state type is `{ok:boolean}` only, widen the `useActionState` initial value to `{ ok: false, error: false }` and reference `state.error` — OR simpler: render the error whenever the form has been submitted and `!state.ok`. Use the pattern from `SettingsClient.tsx:131-138` (`state.ok ? <success> : state.error ? <error> : null`) as the canonical shape. Confirm `updateReminderPrefs` return type still satisfies `useActionState`; if widening the state shape, update the initial object only — do not change the server action signature.
2. In `RemindersList.tsx:54`, change `const [, action, pending]` to `const [state, action, pending]` and keep the initial `{ ok: false }`. After the Dismiss `<button>` (around line 95, inside the `<form>` or directly under it), add `{state && state.ok === false && pending === false ? null : null}` — concretely: render `{state.error ? <p className="mt-1 text-[11px] font-medium text-negative">{t.errSave}</p> : null}` if you widen the dismiss state to carry `error`, OR render the error using the existing `{ok:false}` shape by tracking a submitted flag. Match the inline-error pattern from `IncomingBookings.tsx:242-246` (`{state.error ? <span className="text-[11px] font-medium text-negative">…</span> : null}`).
3. Do not alter the server actions' success paths or `revalidatePath` calls. If you widen a returned state object to include `error`, update `notification-actions.ts` / `reminder-prefs-actions.ts` return statements to include `error: true` on the failure branches and `error: false`/`null` on success — keep both `el`/`en` parity untouched (these are not i18n strings).

**Validation:** (builder self-check)
- `grep -c "text-negative" src/components/ReminderPrefs.tsx` → ≥ 1
- `grep -c "text-negative" src/components/RemindersList.tsx` → ≥ 1
- `grep -c "t.errSave" src/components/ReminderPrefs.tsx src/components/RemindersList.tsx` → ≥ 2 total
- `npx tsc --noEmit` → exits 0
- `node -e "const s=require('fs').readFileSync('src/lib/i18n.ts','utf8'); console.log((s.match(/^\s{4}[a-zA-Z_]\w*\s*:/gm)||[]).length)"` → unchanged from baseline (no new keys); spot-check parity stays 218/218

**Context:** Read @src/components/ReminderPrefs.tsx, @src/components/RemindersList.tsx, @src/lib/reminder-prefs-actions.ts, @src/lib/notification-actions.ts, @src/components/SettingsClient.tsx (canonical ok/error render pattern), @src/components/IncomingBookings.tsx (inline error pattern), @.planning/DESIGN.md

**Design:**
- Register: product
- Tokens used: `text-negative`, `text-positive`, `text-muted`, `text-[11px]`, `font-medium` — all existing
- Scope: component
- Anti-pattern guard: builder runs `node bin/slop-detect.mjs src/components/ReminderPrefs.tsx src/components/RemindersList.tsx` pre-commit (if present). No new i18n keys (would break the 218/218 contract); reuse `t.errSave`. No raw hex.

---

## Task 3 — Admin review: surface failures from optimistic approve/reject
**Wave:** 1
**Persona:** frontend
**Files:** `src/components/AdminReviewList.tsx`
**Depends on:** none

**Why:** `AdminReviewList.tsx:45-66` fires the server actions as `void approveWorkshop(...)` / `void rejectWorkshop(...)` after an optimistic `removeOptimistic(id)`. The actions return `{ok:false, error:"save"|"forbidden"|"reason"}` on failure (`admin-actions.ts:24,28,39,57,61,64,76`), but the result is discarded — if approval fails, the row vanishes from the queue with no error and no recovery, so an admin believes a workshop was approved when it was not. On a verification surface this is a correctness gap, not a cosmetic one.

**Acceptance Criteria:**
- When `approveWorkshop` or `rejectWorkshop` returns `{ok:false}`, the admin sees a `text-negative` error banner at the top of the review list (reusing `t.errSave`), and the optimistic removal is not left dangling silently.
- The success path is unchanged: a successful approve/reject still removes the row and the revalidated server list reconciles on the next render.
- No new i18n keys; reuse `t.errSave`. Key count stays 218/218.

**Action:**
1. In `AdminReviewList.tsx`, add a local error state: `const [actionError, setActionError] = useState(false);`.
2. Change `onApprove` (lines 45-52): inside `startTransition`, capture the action result — `void approveWorkshop(noopState, fd).then((res) => { if (res && !res.ok) setActionError(true); });`. Because `removeOptimistic` runs inside the transition, on failure call `setActionError(true)` so the operator is told; the revalidated server list (which still contains the un-approved row) will restore it on reconciliation. Reset `setActionError(false)` at the start of `onApprove`/`onConfirmReject`.
3. Apply the same `.then` failure capture to `onConfirmReject` (lines 54-66).
4. Render an error banner near the section header (after the header div, around line 88): `{actionError ? <p role="alert" className="rounded-lg bg-negative/10 px-3 py-2 text-xs font-medium text-negative">{t.errSave}</p> : null}`. Use the same banner shape as `signup/page.tsx:94-101`.
5. Confirm `approveWorkshop`/`rejectWorkshop` are `async` returning `AdminActionState` (they are — `admin-actions.ts:22,55`) so `.then` is valid.

**Validation:** (builder self-check)
- `grep -c "setActionError" src/components/AdminReviewList.tsx` → ≥ 3 (declare + 2 set-true paths, plus resets)
- `grep -c "role=\"alert\"" src/components/AdminReviewList.tsx` → ≥ 1
- `grep -c "t.errSave" src/components/AdminReviewList.tsx` → ≥ 1
- `npx tsc --noEmit` → exits 0
- `grep -rnE "#[0-9a-fA-F]{3,6}" src/components/AdminReviewList.tsx` → no matches

**Context:** Read @src/components/AdminReviewList.tsx, @src/lib/admin-actions.ts, @src/app/signup/page.tsx (canonical alert banner), @.planning/DESIGN.md

**Design:**
- Register: product
- Tokens used: `bg-negative/10`, `text-negative`, `text-xs`, `font-medium`, `rounded-lg` — all existing
- Scope: component
- Anti-pattern guard: builder runs `node bin/slop-detect.mjs src/components/AdminReviewList.tsx` pre-commit (if present). Reuse `t.errSave`; no new key. Keep `useOptimistic` reconciliation intact — do not replace it with manual list state.

---

## Success Criteria
- [ ] Every interactive M4/M5 mutation surface renders an error state on failure: booking list/incoming (Task 1 date+note polish), reminder prefs + dismiss (Task 2), admin approve/reject (Task 3). Verified by inspection at each surface.
- [ ] `requested_date` renders as `dd/mm/yyyy` on `/book` and `/bookings`, matching `ServiceLog`/`MechanicLog`/`RemindersList`.
- [ ] EL/EN string parity holds at 218/218 (no new keys added); `Translation` type unchanged.
- [ ] `npx tsc --noEmit` exits 0; no `TODO`/`FIXME` introduced in touched files.
- [ ] No raw hex / non-semantic colors introduced in any touched component.
- [ ] No layout break at 375px or 1440px on any M2–M5 route — pre-satisfied per audit (touched components use Tailwind responsive/`max-w-*` utilities, no fixed-pixel layout widths); guarded against regression by the fixed-pixel-width contract below.

---

## Verification Contract

### Contract for Task 1 — booking date format
**Check type:** grep-match
**Command:** `grep -c "formatDate(b.requested_date)" src/components/BookingForm.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — owner booking list still renders raw ISO date

### Contract for Task 1 — incoming-bookings date format
**Check type:** grep-match
**Command:** `grep -c "formatDate(booking.requested_date)" src/components/IncomingBookings.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — workshop incoming list still renders raw ISO date

### Contract for Task 1 — booking note shown
**Check type:** grep-match
**Command:** `grep -c "b.note" src/components/BookingForm.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — submitted note never displayed back to owner

### Contract for Task 2 — reminder prefs error state
**Check type:** grep-match
**Command:** `grep -c "text-negative" src/components/ReminderPrefs.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — prefs save still has no failure feedback

### Contract for Task 2 — reminder dismiss error state
**Check type:** grep-match
**Command:** `grep -c "text-negative" src/components/RemindersList.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — dismiss failure still silent

### Contract for Task 3 — admin action error banner
**Check type:** grep-match
**Command:** `grep -c "setActionError" src/components/AdminReviewList.tsx`
**Expected:** Non-zero (≥ 3)
**Fail if:** Returns < 3 — optimistic approve/reject failures still swallowed

### Contract for Task 3 — admin alert role
**Check type:** grep-match
**Command:** `grep -c "role=\"alert\"" src/components/AdminReviewList.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — error banner not announced to assistive tech

### Contract — compile clean (all tasks)
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript error — most likely a state-shape widening that broke a server-action signature

### Contract — no new i18n keys (HAND-02 parity)
**Check type:** command-exit
**Command:** `node -e "const fs=require('fs');const lines=fs.readFileSync('src/lib/i18n.ts','utf8').split('\n');function k(a,b){const s=new Set();for(let i=a;i<b;i++){const m=lines[i].match(/^\s{4}([a-zA-Z_]\w*)\s*:/);if(m)s.add(m[1]);}return s;}const el=k(246,487),en=k(487,lines.length);console.log(el.size===en.size && el.size===218 ? 'PARITY_OK' : 'PARITY_FAIL '+el.size+'/'+en.size)"`
**Expected:** `PARITY_OK`
**Fail if:** Not `PARITY_OK` — a new key was added to only one locale, or the count drifted from 218/218

### Contract — no raw hex in touched components (all tasks)
**Check type:** command-exit
**Command:** `grep -rnE "#[0-9a-fA-F]{3,6}" src/components/BookingForm.tsx src/components/IncomingBookings.tsx src/components/ReminderPrefs.tsx src/components/RemindersList.tsx src/components/AdminReviewList.tsx | wc -l`
**Expected:** `0`
**Fail if:** Non-zero — a raw hex color was introduced, violating the semantic-token contract (DESIGN.md §2)

### Contract — reduced-motion untouched (HAND-03 regression guard)
**Check type:** grep-match
**Command:** `grep -c "prefers-reduced-motion" src/app/globals.css`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — the existing reduced-motion block was removed

### Contract — no fixed-pixel layout widths (responsive regression guard, ROADMAP criterion 2)
**Check type:** command-exit
**Command:** `grep -rnE "width:[[:space:]]*[0-9]+px" src/components/BookingForm.tsx src/components/IncomingBookings.tsx src/components/ReminderPrefs.tsx src/components/RemindersList.tsx src/components/AdminReviewList.tsx | wc -l`
**Expected:** `0`
**Fail if:** Non-zero — a fixed-pixel width was introduced that could break the layout at 375px
