# plaincraft

One-file UX snippets for React + TypeScript. Each snippet ships with a demo, tests, and the scaffolds you need to keep ramp-up under ten minutes.

## Quick Start

```bash
pnpm i
pnpm dev
```

- GitHub: `Use this template` on the repo page then `pnpm i && pnpm dev`
- CLI: `gh repo create <name> --template louis-pvs/plaincraft --public`
- Degit: `pnpm dlx degit louis-pvs/plaincraft <name>`

## Workflow & Docs

- GitHub Pages (canonical hub): [https://louis-pvs.github.io/plaincraft/](https://louis-pvs.github.io/plaincraft/)
- Storybook (component stories): [https://louis-pvs.github.io/plaincraft/storybook/](https://louis-pvs.github.io/plaincraft/storybook/)
- Playbook patterns: [https://louis-pvs.github.io/plaincraft/playbook/](https://louis-pvs.github.io/plaincraft/playbook/)
- Repo sources:
  - Policy: [/docs/policy/](/docs/policy/)
  - Templates: [/templates/](/templates/)

## Documentation Index

- GitHub Pages portal: [https://louis-pvs.github.io/plaincraft/](https://louis-pvs.github.io/plaincraft/)
- Storybook (component stories): [https://louis-pvs.github.io/plaincraft/storybook/](https://louis-pvs.github.io/plaincraft/storybook/)
- Playbook patterns: [https://louis-pvs.github.io/plaincraft/playbook/](https://louis-pvs.github.io/plaincraft/playbook/)
- Policy documentation (repo): [/docs/policy/](/docs/policy/)
- Archived guides (historical reference only): [/guides/\_archive/](guides/_archive/)

### Archived & Deprecated Directories

- `guides/_archive/**` - Legacy guides (historical reference only)
- `scripts/DEPRECATED/**` - Deprecated scripts
- **`_archive/ideas-2025-11-03-deprecated/`** - Ideas workflow (deprecated Nov 2025)

These folders exist for historical reference only. Active documentation lives on GitHub Pages, Playbook, or in `/templates/` and `/docs/policy/`.

> **Note on Ideas Workflow:** The `/ideas/` folder and related automation were deprecated on 2025-11-03. See ADR: `docs/adr/2025-11-03-ideas-workflow-deprecation.md` for details.

## Template-First Toolkit

- `/templates/script/` — Script template with full CLI contract and guardrails
- `/templates/snippet-inline-edit-label/` — Component snippet scaffold

> **Deprecated:** `/templates/ideas/` was removed on 2025-11-03. Historical reference available in `/_archive/ideas-2025-11-03-deprecated/`

See individual template READMEs for usage instructions.

## Working With Snippets

```bash
pnpm new:snippet <PascalCaseName>
pnpm dev
```

- Snippets live in `snippets/<Name>/<Name>.tsx` and expose both the component and `Demo`.
- Architecture follows controller + view seams with invariants enforced up front. Extended rationale now lives on [GitHub Pages](https://louis-pvs.github.io/plaincraft/).

## 10 Minute Runnable Contract

- Fresh clone to running demo in ≤10 minutes
- Keyboard + screen reader paths documented
- No external UI dependencies
- TypeScript `--strict` + CI must remain green

## Storybook

- Serve locally: `pnpm storybook`
- Build static bundle: `pnpm build:storybook`
- Install Playwright browsers once: `pnpm exec playwright install --with-deps`
- Headless interaction + docs checks: `TARGET_URL=http://127.0.0.1:6006 pnpm storybook:test`

Each scaffolded snippet ships with:

- `README.md` (use cases, props, a11y, acceptance checklist)
- `*.stories.tsx` (Basic, Interaction, Edge cases)
- `*.mdx` that imports the README via `?raw` for Storybook docs

## Quality Gates

- Clean clone:
  - `pnpm i && pnpm storybook` succeeds
  - `pnpm storybook:test` (stories + docs) passes against the static build
  - `pnpm new:snippet <Name>` generates working stories/docs without edits
- GitHub Actions:
  - `app-checks` runs format, typecheck, lint, unit tests, and build
  - `storybook-tests` caches browsers, builds Storybook, and exercises the Storybook test runner

## Phase 1: CI/PR/Issue Workflow Adoption (Nov 2025)

We are in Phase 1 (foundations) of ADR `2025-11-03-ci-pr-issue-workflow.md`.

Expectations for all new issues & PRs:

1. Issues: Include a brief "Why this matters" rationale and concrete "Acceptance Criteria" list. Select exactly one priority checkbox (P1/P2/P3).
2. Pull Requests: Use the template; populate "Why" and "Summary" and link an issue in either the PR body or first commit (`Closes #<num>`).
3. Acceptance Alignment: Ensure the PR description references any acceptance criteria satisfied or still pending.
4. Review Friction: Aim to avoid structural review comments (missing link, missing rationale) by following templates.

Tracking & Metrics: Lane D samples weekly adoption (see runbook). Targets: Issue Link Usage ≥80%, Structural Completeness ≥70%, Template Usage ≥90%, Priority Declaration ≥85%, Reviewer Friction ≤10%.

Resources:

- ADR: `/docs/adr/2025-11-03-ci-pr-issue-workflow.md`
- Adoption Runbook: `/docs/runbooks/adoption-ci-pr-issue-workflow-phase-1.md`

Phase 2 (light automation) will only begin after stable metrics for two consecutive weeks or averaged thresholds (see runbook exit criteria).

## License

MIT © 2024 Louis Phang
