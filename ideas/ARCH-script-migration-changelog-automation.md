# ARCH-script-migration-changelog-automation

Lane: C (DevOps & Automation)  
Created: 2025-10-28

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, scripts

## Purpose

Document and shepherd the guardrails-aligned changelog and template automation through the standard workflow.

Capture the guardrails migration work for changelog tooling and template catalog automation so it flows through the standard idea → issue → PR pipeline with documented scope.

## Problem

The scripts alignment initiative delivered new changelog tooling (`scripts/_lib/changelog.mjs`, `scripts/ops/consolidate-changelog.mjs`) and catalog automation (`scripts/ops/generate-template-catalog.mjs`, `templates/INDEX.md`). Those changes landed in the working branch without an idea ticket, issue, or PR tracked through the standard automation. Because the commit guardrails require ticket-tagged messages, we now block on creating the proper idea → issue → PR lifecycle record for this work.

## Proposal

1. Capture the scope of the newly added changelog utilities and template catalog generator in this idea card so downstream automation has canonical metadata.
2. Use `pnpm ideas:sync` / `pnpm ideas:create` (or `scripts/ops/ideas-to-issues.mjs`) to open the corresponding GitHub issue with the `[ARCH-script-migration]` tag.
3. Spin up a dedicated work branch and PR via `scripts/ops/create-worktree-pr.mjs`, referencing both the new issue and this changelog automation scope.
4. Ensure the new scripts pass guardrail smoke tests (`pnpm scripts:smoke`) and document usage updates in `docs/scripts-reference.md` and the migration status doc.
5. Land the PR with compliant commit messages once the issue reflects the checklist below.

## Acceptance Checklist

- [ ] Idea card synced to GitHub issue with lane `C` and label `automation`
- [ ] PR branch created via `scripts/ops/create-worktree-pr.mjs` referencing the issue
- [ ] `_lib/changelog.mjs` and `ops/consolidate-changelog.mjs` covered by smoke test run (`pnpm scripts:smoke`)
- [ ] Template catalog automation (`scripts/ops/generate-template-catalog.mjs`, `templates/INDEX.md`) documented in `docs/scripts-reference.md`
- [ ] `docs/scripts-migration-status.md` reflects the consolidated changelog migration progress
- [ ] Release notes drafted in `CHANGELOG.md` for the automation bundle once merged
- [ ] All commits on the PR prefixed with `[ARCH-script-migration]`

## Notes

- Current branch: `feat/scripts-alignment`
- Recent files: `scripts/_lib/changelog.mjs`, `scripts/ops/consolidate-changelog.mjs`, `scripts/ops/generate-template-catalog.mjs`, `templates/INDEX.md`
- Follow-up: extend consolidator to source directly from idea files (tracked in roadmap docs)
