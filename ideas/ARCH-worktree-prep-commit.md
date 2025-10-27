# ARCH-worktree-prep-commit

Lane: C
Purpose: Ensure `pnpm gh:worktree` always has at least one commit available before attempting PR creation by staging/updating a designated file.

## Problem

The worktree helper stops when no commits exist on the new branch. Engineers must remember to edit a file manually before running the script, otherwise PR creation fails and the workflow halts.

## Proposal

1. Introduce a configurable “scratch” file (e.g., `.worktree-bootstrap.md`) that the script updates with metadata (timestamp + issue ref) prior to running `post-checkout`.
2. Auto-stage this file in the new worktree so there is guaranteed diff/commit fodder.
3. Provide an opt-out flag for cases where teams don’t want the bootstrap commit.
4. Update docs (`SCRIPTS-REFERENCE.md`, `CI-STRATEGY.md`) to explain the bootstrap commit behavior and clean-up expectations.

## Acceptance Checklist

- [ ] `scripts/create-worktree-pr.mjs` updates/stages the bootstrap file when the branch has zero commits.
- [ ] File path configurable via env/flag, defaulting to `.worktree-bootstrap.md` in repo root.
- [ ] Opt-out flag (`--no-bootstrap`) documented and honored.
- [ ] CI/Docs updated with instructions for cleaning up or amending the bootstrap commit.
- [ ] Tests or dry-run output prove PR creation succeeds on a pristine branch.
