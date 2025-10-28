# ARCH-worktree-prep-commit

Lane: C (DevOps & Automation)
Issue: #27

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, worktree

## Purpose

Guarantee that `pnpm gh:worktree` produces a branch with at least one staged change so subsequent commit and PR creation flows succeed without manual priming.

## Problem

The worktree helper currently hands developers an empty branch. When they immediately try to commit or invoke PR automation, Git reports “nothing to commit” and downstream scripts bail:

- New contributors hit confusing PR failures on pristine branches.
- Automation that expects a bootstrap commit (lint, changelog, CI) cannot run.
- Teams invent ad-hoc files to stage, creating inconsistent cleanup steps.

## Proposal

1. Create (or touch) a configurable bootstrap file—default `.worktree-bootstrap.md`—inside the new worktree when the command runs.
2. Automatically stage the bootstrap file so `git status` shows a ready diff and the first commit can land without extra steps.
3. Provide a `--no-bootstrap` flag (and document it) for workflows that explicitly do not want the staged file.
4. Update `SCRIPTS-REFERENCE.md` and `CI-STRATEGY.md` to explain the bootstrap behavior and how to adjust or remove the seeded file.

## Acceptance Checklist

- [ ] File path configurable via env/flag, defaulting to `.worktree-bootstrap.md` in repo root.
- [ ] Opt-out flag (`--no-bootstrap`) documented and honored.
- [ ] CI/Docs updated with instructions for cleaning up or amending the bootstrap commit.
- [ ] Tests or dry-run output prove PR creation succeeds on a pristine branch.
