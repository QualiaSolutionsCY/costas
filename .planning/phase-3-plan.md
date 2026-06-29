---
phase: 3
goal: "Final QA: the booking feature (/book owner, /bookings workshop) is reachable from the UI; production build passes; review CRITICAL/HIGH resolved."
tasks: 1
waves: 1
type: gap-closure
---

# Phase 3: Final QA

**Goal:** Every primary journey is reachable and the production build is clean. The Final-QA audit (HAND-09) found one HIGH blocker — the M4 booking feature is built and compiles but is **unreachable from the UI navigation** — and it must be resolved before handoff.

**Why this phase:** Final QA exists to catch "looks done but isn't." The audit (`.planning/` review, 2026-06-29) confirmed: production build PASSES (14 routes incl. sitemap.xml/robots.txt/opengraph-image), zero CRITICAL, security boundary clean (no service_role client-side), error states present. The single HIGH is a navigation-wiring gap.

## QA attestation (this phase's non-task evidence)
- **Production build:** `npx next build` → compiled successfully, tsc clean, 14 routes generated incl. `/sitemap.xml`, `/robots.txt`, `/opengraph-image`. (HAND-07 compile gate)
- **Security/secrets:** audit found 0 CRITICAL — no `service_role` in client/NEXT_PUBLIC, role from `app_metadata`, `/admin` gated, `.env*` gitignored, no committed key literals.
- **Cross-browser (HAND-08):** Playwright MCP is not connected in this environment; automated cross-browser QA is recorded as a **manual handoff checklist item** (Chrome/Firefox/Safari smoke of the 4 journeys on the live URL) rather than claimed. Documented in the Phase 4 handoff doc.
- **Deferred LOW findings → handoff doc (Phase 4):** middleware→proxy Next 16 deprecation (builds fine, runs as Proxy); demo-permissive `using(true)` RLS (documented, pre-real-launch); `DEMO_PASSWORD` literal + `demoSignIn` error-ignore (demo convenience paths).

---

## Task 1 — Wire the booking feature into navigation (HAND-07 reachability)
**Wave:** 1
**Persona:** frontend
**Files:** `src/lib/data.ts`, `src/components/AppShell.tsx`, `src/lib/i18n.ts`, `src/components/MechanicLog.tsx`
**Depends on:** none

**Why:** `/book` and `/bookings` build (`✓ /book`, `✓ /bookings`) but no `href`/`router.push` anywhere targets them (`src/lib/data.ts:8` navItems = log/vehicles/settings only; `MechanicLog.tsx:165,181` links only `/` and `/register`). The owner booking surface and workshop incoming-bookings surface are dead unless the URL is typed. The CTA string `bookCta` ("Κλείσε ραντεβού"/"Book a service", `i18n.ts:469,710`) exists but is unused — confirming the orphan. This resolves the one HIGH from the Final-QA audit.

**Acceptance Criteria:**
- The owner shell sidebar shows a "Booking" nav item (calendar icon) that navigates to `/book` (mirrors how `settings` routes via `router.push`).
- The workshop surface (`MechanicLog`) has a visible link to `/bookings` (incoming bookings), alongside the existing `/register` link.
- Nav label is bilingual: `nav.book` added to BOTH `el` and `en` (compile-enforced by the `Translation` type at `i18n.ts:9`); the workshop link reuses an existing booking/bookings i18n key or adds one to both locales — EL/EN parity preserved (a missing key is a compile error).
- `npx tsc --noEmit` exits 0; `npx next build` still compiles.

**Action:**
1. `src/lib/data.ts`: add `"book"` to the `NavKey` union (line 5) and a `{ key: "book", icon: "calendar" }` entry to `navItems` (after `log`, before `settings` — the calendar icon exists in `icons.tsx`). Owner-facing position.
2. `src/lib/i18n.ts`: extend the `nav` type (line 9) to `{ log; vehicles; settings; book }` and add `book:` to BOTH locale `nav` objects (`:249` el, `:490` en) — e.g. el `"Ραντεβού"`, en `"Booking"`. Keep them concise (sidebar labels). This preserves compile-enforced parity.
3. `src/components/AppShell.tsx`: in `select(key)` (line 85), add a branch routing `book` to the real route — `if (key === "book") { router.push("/book"); setOpen(false); return; }` (mirror the `settings` branch at :88-92). Do NOT make it an inline panel.
4. `src/components/MechanicLog.tsx`: add a `<Link href="/bookings">` in the header action area (near the `/register` link at :181-187), labelled with an existing incoming-bookings i18n key if one exists (search for a key whose value is the incoming-bookings title used by `IncomingBookings.tsx`), else add `bookingsNavLink` to both locales. Use the existing border-button styling pattern from the `/register` link; pick an appropriate existing icon (`calendar` or `clock`).

**Validation:** (builder self-check)
- `grep -c '"book"' src/lib/data.ts` → ≥ 1 (NavKey + navItem)
- `grep -c '"/book"' src/components/AppShell.tsx` → ≥ 1
- `grep -c '"/bookings"' src/components/MechanicLog.tsx` → ≥ 1
- `grep -c "book:" src/lib/i18n.ts` → ≥ 2 (both locale nav objects)
- `npx tsc --noEmit` → exits 0

**Design:**
- Register: product
- Tokens used: existing — `text-muted`, `text-foreground`, `bg-surface-2`, `border`, sidebar active tokens; reuse the `/register` link's class string and the Sidebar's existing item styling. No new design language.
- Scope: component
- Anti-pattern guard: run `node bin/slop-detect.mjs src/components/AppShell.tsx src/components/MechanicLog.tsx` pre-commit if present. No raw hex; reuse existing nav/link patterns and the existing `calendar` icon.

---

## Success Criteria
- [ ] `/book` reachable from the owner sidebar nav; `/bookings` reachable from the workshop surface — verified by grep of href/push targets + the nav item.
- [ ] EL/EN parity preserved (new nav label in both locales); `Translation` type compiles.
- [ ] `npx tsc --noEmit` exits 0 and `npx next build` compiles.
- [ ] No CRITICAL/HIGH remaining from the Final-QA audit (the booking-reachability HIGH is closed).

---

## Verification Contract

### Contract for Task 1 — book nav key
**Check type:** grep-match
**Command:** `grep -c '"book"' src/lib/data.ts`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — book nav item not added

### Contract for Task 1 — owner /book route wired
**Check type:** grep-match
**Command:** `grep -c '"/book"' src/components/AppShell.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — owner nav does not route to /book

### Contract for Task 1 — workshop /bookings link
**Check type:** grep-match
**Command:** `grep -c '"/bookings"' src/components/MechanicLog.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — workshop incoming-bookings still unreachable

### Contract for Task 1 — bilingual nav label
**Check type:** command-exit
**Command:** `grep -c "book:" src/lib/i18n.ts`
**Expected:** ≥ 2 (both el + en nav objects)
**Fail if:** < 2 — label missing from a locale (compile would break parity)

### Contract — compile clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript error
