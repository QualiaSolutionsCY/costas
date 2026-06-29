# DESIGN — Costas

> **Brownfield note.** This documents the design system **already shipped** in `src/app/globals.css` and the existing components, so builders extend it instead of inventing a parallel one. The system is clean and intentional; the rule is *preserve and extend*, not redesign. New surfaces must use these tokens — no raw hex in JSX.

## 1. Direction commit

- **Aesthetic direction:** `industrial` — a tidy mechanic's logbook. Functional, neutral, calm; the data is the decoration. Not playful, not luxury, not editorial.
- **Color strategy:** `Restrained` — tinted-neutral surfaces, one indigo accent, semantic positive/negative. Color carries meaning (saved = green), never mood.
- **Scene sentence:** A workshop clerk in Nicosia taps a plate into their phone between two cars on a bright forecourt, and a car owner at their kitchen table reviews two years of service history — both need it readable at a glance, in Greek.
- **Differentiation:** A single trusted vehicle history written from both sides of the counter — it reads like a well-kept notebook, not a dashboard.

## 2. Color (shipped tokens — `src/app/globals.css`)

Defined as CSS custom properties under `:root`, surfaced to Tailwind v4 via `@theme inline`. Light theme only.

| Token | Value | Role |
|---|---|---|
| `--background` | `#fbfbfc` | page ground (barely-tinted neutral) |
| `--surface` | `#ffffff` | cards, sheets, sidebar |
| `--surface-2` | `#f5f6f7` | inset fields, hover, secondary fills |
| `--foreground` | `#111114` | primary text / solid buttons |
| `--muted` | `#71757e` | secondary text, icons, placeholders |
| `--border` | `#ececef` | hairlines (applied globally via `* { border-color }`) |
| `--accent` | `#4f46e5` | indigo — links, active check, focus accent |
| `--accent-soft` | `#f1f1fe` | accent tint backgrounds |
| `--positive` | `#0f9d6e` | "saved"/certified confirmations |
| `--negative` | `#e0533d` | destructive (remove file) |

Usage: always the Tailwind token classes (`bg-surface`, `text-muted`, `text-positive`, `border`) — **never** raw hex in components. This is the strongest existing convention; the `ABS-HEX-IN-JSX` ban points here.
> When new persistence/auth surfaces are added, reuse these exactly. If a dark theme is ever requested, add a `@media (prefers-color-scheme: dark)` block redefining the `:root` vars — do not introduce new token names.

## 3. Typography

- **Display & body:** **Geist** (`next/font/google`, `--font-geist-sans`). **Geist Mono** (`--font-geist-mono`) for plates, serials, dates (`tabular-nums`).
- Weights in use: medium (500) / semibold (600) for emphasis; regular body. Sizes are utility-driven (`text-sm` base, `text-xs` for secondary, `text-[11px]` for meta).
- Greek glyphs must render correctly — Geist covers Latin; verify Greek subset renders (it does in current build). Keep `lang` attribute synced (LanguageProvider already sets `document.documentElement.lang`).

## 4. Spacing & radii

- Tailwind 8px-ish scale (`gap-2/3`, `px-3/4`, `py-2.5`). Cards: `rounded-xl`, controls: `rounded-lg`, pills/avatars: `rounded-full`/`rounded-xl`.
- Content max-widths: `max-w-2xl` (logs), `max-w-md` (register form). Mobile-first; `sm:`/`lg:` for the sidebar-vs-drawer split.

## 5. Components (existing patterns to reuse)

- **Inputs:** `rounded-lg border bg-surface-2 px-3 py-2.5 text-sm … focus:border-foreground focus:bg-surface`. Plates/serials use `uppercase tracking-wider` with `placeholder:normal-case`.
- **Primary button:** `rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-surface … disabled:opacity-40`.
- **Cards / list rows:** `rounded-xl border bg-surface p-4/5`.
- **ServiceSelect** is the canonical custom control: desktop popover / mobile bottom-sheet, full listbox a11y. Reuse it for any new option pickers rather than a native `<select>`.
- **Icons:** single `<Icon name="…" />` family (`src/components/icons.tsx`). One family only — add new glyphs there.

## 6. Depth

Mostly flat (borders, not shadows). Elevation reserved for overlays: popover `shadow-[0_16px_50px_-12px_rgba(0,0,0,0.28)]`, mobile sheet `shadow-2xl`, sticky topbar uses `bg-surface/85 backdrop-blur`. Keep depth meaningful — only floating layers cast shadows.

## 7. Motion

Defined `@keyframes` in `globals.css` / inline: `popIn` (.12s ease-out), `sheetUp` (.2s ease-out), `slideIn` (drawer, .2s ease-out). Snappy, no bounce. **Add `prefers-reduced-motion` handling** when touching animations (current gap — flag, not blocker).

## 8. Iconography

One inline-SVG family in `icons.tsx` (~25 glyphs: wrench, car, shield, pin, check, upload, chevron, …). `1.5` stroke, `currentColor`. Never import a second icon set.

## 9. Responsive

Mobile-first. Owner app: sidebar `hidden lg:block`, mobile drawer below `lg`. Mechanic/register: single-column `max-w-md/2xl`, `sm:` adjusts padding. Touch targets ≥ the current `h-9/h-11` controls.

## 10. Anti-pattern checklist (preserve on every new surface)

- [ ] No raw hex / default Tailwind palette colors in JSX — only semantic tokens.
- [ ] No hardcoded UI text — every string via `t.*` in `lib/i18n.ts`, present in BOTH `el` and `en`.
- [ ] No `Inter`/`Roboto`/`system-ui` as the primary face — Geist is loaded; system-ui is fallback only.
- [ ] Native `<select>` not introduced where `ServiceSelect` fits.
- [ ] New interactive controls keep the a11y bar (labels, `aria-*`, keyboard, focus return).
- [ ] Empty / loading / error states present on every data-backed view (current gap — DB layer must add them).
