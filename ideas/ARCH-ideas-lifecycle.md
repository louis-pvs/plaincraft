# ARCH-ideas-lifecycle

Lane: C
Purpose: Implement automatic idea file cleanup when Issues close, with archive support and audit trail.
Issue: #33
Parent: #26 (ARCH-source-of-truth)

## Problem

After Issues are closed and PRs merged, idea files remain in `/ideas` indefinitely, creating clutter and making it unclear which ideas are active vs. completed. Engineers must manually delete or move files, which is often forgotten.

## Proposal

1. Create GitHub Actions workflow `.github/workflows/idea-lifecycle.yml`:
   - Trigger on: `issues` event with action `closed`
   - Check if closed Issue has corresponding idea file in `/ideas`
   - Archive or delete the idea file based on configuration

2. Add archival strategy:
   - Option 1: Move to `/ideas/_archive/<year>/` directory with timestamp
   - Option 2: Delete file and rely on git history
   - Make configurable via workflow input or config file

3. Create audit trail:
   - Commit message: "chore: archive idea for closed issue #N [skip ci]"
   - Include issue number, title, and closure reason in commit
   - Tag commit with `idea-closed` label for filtering

4. Add safety checks:
   - Only process ideas for merged PRs (not closed without merge)
   - Require Issue to have been open for at least 24 hours (prevent accidental deletions)
   - Skip if Issue has "keep-idea" label

5. Add manual script `scripts/cleanup-ideas.mjs`:
   - Allow engineers to manually trigger cleanup
   - Show preview of what would be archived/deleted
   - Support `--dry-run` mode

## Acceptance Checklist

- [ ] `.github/workflows/idea-lifecycle.yml` workflow created.
- [ ] Workflow triggers when Issues are closed.
- [ ] Idea files moved to `/ideas/_archive/<year>/` or deleted based on config.
- [ ] Commit message includes audit trail (issue number, title, reason).
- [ ] Safety checks prevent accidental deletion (merged PRs, time threshold, labels).
- [ ] `scripts/cleanup-ideas.mjs` script supports manual cleanup with dry-run.
- [ ] Documentation explains lifecycle automation and manual override options.
- [ ] Tested with closed issues that have and don't have idea files.
