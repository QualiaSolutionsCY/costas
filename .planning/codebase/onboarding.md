# Onboarding adapter

## Issue tracker
- No git remote set (`git remote -v` empty); `gh repo view` finds no GitHub repo.
- No GitLab CI, no `.scratch/`, no `ISSUES.md`.
- none; Qualia uses `.planning/decisions/` + `tracking.json` only.

## Existing labels
- n/a — no GitHub/GitLab remote.

## Domain docs
- No `CONTEXT.md`, `GLOSSARY.md`, `docs/glossary.md`, or `docs/domain.md`.
- none; Qualia creates `.planning/CONTEXT.md`. (Domain terms to seed: service log, plate, workshop/συνεργείο, MOT/ΜΟΤ, certificate, el/en.)

## Existing agent files
- `CLAUDE.md` — present; one line: `@AGENTS.md`.
- `AGENTS.md` — present; warns "This is NOT the Next.js you know" (16.x has breaking changes vs. training data) — read `node_modules/next/dist/docs/` before framework work.
- Qualia APPENDs substrate under a `## Qualia substrate` heading; never overwrites these.
