# Workflows Guide

Workflows knit multiple templates together — ideas, issues, worktrees, changelogs, and release notes. Treat this folder as the control tower for cross-cutting delivery guidance.

Historical walkthroughs live in `guides/_archive/**`; ignore them when shipping new work. If a procedure points there, bounce back to the owning template README, Storybook doc, or Playbook pattern instead.

## Available Templates

- `/templates/ideas/` — Idea files that feed backlog automation.
- `/templates/issue-unit/` and `/templates/issue-composition/` — GitHub issue scaffolds for execution lanes.
- `/templates/pull-request/` — PR body checklist that mirrors CI expectations.
- `/templates/changelog/` — Release note source used by `guide-changelog.md`.

## How to Use

1. Choose the correct lane:
   - Lane A/B (`U-`): unit scope
   - Lane C (`C-`): composition or integration work
   - Lane D (`ARCH-`/`PB-`): architecture or playbook updates
2. Generate idea + issue artifacts with the idea templates and `node scripts/ideas-to-issues.mjs`.
3. Spawn an isolated worktree (command updates the source idea with the issue number and flips status to `in-progress`):
   ```bash
   pnpm gh:worktree <issue-number> --no-draft
   ```
4. Execute the relevant guide steps (see below) to keep changelog entries and release assets synchronized.
5. Close the loop with `pnpm guardrails` (hard requirement across all lanes) and `pnpm guides:check` before requesting review. Guardrails failures block promotion until they are resolved locally.

## Related Guides

- [`guide-workflow.md`](../guide-workflow.md) — Ground truth for idea → issue → PR delivery.
- [`guide-roadmap-setup.md`](../guide-roadmap-setup.md) — Sets up the roadmap project with automation hooks.
- [`guide-changelog.md`](../guide-changelog.md) — Enforces release note standards and batching.
- [`guide-scripts.md`](../guide-scripts.md) — Lists the enforcement scripts each workflow step relies on.

## Rollback

- Archive any stale idea/issue pairs via `node scripts/archive-ideas.mjs`.
- Remove worktrees with `git worktree remove <path>` and delete the branch.
- Re-run `pnpm guides:ttl --yes` to ensure orphaned guides drop into `_archive/`.

Workflows only stay healthy if each step remains executable. If a command becomes manual, fix the script or template before updating any guide.
