# ARCH-gh-worktree-bootstrap-sync

Lane: C (DevOps & Automation)
Issue: 100

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, worktree, lifecycle

## Purpose

Teach `pnpm gh:worktree` to bootstrap branches from the real idea file instead
of a dummy template so automation keeps the source of truth aligned while Lane C
sets up worktrees.

## Problem

The current helper creates a `.worktree-bootstrap.md` stub, leaving the actual
idea file unchanged. Result:

- Ideas stay in `Issue: pending` limbo even after the GitHub issue exists.
- Status frontmatter never advances to `in-progress`, breaking reconciliation.
- Reviewers can’t see the canonical acceptance list in the first commit.

We need the bootstrap command to edit the real idea card so the lifecycle stays
in sync from the first commit.

## Proposal

1. Resolve the idea path from the issue ID (e.g., `ideas/ARCH-123…md`).
2. When bootstrapping:
   - If the idea lacks `Issue: #…`, insert it; if it has `Issue: pending`, swap
     in the actual number.
   - Ensure frontmatter includes `status: in-progress`, adding or updating as
     needed.
3. Stage and commit the edited idea file as the initial worktree commit using
   the existing message format: `[ID] Bootstrap worktree for issue #NN [skip ci]`.
4. Push the branch and continue the existing PR prep flow.
5. If the idea file is missing, retain the current fallback behavior using
   `.worktree-bootstrap.md`.
6. Add unit tests covering metadata edits to avoid clobbering unusual
   frontmatter layouts.

## Acceptance Checklist

- [ ] Worktree bootstrap resolves the correct idea file from the issue ID and
      updates/inserts the `Issue: #` line.
- [ ] Idea frontmatter reflects `status: in-progress` after bootstrap.
- [ ] Bootstrap commit includes the updated idea file with message
      `[ID] Bootstrap worktree for issue #NN [skip ci]`.
- [ ] Fallback path preserves current behavior when the idea file is missing.
- [ ] Unit tests cover metadata replacement (pending → numbered, missing status,
      unusual spacing) and run via `pnpm scripts:test`.
