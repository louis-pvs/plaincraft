# ARCH-ideas-pr-integration

Lane: C
Purpose: Update PR generator and worktree script to source content from idea files instead of duplicating text.
Issue: #30
Parent: #26 (ARCH-source-of-truth)

## Problem

`scripts/generate-pr-content.mjs` and `scripts/create-worktree-pr.mjs` generate PR titles and bodies from CHANGELOG.md or hardcoded templates. This creates redundancy and drift - the idea file, Issue, PR body, and changelog all contain similar information that must be manually synchronized.

## Proposal

1. Update `create-worktree-pr.mjs` to:
   - Locate the idea file corresponding to the Issue being worked on (via tag/title matching)
   - Extract Problem, Proposal, and Acceptance sections from the idea file
   - Generate PR body using idea file content instead of generic TODO template
   - Include "Closes #N" and link to source idea file

2. Update `generate-pr-content.mjs` to:
   - Read idea file metadata when generating PR updates
   - Use idea file content as source for PR title/body updates
   - Fall back to CHANGELOG.md if idea file not found (backward compatibility)

3. Add helper function `findIdeaFileForIssue(issueNumber)` that:
   - Queries Issue via `gh issue view` to get title/tag
   - Searches `/ideas` directory for matching file
   - Returns file path or null if not found

## Acceptance Checklist

- [ ] `create-worktree-pr.mjs` includes `findIdeaFileForIssue()` helper function.
- [ ] PR body generated from idea file includes Purpose, Problem, Proposal, and Acceptance checklist.
- [ ] PR body includes "Source: `/ideas/*.md`" reference.
- [ ] `generate-pr-content.mjs` attempts to read idea file before falling back to CHANGELOG.
- [ ] Backward compatibility maintained when idea file doesn't exist.
- [ ] Dry-run mode shows PR body preview sourced from idea file.
- [ ] Script tested with worktree creation for issues with and without idea files.
