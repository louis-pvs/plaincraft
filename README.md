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

- Canonical: [/docs/workflows/idea-lifecycle.md](/docs/workflows/idea-lifecycle.md)
- Enforcement: [/docs/policy/workflow-enforcement.md](/docs/policy/workflow-enforcement.md)
- Project schema: [/docs/reference/project-schema.md](/docs/reference/project-schema.md)
- Runbooks:
  - Lane A: [/docs/runbooks/lane-A.md](/docs/runbooks/lane-A.md)
  - Lane B: [/docs/runbooks/lane-B.md](/docs/runbooks/lane-B.md)
  - Lane C: [/docs/runbooks/lane-C.md](/docs/runbooks/lane-C.md)
  - Lane D: [/docs/runbooks/lane-D.md](/docs/runbooks/lane-D.md)
  - Observer: [/docs/runbooks/observer.md](/docs/runbooks/observer.md)
- ADR: [/docs/adr/2025-10-idea-lifecycle.md](/docs/adr/2025-10-idea-lifecycle.md)

## Documentation Index

- `guides/README.md` — How the guide system works, rules, and active inventory (≤12 live guides).
- `guides/components/README.md` — Component-focused playbooks that point to snippet templates.
- `guides/workflows/README.md` — End-to-end delivery flows, worktree automation, and CI touchpoints.
- `guides/templates/README.md` — Catalog of scaffolds, schema references, and usage docs.
- `guides/_archive/` — Auto-managed graveyard for anything past TTL or lacking an owner. Treat entries here as historical only; do not revive or follow them for active work.

### Archived & Deprecated Directories

- `guides/_archive/**`
- `scripts/DEPRECATED/**`

These folders exist purely for historical reference. Leave them untouched unless a ticket explicitly calls for pruning; all active guidance lives in the non-archived guides and templates listed above.

Guides are thin overlays. They always defer to scaffolds living in `/templates/**`, scripts under `/scripts/**`, or snippet READMEs.

## Template-First Toolkit

- `/templates/guide/guide-template.md` — Frontmatter-complete starting point for any new guide.
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
- Architecture follows controller + view seams with invariants enforced up front. Extended rationale lives in `guides/DEVELOPMENT.md`.

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
