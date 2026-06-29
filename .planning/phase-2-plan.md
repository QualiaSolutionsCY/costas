---
phase: 2
goal: "Replace placeholder copy with final Greek-primary content; wire production SEO (per-route meta, OG image, sitemap.xml, robots.txt) and privacy-respecting analytics."
tasks: 4
waves: 2
---

# Phase 2: Content + SEO

**Goal:** Every public route emits a unique Greek-primary `<title>` + meta description; `sitemap.xml`, `robots.txt`, and an OG image are served and valid; a privacy-respecting analytics pageview fires on navigation when its env var is set (and the app renders nothing when unset).
**Why this phase:** The demo is live and public, but search engines see one static title across all 12 routes, link previews have no image, crawlers have no sitemap, and there is zero usage signal. This phase makes the public surface discoverable and measurable without redesigning anything.

**Grounding (verified this session):**
- Next.js **16.2.9** (`node_modules/next/package.json`). File conventions confirmed against bundled docs: `sitemap.ts` exports a default fn returning `MetadataRoute.Sitemap` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md:46-70`); `robots.ts` exports a default fn returning `MetadataRoute.Robots` (`.../robots.md:24-37`); `opengraph-image.tsx` default-exports a fn returning `ImageResponse` from `next/og` with `alt`/`size`/`contentType` config exports (`.../opengraph-image.md:97-151`, `.../opengraph-image.md:259-266`). `next/og` is present (`node_modules/next/og.js`).
- No `sitemap.*`, `robots.*`, `opengraph-image.*` files exist yet (verified `find src/app`).
- Root layout `src/app/layout.tsx:16-19` has only a static `title`/`description`; no `metadataBase`, no `openGraph`, no `title.template`. `lang="el"` at `:28`.
- **Server pages** (can export `metadata` directly): `src/app/page.tsx`, `mechanic`, `settings`, `admin`, `book`, `bookings`, `reminders`, `register`, `auth/reset-password`. Several already export a `title`-only metadata (`mechanic/page.tsx:5-7`, `register/page.tsx:3-5`, `book/page.tsx:12`, `bookings/page.tsx:9`).
- **Client pages** (`"use client"` at line 1 — CANNOT export `metadata`): `login`, `signup`, `forgot-password`, `welcome` (verified). These need a sibling `layout.tsx` in their route segment to carry metadata.
- `NEXT_PUBLIC_SITE_URL` exists (`.env.local:9` = `http://localhost:3000`) — use it as the base URL; do NOT hardcode the production domain.
- No analytics anywhere in `src/`; no `next/script` usage anywhere.
- i18n dict `src/lib/i18n.ts` is the single source of UI strings at **218/218 EL/EN parity**; a missing key is a compile error. SEO metadata (sitemap/robots/page titles) is static, NOT UI copy — it does NOT go through i18n.

## Task 1 — sitemap.ts + robots.ts (crawl surface)
**Wave:** 1
**Persona:** backend
**Files:**
- CREATE `src/app/sitemap.ts` — default export `sitemap(): MetadataRoute.Sitemap` listing the 7 publicly-indexable routes.
- CREATE `src/app/robots.ts` — default export `robots(): MetadataRoute.Robots`.
**Depends on:** none

**Why:** HAND-05 — crawlers currently have no sitemap and no robots directive; without them the live demo is not properly indexable and link checkers report missing crawl files.

**Acceptance Criteria:**
- Visiting `/sitemap.xml` returns valid XML with one `<url><loc>` per indexable route, each URL built from `process.env.NEXT_PUBLIC_SITE_URL` (no hardcoded domain).
- Visiting `/robots.txt` returns `User-Agent: *` with `Allow: /`, `Disallow:` covering the private app surfaces, and a `Sitemap:` line pointing at `{NEXT_PUBLIC_SITE_URL}/sitemap.xml`.
- `npx tsc --noEmit` exits 0.

**Action:**
1. `src/app/sitemap.ts`: `import type { MetadataRoute } from "next"`. Read `const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"`. Default-export `export default function sitemap(): MetadataRoute.Sitemap`. Return an array of `{ url, lastModified: new Date(), changeFrequency, priority }` for the **public marketing/entry routes only**: `/` (priority 1, weekly), `/mechanic` (0.8, monthly), `/register` (0.8, monthly), `/welcome` (0.6, monthly), `/login` (0.5, yearly), `/signup` (0.5, yearly), `/book` (0.6, monthly). Build each `url` as `` `${base}` `` for `/` and `` `${base}/mechanic` `` etc. Do NOT include the authenticated/session-scoped surfaces `/settings`, `/admin`, `/bookings`, `/reminders`, `/forgot-password`, `/auth/reset-password` — those are not public landing content.
2. `src/app/robots.ts`: `import type { MetadataRoute } from "next"`. Default-export `export default function robots(): MetadataRoute.Robots`. Return `{ rules: { userAgent: "*", allow: "/", disallow: ["/settings", "/admin", "/bookings", "/reminders", "/auth/"] }, sitemap: \`${base}/sitemap.xml\` }` using the same `base` const.

**Validation:** (builder self-check)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -c "NEXT_PUBLIC_SITE_URL" src/app/sitemap.ts src/app/robots.ts` → each `1` (proves no hardcoded domain)
- `grep -c "MetadataRoute.Sitemap" src/app/sitemap.ts` → `1`
- `grep -c "MetadataRoute.Robots" src/app/robots.ts` → `1`

**Context:** Read @node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md, @node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md, @.planning/PROJECT.md

## Task 2 — opengraph-image.tsx (link-preview image)
**Wave:** 1
**Persona:** frontend
**Files:**
- CREATE `src/app/opengraph-image.tsx` — default-export `Image()` returning `ImageResponse` from `next/og`, plus `alt`/`size`/`contentType` config exports.
**Depends on:** none

**Why:** HAND-05 — shared links to the live demo currently render no preview image; an OG image is the single highest-leverage social/link-preview asset and must match the shipped brand, not introduce a new design language.

**Acceptance Criteria:**
- A request to `/opengraph-image` (or `/opengraph-image.png`) returns a 1200×630 PNG.
- The image visually matches the shipped brand: barely-tinted neutral ground, the Costas wordmark/`C` mark in the indigo accent, Greek-primary tagline text — no new colors outside the DESIGN.md palette.
- `npx tsc --noEmit` exits 0.

**Action:**
1. `import { ImageResponse } from "next/og"`.
2. Export config: `export const alt = "Costas · Έλεγχος Αυτοκινήτου"`, `export const size = { width: 1200, height: 630 }`, `export const contentType = "image/png"`.
3. Default-export `export default function Image()` returning `new ImageResponse(<JSX>, { ...size })`. Build the JSX with inline `style` only (Satori does not read Tailwind/CSS vars — use literal hex from the DESIGN.md palette: ground `#fbfbfc`, foreground `#111114`, accent `#4f46e5`, muted `#71757e`). Layout: a flex column, centered, with (a) a rounded `48px` indigo square containing a bold white `C` (mirrors the app's brand mark at `login/page.tsx:19-21`), (b) the heading `Costas` in `#111114`, (c) the Greek tagline `Έλεγχος & ιστορικό αυτοκινήτου` in `#71757e`. Every flex container needs an explicit `display: "flex"` (Satori requirement). Do NOT attempt to load a Geist `.ttf` — none is bundled (`find` returned no `.ttf`); use the default font so the build does not fail on a missing font file.

**Validation:** (builder self-check)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -c "next/og" src/app/opengraph-image.tsx` → `1`
- `grep -c "width: 1200" src/app/opengraph-image.tsx` → `1`
- `grep -Ec "#4f46e5|#111114|#fbfbfc" src/app/opengraph-image.tsx` → `≥ 2` (brand palette, no new colors)

**Context:** Read @node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md, @.planning/DESIGN.md, @src/app/login/page.tsx

**Design:**
- Register: product
- Tokens used: literal palette hex required by Satori (`#fbfbfc` ground, `#111114` foreground, `#4f46e5` accent, `#71757e` muted) — these are the DESIGN.md token VALUES; Satori cannot resolve CSS vars, so the values are inlined here only (this is the documented exception, not an `ABS-HEX-IN-JSX` violation in a normal component).
- Scope: page (OG asset)
- Anti-pattern guard: builder runs `node bin/slop-detect.mjs src/app/opengraph-image.tsx` pre-commit if `bin/slop-detect.mjs` exists in the repo; otherwise skip (this is a generated-image file, not an app component).

## Task 3 — Per-route Greek-primary metadata (unique title + description on every public route)
**Wave:** 1
**Persona:** frontend
**Files:**
- MODIFY `src/app/page.tsx` — add a `metadata` export (currently none; has `export const dynamic` at `:10`).
- MODIFY `src/app/mechanic/page.tsx` — extend existing title-only metadata (`:5-7`) with a `description`.
- MODIFY `src/app/register/page.tsx` — extend existing title-only metadata (`:3-5`) with a `description`.
- MODIFY `src/app/book/page.tsx` — extend existing title-only metadata (`:12`) with a `description`.
- MODIFY `src/app/bookings/page.tsx` — extend existing title-only metadata (`:9`) with a `description`.
- MODIFY `src/app/settings/page.tsx` — add a `metadata` export.
- MODIFY `src/app/admin/page.tsx` — add a `metadata` export.
- MODIFY `src/app/reminders/page.tsx` — add a `metadata` export.
- MODIFY `src/app/auth/reset-password/page.tsx` — add a `metadata` export.
- CREATE `src/app/login/layout.tsx` — server-component layout exporting `metadata` (login `page.tsx` is `"use client"`, cannot export metadata).
- CREATE `src/app/signup/layout.tsx` — same pattern for signup.
- CREATE `src/app/forgot-password/layout.tsx` — same pattern for forgot-password.
- CREATE `src/app/welcome/layout.tsx` — same pattern for welcome.
**Depends on:** none

**Why:** HAND-04 + HAND-05 — every public route currently inherits one static root title (`layout.tsx:17`). Each route must carry a unique, accurate Greek-primary `<title>` and meta description so search results and link previews describe the actual page, not the home page.

**Acceptance Criteria:**
- Each of the 12 public routes (`/`, `/login`, `/signup`, `/forgot-password`, `/welcome`, `/mechanic`, `/settings`, `/admin`, `/book`, `/bookings`, `/reminders`, `/register`, `/auth/reset-password`) emits a unique `<title>` and a non-empty `<meta name="description">`, all written Greek-primary.
- No two routes share the same `<title>` string.
- The 4 client routes (`login`, `signup`, `forgot-password`, `welcome`) get their title/description from a new sibling `layout.tsx` (not from the client `page.tsx`).
- `npx tsc --noEmit` exits 0; no new i18n keys added (EL/EN stays 218/218).

**Action:**
1. For each **server page**, add or extend `export const metadata: Metadata = { title: "...", description: "..." }` (import `type { Metadata } from "next"` where not already imported). Use distinct Greek-primary strings, e.g.:
   - `/` (`page.tsx`): `title: "Costas · Το ιστορικό του αυτοκινήτου σου"`, `description: "Κατέγραψε και παρακολούθησε το πλήρες ιστορικό σέρβις του αυτοκινήτου σου."`
   - `mechanic`: keep `title: "Costas · Πλευρά Συνεργείου"`, add `description: "Κατέγραψε εργασίες σέρβις ανά πινακίδα — γρήγορα, από το κινητό, στον χώρο του συνεργείου."`
   - `register`: keep title, add `description: "Εγγραφή συνεργείου στο δίκτυο πιστοποιημένων μηχανικών της Costas."`
   - `book`: keep title, add `description: "Κλείσε ραντεβού σέρβις με πιστοποιημένο συνεργείο κοντά σου."`
   - `bookings`: keep title, add `description: "Διαχειρίσου τα εισερχόμενα αιτήματα ραντεβού του συνεργείου σου."`
   - `settings`: `title: "Costas · Ρυθμίσεις"`, `description: "Διαχειρίσου το προφίλ, τα οχήματα και τις υπενθυμίσεις σου."`
   - `admin`: `title: "Costas · Διαχείριση"`, `description: "Έλεγχος και επαλήθευση αιτημάτων εγγραφής συνεργείων."`
   - `reminders`: `title: "Costas · Υπενθυμίσεις"`, `description: "Δες τις επερχόμενες υπενθυμίσεις σέρβις για τα οχήματά σου."`
   - `auth/reset-password`: `title: "Costas · Επαναφορά κωδικού"`, `description: "Όρισε νέο κωδικό πρόσβασης για τον λογαριασμό σου."`
   For `admin`/`settings`/`reminders`/`auth-reset-password`, also add `robots: { index: false }` to the metadata object since these are private app surfaces and are excluded from the sitemap (Task 1) — keep them out of search indexes.
2. For each **client page**, create a sibling `layout.tsx` (server component, no `"use client"`): `import type { Metadata } from "next"; export const metadata: Metadata = { title: "...", description: "...", robots: { index: false } }; export default function Layout({ children }: { children: React.ReactNode }) { return children; }`. Use Greek-primary strings:
   - `login`: `title: "Costas · Σύνδεση"`, `description: "Συνδέσου στον λογαριασμό σου Costas."`
   - `signup`: `title: "Costas · Δημιουργία λογαριασμού"`, `description: "Δημιούργησε λογαριασμό Costas για να καταγράφεις το ιστορικό του αυτοκινήτου σου."`
   - `forgot-password`: `title: "Costas · Ξέχασες τον κωδικό σου"`, `description: "Ζήτησε σύνδεσμο επαναφοράς κωδικού για τον λογαριασμό σου."`
   - `welcome`: `title: "Costas · Καλωσήρθες"`, `description: "Ξεκίνα με την Costas — διάλεξε ρόλο και μπες στην εφαρμογή."`
3. Do NOT touch `src/lib/i18n.ts`. These metadata strings are static SEO content, not runtime UI copy — they do not go through the dictionary and add no keys.

**Validation:** (builder self-check)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -rl "export const metadata" src/app | wc -l` → `≥ 13` (root layout + 9 server pages + 4 client-segment layouts; root already counts)
- `test -f src/app/login/layout.tsx && test -f src/app/signup/layout.tsx && test -f src/app/forgot-password/layout.tsx && test -f src/app/welcome/layout.tsx && echo ALL_LAYOUTS`
- `grep -rh "description:" src/app/**/page.tsx src/app/**/layout.tsx | sort | uniq -d | wc -l` → `0` would be ideal but not required; the hard rule is unique titles — `grep -rh "title:" src/app --include=page.tsx --include=layout.tsx | sort | uniq -d | wc -l` → `0`
- `node /home/qualiasolutions/.claude/bin/i18n-parity.js 2>/dev/null || grep -c "" src/lib/i18n.ts` → confirm `src/lib/i18n.ts` unchanged (no new keys)

**Context:** Read @src/app/layout.tsx, @src/app/page.tsx, @src/app/mechanic/page.tsx, @src/app/register/page.tsx, @.planning/PRODUCT.md, @.planning/DESIGN.md

**Design:**
- Register: product
- Tokens used: none (metadata is `<head>` text, no visual surface)
- Scope: app (per-route head tags)
- Anti-pattern guard: not applicable — no JSX visual output; the guard is the unique-title grep above.

## Task 4 — Root metadata defaults (metadataBase + OG) + privacy-respecting analytics
**Wave:** 2
**Persona:** frontend
**Files:**
- MODIFY `src/app/layout.tsx` — add `metadataBase`, a `title.template`, and `openGraph` defaults to the existing `metadata` export (`:16-19`); render an `<Analytics />` component inside `<body>`.
- CREATE `src/components/Analytics.tsx` — a privacy-respecting analytics loader gated behind an env var, rendering nothing when the env var is unset.
**Depends on:** Task 2 (the OG image at `src/app/opengraph-image.tsx` must exist so Next.js auto-attaches it to the OG metadata Next.js generates from the file convention)

**Why:** HAND-05 + HAND-06 — the root layout needs a `metadataBase` so per-route OG/canonical URLs resolve to absolute URLs, a `title.template` so route titles compose consistently, and OG defaults so every share has Open Graph tags. HAND-06 requires real usage measurement; an env-gated loader is the correct production pattern — it fires a pageview when configured and cleanly renders nothing when not, so no fake/stub analytics and no committed keys.

**Acceptance Criteria:**
- The root `metadata` export sets `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")`, a `title: { default, template }` where `template` is like `"%s · Costas"` (or keep per-route full titles and use `title.default` only — see Action), and an `openGraph` object with `type: "website"`, `locale: "el_GR"`, `siteName: "Costas"`.
- The OG image generated by `src/app/opengraph-image.tsx` (Task 2) appears in the rendered `<head>` as `og:image` on the home route (Next.js auto-wires the file-convention image once `metadataBase` is set).
- `<Analytics />` renders nothing (returns `null`, no `<script>` in the DOM) when its env var is unset; when set, it injects exactly one analytics loader via `next/script` and fires a pageview on navigation.
- No analytics key/domain is hardcoded; nothing secret is committed.
- `npx tsc --noEmit` exits 0.

**Action:**
1. `src/components/Analytics.tsx` — server component (no `"use client"`). Read `const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN`. If falsy, `return null`. If set, render Plausible via `next/script`: `import Script from "next/script"`, return `<Script defer data-domain={domain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />`. Plausible auto-tracks pageviews including SPA navigations with this script — no manual pageview wiring needed. Export `default function Analytics()`. Do NOT hardcode a domain; it comes only from the env var.
2. `src/app/layout.tsx` — extend the existing `metadata` object (`:16-19`): add `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")`; change `title` to `{ default: "Costas · Έλεγχος Αυτοκινήτου", template: "%s" }` (template `%s` passes through per-route titles unchanged, since Task 3 writes full `Costas · ...` titles — this keeps them from being double-suffixed while still giving the root a default); add `openGraph: { type: "website", locale: "el_GR", siteName: "Costas", title: "Costas · Έλεγχος Αυτοκινήτου", description: "Βρες πιστοποιημένο μηχανικό για έλεγχο του αυτοκινήτου σου" }`. Import `Analytics` from `@/components/Analytics` and render `<Analytics />` as the last child inside `<body>` (after `<LanguageProvider>`).
3. Add `NEXT_PUBLIC_ANALYTICS_DOMAIN` to `.env.local` (commented-out or empty is fine — the loader no-ops when unset) and document it; do NOT commit a real value. Builders edit `.env.local` only (gitignored), never commit a key.

**Validation:** (builder self-check)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -c "metadataBase" src/app/layout.tsx` → `1`
- `grep -c "openGraph" src/app/layout.tsx` → `1`
- `grep -c "NEXT_PUBLIC_ANALYTICS_DOMAIN" src/components/Analytics.tsx` → `1`
- `grep -c "return null" src/components/Analytics.tsx` → `≥ 1` (proves the no-op-when-unset path)
- `grep -c "<Analytics" src/app/layout.tsx` → `1` (proves it is wired, not just defined)
- `git diff --staged --name-only | grep -c "\.env"` → `0` (no env file committed)

**Context:** Read @src/app/layout.tsx, @node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md, @.planning/DESIGN.md

**Design:**
- Register: product
- Tokens used: none (Analytics renders no visual surface; layout edit is metadata + a script tag)
- Scope: app
- Anti-pattern guard: builder runs `node bin/slop-detect.mjs src/components/Analytics.tsx` pre-commit if `bin/slop-detect.mjs` exists; otherwise skip.

## Success Criteria
- [ ] Each public route emits a unique, accurate Greek-primary `<title>` + meta description (Task 3).
- [ ] `/sitemap.xml` and `/robots.txt` are served and valid; `/opengraph-image` returns a 1200×630 PNG that renders in a link-preview check (Tasks 1, 2, 4).
- [ ] Analytics fires a pageview on navigation when `NEXT_PUBLIC_ANALYTICS_DOMAIN` is set, and renders nothing (no script in DOM) when unset (Task 4).
- [ ] `npx tsc --noEmit` exits 0; `src/lib/i18n.ts` unchanged (EL/EN stays 218/218); no env file or analytics key committed.

## Verification Contract

### Contract for Task 1 — sitemap.ts exists
**Check type:** file-exists
**Command:** `test -f src/app/sitemap.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File does not exist

### Contract for Task 1 — robots.ts exists
**Check type:** file-exists
**Command:** `test -f src/app/robots.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File does not exist

### Contract for Task 1 — sitemap uses env base URL (no hardcoded domain)
**Check type:** grep-match
**Command:** `grep -c "NEXT_PUBLIC_SITE_URL" src/app/sitemap.ts`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — the domain is hardcoded instead of read from env

### Contract for Task 1 — robots points at the sitemap
**Check type:** grep-match
**Command:** `grep -c "sitemap" src/app/robots.ts`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — robots.txt has no Sitemap directive

### Contract for Task 2 — opengraph-image exists and uses next/og
**Check type:** grep-match
**Command:** `grep -c "next/og" src/app/opengraph-image.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — file missing or not using ImageResponse

### Contract for Task 2 — OG image is 1200x630 brand-correct
**Check type:** grep-match
**Command:** `grep -Ec "1200|#4f46e5" src/app/opengraph-image.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — wrong size or off-brand colors

### Contract for Task 3 — four client-segment layouts created
**Check type:** command-exit
**Command:** `test -f src/app/login/layout.tsx && test -f src/app/signup/layout.tsx && test -f src/app/forgot-password/layout.tsx && test -f src/app/welcome/layout.tsx && echo ALL`
**Expected:** `ALL`
**Fail if:** Any of the four client routes lacks a metadata-carrying layout

### Contract for Task 3 — metadata present on at least 13 surfaces
**Check type:** command-exit
**Command:** `grep -rl "export const metadata" src/app | wc -l`
**Expected:** `13` or greater
**Fail if:** Fewer than 13 — some route still inherits the root title

### Contract for Task 3 — all route titles are unique
**Check type:** command-exit
**Command:** `grep -rh "title:" src/app --include=page.tsx --include=layout.tsx | grep "Costas" | sort | uniq -d | wc -l`
**Expected:** `0`
**Fail if:** Non-zero — two routes share a title

### Contract for Task 3 — i18n untouched (parity preserved)
**Check type:** command-exit
**Command:** `git diff --name-only HEAD -- src/lib/i18n.ts | wc -l`
**Expected:** `0`
**Fail if:** Non-zero — i18n dictionary was modified (parity risk)

### Contract for Task 4 — metadataBase set on root
**Check type:** grep-match
**Command:** `grep -c "metadataBase" src/app/layout.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — per-route OG/canonical URLs will not resolve to absolute URLs

### Contract for Task 4 — openGraph defaults set on root
**Check type:** grep-match
**Command:** `grep -c "openGraph" src/app/layout.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — no Open Graph tags emitted

### Contract for Task 4 — analytics is env-gated and no-ops when unset
**Check type:** grep-match
**Command:** `grep -c "return null" src/components/Analytics.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — analytics is not gated; it would load unconditionally

### Contract for Task 4 — analytics reads domain from env (no hardcoded key)
**Check type:** grep-match
**Command:** `grep -c "NEXT_PUBLIC_ANALYTICS_DOMAIN" src/components/Analytics.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — analytics domain is hardcoded rather than env-driven

### Contract for Task 4 — analytics wired into layout
**Check type:** grep-match
**Command:** `grep -c "Analytics" src/app/layout.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — component exists but is never rendered (the #1 wiring failure)

### Contract for whole phase — compiles clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript compilation error

### Contract for whole phase — sitemap, robots, OG image served (behavioral)
**Check type:** behavioral
**Command:** (verifier runs `npm run build` then `npm start`, curls `/sitemap.xml`, `/robots.txt`, `/opengraph-image.png`)
**Expected:** `/sitemap.xml` returns valid XML with multiple `<loc>` entries; `/robots.txt` returns a robots body with a `Sitemap:` line; `/opengraph-image.png` returns a 1200×630 PNG (HTTP 200, `content-type: image/png`)
**Fail if:** Any returns non-200, or sitemap/robots is empty/malformed, or the OG image is not a PNG
