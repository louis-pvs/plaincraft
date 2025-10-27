# ARCH-subissue-pipeline-repair

Lane: C
Purpose: Fix the five broken links in the sub-issue pipeline so idea cards, Issues, PRs, and merges stay in sync.

## Problem

The sub-issue workflow has **5 critical broken links** that prevent proper synchronization:

1. **Duplicate Sub-Issues sections** - Parent issues get multiple Sub-Issues sections appended instead of replaced
2. **Missing parent context in sub-issue PRs** - Child PRs don't show they're part of a larger parent issue
3. **Stale parent PRs** - After merging a sub-issue, parent PR content doesn't update automatically
4. **Manual checklist updates** - Parent issue checklists require manual updates when sub-issues close
5. **Orphaned idea files** - 7 closed issues have idea files still in `/ideas` (should be in `_archive/`)

These breaks mean idea cards, Issues, PRs, and git state drift out of sync, violating the source-of-truth principle.

## Proposal

Break the repair work into focused sub-issues, each addressing one broken link:

1. **Prevent duplicate Sub-Issues sections in parent issues**
   - Modify `scripts/ideas-to-issues.mjs` to check for existing `## Sub-Issues` section
   - Replace instead of append to maintain single source
   - Preserve formatting compatible with `sync-issue-to-card.mjs`

2. **Add parent context to sub-issue PRs**
   - Enhance `scripts/generate-pr-content.mjs` to detect `Parent: #N` metadata
   - Include "Part of #ParentIssue ParentTitle" reference at top of PR body
   - Pull acceptance criteria and context from idea file
   - Link to parent issue in PR footer

3. **Auto-update parent PRs after sub-issue merges**
   - Extend `scripts/merge-subissue-to-parent.mjs` with new `updateParentPR()` function
   - After git merge, fetch latest parent issue Sub-Issues checklist
   - Update parent PR body with progress section showing checked/unchecked sub-issues
   - Use `gh pr edit` to push updated body

4. **Auto-update parent issue checklists when sub-issues close**
   - Create `scripts/update-parent-issue-checklist.mjs`
   - Read `Parent: #N` from sub-issue idea file
   - Update parent issue body to mark sub-issue complete: `- [x] #M`
   - Integrate into `merge-subissue-to-parent.mjs` OR GitHub Actions workflow

5. **Retroactive archival of closed issue idea files**
   - Create one-time script `scripts/archive-closed-ideas.mjs`
   - Scan `/ideas` for files with `Issue: #N` metadata
   - Check if issue is CLOSED via `gh issue view`
   - Move closed idea files to `/ideas/_archive/<year>/`
   - Future closures handled by existing `.github/workflows/idea-lifecycle.yml`

6. **Update documentation to reflect fixes**
   - Document new automation capabilities in `IDEAS-GUIDE.md`
   - Update `SCRIPTS-REFERENCE.md` with new script behaviors
   - Add troubleshooting section for sub-issue workflows
   - Update `IDEAS-COMPLIANCE.md` checklist

## Sub-Issues

This work is broken down into the following focused tasks:

1. **ARCH-subissue-fix-duplicate-sections** - Prevent duplicate Sub-Issues sections in parent issues
2. **ARCH-subissue-fix-pr-context** - Add parent context to sub-issue PRs
3. **ARCH-subissue-fix-parent-pr-update** - Auto-update parent PRs after sub-issue merges
4. **ARCH-subissue-fix-checklist-sync** - Auto-update parent issue checklists on sub-issue close
5. **ARCH-subissue-fix-retroactive-archive** - One-time cleanup: archive 7 orphaned idea files
6. **ARCH-ideas-validator-fix** - Fix validator script to support ARCH/PB/brief file types

## Acceptance Checklist

- [ ] Fix #1: `ideas-to-issues.mjs` replaces (not appends) Sub-Issues section; tested with re-runs showing single section
- [ ] Fix #2: Sub-issue PRs show "Part of #ParentIssue" banner and include parent context from idea file
- [ ] Fix #3: Parent PRs auto-update with "Sub-Issues Progress" section after each sub-issue merge
- [ ] Fix #4: Parent issue checklists auto-update to `- [x] #M` when sub-issues close
- [ ] Fix #5: One-time script archives 7 orphaned idea files to `/ideas/_archive/2025/`
- [ ] Future issue closures continue to archive automatically via existing workflow
- [ ] Documentation updated: `IDEAS-GUIDE.md`, `SCRIPTS-REFERENCE.md`, `IDEAS-COMPLIANCE.md`
- [ ] Integration test demonstrates full sub-issue lifecycle end-to-end without manual intervention
