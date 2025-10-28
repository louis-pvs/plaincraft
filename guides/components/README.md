# Components Guide

This folder orients you around snippet-level assets. Every component workflow starts by scaffolding code from the single-file snippet template, then layering on tests, Storybook docs, and accessibility checks.

## Available Templates

- `snippets/_template/` — Canonical snippet scaffold. Copy via `pnpm new:snippet <Name>`.
- `templates/test-unit/` — Vitest contract for snippet-level controllers and views.
- `templates/test-integration/` — Playwright-driven interaction tests for Storybook stories.

## How to Use

1. Scaffold the snippet shell:
   ```bash
   pnpm new:snippet <PascalCaseName>
   ```
2. Review generated files inside `snippets/<Name>/` and keep the acceptance checklist intact.
3. Wire the demo into `demo/src/App.tsx` so Storybook and the demo app stay aligned.
4. Add unit and interaction tests using the respective templates above.
5. Run `pnpm test` and `pnpm storybook:test` before opening a PR.

## Related Guides

- [`guide-workflow.md`](../guide-workflow.md) — Full idea → issue → worktree flow for snippet delivery.
- [`guide-scripts.md`](../guide-scripts.md) — Automation guardrails for snapshotting, linting, and test execution.

Components stay lightweight when the template drives structure. If you find yourself documenting behavior manually, update the snippet template or the associated README instead.
