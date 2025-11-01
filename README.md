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
- Storybook governance views: [https://louis-pvs.github.io/plaincraft/storybook/](https://louis-pvs.github.io/plaincraft/storybook/)
- Playbook patterns: [https://louis-pvs.github.io/plaincraft/playbook/](https://louis-pvs.github.io/plaincraft/playbook/)
- Repo sources:
  - Workflow: [/docs/workflows/idea-lifecycle.md](/docs/workflows/idea-lifecycle.md)
  - Enforcement: [/docs/policy/workflow-enforcement.md](/docs/policy/workflow-enforcement.md)
  - Project schema: [/docs/reference/project-schema.md](/docs/reference/project-schema.md)
  - Runbooks: [/docs/runbooks/](/docs/runbooks/)
  - ADR: [/docs/adr/2025-10-idea-lifecycle.md](/docs/adr/2025-10-idea-lifecycle.md)

## Documentation Index

- GitHub Pages portal: [https://louis-pvs.github.io/plaincraft/](https://louis-pvs.github.io/plaincraft/)
- Storybook governance docs: [https://louis-pvs.github.io/plaincraft/storybook/](https://louis-pvs.github.io/plaincraft/storybook/)
- Playbook patterns: [https://louis-pvs.github.io/plaincraft/playbook/](https://louis-pvs.github.io/plaincraft/playbook/)
- Runbooks & policies (repo): [/docs/](/docs/)
- Archived guides (historical reference only): [/guides/\_archive/](guides/_archive/)

### Archived & Deprecated Directories

- `guides/_archive/**`
- `scripts/DEPRECATED/**`

These folders exist purely for historical reference. Active guidance now lives on GitHub Pages, Storybook, Playbook, or the templates and runbooks referenced above.

## Template-First Toolkit

- `/templates/guide/guide-template.md` — Legacy scaffold retained for historical reference (do not use for new docs).
- `/templates/issue-unit/` — Backlog-ready unit issue scaffold with CLI helpers.
- `/templates/issue-composition/` — Cross-cutting composition issue scaffold.
- `/templates/pull-request/` — Standardized PR body with acceptance checklist slots.
- `/templates/ideas/USAGE.md` — Machine-importable source of truth used by idea automation.

Run `pnpm guides:lint`, `pnpm guides:ttl`, or `pnpm guides:check` before submitting documentation PRs to confirm frontmatter, TTL, command executability, and dedupe budgets.

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

## License

MIT © 2024 Louis Phang
