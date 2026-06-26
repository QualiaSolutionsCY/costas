# Conventions

Sampled all 16 source files. Patterns are consistent across the codebase.

## Naming
- **Components:** PascalCase named exports, one component per file, file named after the component (`ServiceLog.tsx` → `export function ServiceLog`). No default exports for components.
- **Routes:** default-export functions per App Router requirement (`export default function Home`), PascalCase + `Page` suffix for sub-routes (`MechanicPage`, `RegisterPage`).
- **lib:** lowercase file names (`data.ts`, `i18n.ts`); `camelCase` consts, `PascalCase` types.
- **Helpers:** local `camelCase` functions co-located at top of the file that uses them (`todayISO`, `formatDate`, `fileSize`) — deliberately duplicated in `ServiceLog` and `MechanicLog` rather than extracted (locality over DRY; they're ~3 lines).

## Component patterns
- `"use client"` directive on every interactive component (all of `components/` except `icons.tsx` is effectively client; route files in `app/` are server components that just compose).
- State is **local `useState`**; no reducer, no external store. Cross-cutting state (language) goes through **one React context** (`LanguageProvider` + `useLang()` hook that throws if used outside the provider — the standard guard pattern).
- Props typed **inline** (`{ active, onSelect }: { active: NavKey; onSelect: (k: NavKey) => void }`) for small components; a named `type Props = {…}` only when the list grows (`ServiceSelect`).
- Icons: never import SVG files — call `<Icon name="wrench" />`, a single switch in `icons.tsx`.

## Styling
- **Tailwind utility classes inline**, no CSS modules, no styled-components. Conditional classes via template literals (`` `… ${active ? "…" : "…"}` ``), not `clsx`/`cn`.
- Always use the **semantic token classes** (`bg-surface`, `text-muted`, `border`, `text-foreground`, `text-positive`) — never raw hex or default Tailwind palette colors. This is the strongest convention in the repo.
- Mobile-first responsive prefixes (`sm:`, `lg:`), `hidden`/`lg:block` for drawer-vs-sidebar. One-off `@keyframes` live in `globals.css` or inline `<style>` (AppShell slideIn).

## i18n
- **No hardcoded UI text in components.** Every visible string comes from `t.*` (the `Translation` object). Adding a string = add the key to the `Translation` type + both `el` and `en` entries in `i18n.ts`. The type makes a missing translation a compile error.
- Greek is the **primary** language: default `lang = "el"`, code comments are written in Greek, metadata is Greek.

## Accessibility
- Genuine a11y effort: `aria-label`, `aria-haspopup`/`aria-expanded`/`role="listbox"`/`role="option"`/`aria-selected` on the custom select, `aria-pressed` on the toggle, Escape-to-close + focus return in `ServiceSelect`, click-outside dismissal.

## Comments
- Sparse, in **Greek**, section-marker style (`{/* Όχημα */}`, `{/* Φόρμα καταγραφής */}`). Explain "what section" not "how"; the `// frontend-only` note on `RegisterForm.submit` flags intentional no-op.

## Commit format
- Only one real commit so far: `Initial commit from Create Next App`. No established convention; the project's Qualia default (`type: subject`) applies going forward.
