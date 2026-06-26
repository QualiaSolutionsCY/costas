# Architecture

**App:** Costas — a bilingual (Greek/English) car **service-log** demo for the Cyprus market. Two perspectives on the same domain: the **car owner** keeps a history of where/when their car was serviced; the **mechanic/workshop** records jobs against vehicle plates and registers their shop.

## Entry points & routes (Next.js App Router, `src/app/`)

| Route | File | Renders | Audience |
|---|---|---|---|
| `/` | `app/page.tsx` | `AppShell` → `ServiceLog` | Car owner — service history + log a service |
| `/mechanic` | `app/mechanic/page.tsx` | `MechanicLog` | Workshop — record a job against a plate |
| `/register` | `app/register/page.tsx` | `RegisterForm` | Workshop — sign up + upload certificate |

`app/layout.tsx` is the root: loads Geist fonts, imports `globals.css`, sets `<html lang="el">`, and wraps **all** routes in `LanguageProvider`.

## Module boundaries

```
app/            route wiring only (server components; just compose a shell + a feature)
  layout.tsx    fonts + LanguageProvider + metadata
  page.tsx · mechanic/page.tsx · register/page.tsx
components/      all UI + feature logic (mostly "use client")
  AppShell      owner-side chrome: desktop sidebar + mobile drawer + Topbar; nav state
  Sidebar · Topbar      navigation chrome, consume useLang()
  ServiceLog            owner feature — local-state list of service entries
  MechanicLog          mechanic feature — local-state list of plate/work entries
  RegisterForm         workshop signup — file upload w/ drag-drop + preview, success screen
  ServiceSelect        custom listbox (popover on desktop, bottom-sheet on mobile)
  LanguageProvider     React context: lang + setLang + t (translation object)
  LanguageToggle       ΕΛ/EN switch
  icons.tsx            single <Icon name=…> switch over inline SVGs (~25 names)
lib/
  i18n.ts       the dictionary: Translation type + el/en strings + ALL seed/sample data
  data.ts       static domain constants (the demo car, the demo workshop, nav items, types)
```

## Data flow

- **No backend, no database, no network.** Every "save" is React `useState` in the feature component; refresh resets to seed data. `RegisterForm.submit` is explicitly `// frontend-only`.
- **Seed/sample data lives inside the i18n dictionary** (`translations[lang].seedLog`, `.mechanicSeed`, `.serviceOptions`) so the demo content is localized along with the UI strings.
- **Language is the one piece of cross-cutting state**: `LanguageProvider` holds `lang`, persists to `localStorage("lang")`, and exposes `t = translations[lang]`. Every client component reads it via `useLang()`. Default `el`, hydration-safe (reads localStorage in `useEffect`, not on first render).
- Owner-side state (open drawer, active nav, list of added entries) is local to `AppShell` / `ServiceLog`. The `vehicles` and `settings` nav items render a "Coming soon" placeholder — not implemented.

## Shape

Clean layered shape for its size: **routes = wiring**, **components = logic**, **lib = pure data/types**. Domain types (`lib/data.ts`, `lib/i18n.ts`) import nothing from components — the dependency arrow points the right way. The notable inversion-of-convenience is that **sample DATA lives in i18n.ts** (a strings file), not in `data.ts` — done so demo content localizes, but it means `data.ts` holds the static singletons while `i18n.ts` holds the dynamic lists.
