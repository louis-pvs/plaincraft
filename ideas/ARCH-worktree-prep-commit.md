# ARCH-worktree-prep-commit

Lane: C
Purpose: Ensure `pnpm gh:worktree` always has at least one commit available before attempting PR creation by staging/updating a designated file.
Issue: #27

## Problem

## Proposal

2. Auto-stage this file in the new worktree so there is guaranteed diff/commit fodder.
3. Provide an opt-out flag for cases where teams don’t want the bootstrap commit.
4. Update docs (`SCRIPTS-REFERENCE.md`, `CI-STRATEGY.md`) to explain the bootstrap commit behavior and clean-up expectations.

## Acceptance Checklist

- [ ] File path configurable via env/flag, defaulting to `.worktree-bootstrap.md` in repo root.
- [ ] Opt-out flag (`--no-bootstrap`) documented and honored.
- [ ] CI/Docs updated with instructions for cleaning up or amending the bootstrap commit.
- [ ] Tests or dry-run output prove PR creation succeeds on a pristine branch.
