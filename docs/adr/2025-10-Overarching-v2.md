# ADR 2025-10 Overarching Governance v2

## Status

Accepted — 2025-10-31

## Context

- Developer-facing guides in `/guides` had grown past governance limits and duplicated runnable steps that belong in templates.
- Lane C needs thin, executable README contracts so automation can validate scaffold, test, and rollback flows.
- Lane B stewards narrative “view/read” content that should live in Storybook docs and Playbook patterns instead of README prose.

## Decision

1. Archive legacy `/guides` content under `guides/_archive/2025/11-guides-sunset/` and replace `guides/README.md` with a stub that points to template documentation and Lane B narratives.
2. Require every governed unit folder (`snippets/`, `scripts/`, future `components/` and `flows/`) to ship a README with the template-first headings, a `scaffold_ref`, and a single owner.
3. Add guardrail scripts (`readme-lint.mjs`, `template-coverage.mjs`, `view-dedupe.mjs`) plus workflow wiring to enforce template completeness, README coverage, and narrative deduplication.
4. Host long-form explanations in Storybook (`storybook/docs/*`) and Playbook (`playbook/patterns/*`), and link to them from the README “Links” section.

## Consequences

- Developers land on runnable READMEs that stay under 400 words and trace back to versioned templates.
- Storybook and Playbook now carry governance narratives (`Governance/Script Automation`, `Governance/Release Changelog`, `Governance/Ideas Pipeline`, `Governance/Roadmap Onboarding`) with matching Playbook patterns.
- CI guardrails (`pnpm docs:lint`, `pnpm docs:views`) replace the retired guide ratio checks and fail fast on missing READMEs or duplicated step blocks.
- Owners and scaffold references are tracked in every README so Lane C can audit coverage and Lane B knows who to pair with when narratives drift.
