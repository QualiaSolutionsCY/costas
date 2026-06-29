# PRODUCT — Costas

> The "who and why" every Qualia agent reads before designing or building anything.

## Register

```
register: product
```

Design SERVES the product — this is a tool people use to record and retrieve real maintenance history. The bar is **earned familiarity**: a Cypriot car owner or a workshop clerk should understand it in five seconds and trust it with a year of records.

## Users (specific, not personas)

```
1. Andreas — owns a 2019 VW Golf in Nicosia. Opens Costas after a service to jot down
   "brakes done at AutoCheck, €180" so that two years later, when he sells the car, he
   has a clean documented history. Wants it done in 10 seconds on his phone, in Greek.
2. Maria — front-desk at AutoCheck workshop, Nicosia. After a job is finished she types
   the plate (ΚΧΡ 412) and picks "Brake pads & discs" so the record lands in the
   customer's history. Does this 15× a day; speed and a clear "saved" confirmation matter.
3. Costas — runs a small certified garage in Limassol. Registers his workshop by uploading
   his MOT certification so his shop can start logging jobs. Not technical; needs the signup
   to be obvious and forgiving (drag-drop the cert, see it accepted).
```

## Brand voice

```
Voice: plain, calm, trustworthy. Bilingual-native (Greek first), never jargon-y.

Voice in motion: Confirmations are quiet and concrete — "Recorded to vehicle ΚΧΡ 412" /
"Καταχωρήθηκε στο όχημα ΚΧΡ 412", not "Success!". Errors are human and actionable —
"Add a plate before saving" / "Πρόσθεσε πινακίδα πριν αποθηκεύσεις", never a code or a red
wall. Empty states reassure rather than scold — "No services logged yet — add the first one"
/ "Καμία καταγραφή ακόμα — πρόσθεσε την πρώτη". The product sounds like a tidy logbook, not
an enterprise dashboard.
```

## Anti-references (mandatory)

```
- Enterprise fleet-management dashboards (e.g. Samsara-style) — too dense, too many panels,
  built for fleet operators not a single car owner. Costas is one car, one history.
- Generic SaaS "tech-bro" landing aesthetics (gradient hero, lorem ipsum) — Costas is a
  working tool for non-technical Cypriots, not a startup pitch.
- Government/MOT portal UIs — cold, form-heavy, intimidating. Costas should feel like a
  well-kept notebook, approachable and fast.
```

## Positive references (optional)

```
- Linear's restraint — semantic neutrals, one accent, no decoration that doesn't inform.
- Apple Wallet's "one card, full history" mental model — a single object you trust and glance at.
```

## Strategic principles

```
- Speed of glance, not depth of click. The service history is the product; it should be
  readable the moment the page loads, no interaction required.
- Greek is first-class, not a translation. EL is the default; every string ships in both
  languages or it doesn't ship. A missing translation is a build error.
- Two roles, one truth. Owner and mechanic write to the same vehicle history from different
  sides; never fork the data model to serve a screen.
- Real over impressive. Every flow in the demo actually persists. No mock data in the shipped
  artifact — that's the whole point of the demo.
```

## Constraints

```
Framework:         Next.js 16.2.9 (App Router) / React 19
Component library: custom (no UI kit) — hand-rolled accessible components, Tailwind v4 tokens
Backend:           Supabase (Auth + Postgres + Storage, RLS on every table)
Performance budget: LCP < 2.5s, INP < 200ms, CLS < 0.1
Accessibility:     WCAG 2.2 AA minimum (custom select already does listbox a11y — keep that bar)
Browsers:          evergreen, mobile-first (workshop clerks and owners are on phones)
i18n:              Greek (default) + English. No RTL. Dictionary in lib/i18n.ts is the source of truth.
```

## Differentiation (one sentence)

```
The bilingual logbook that gives a Cypriot car its own service history — written from both
sides of the counter (owner and workshop) into one trusted record.
```
