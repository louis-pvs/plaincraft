# ARCH-ideas-subissues

Lane: C
Purpose: Add support for Sub-Issues section in idea files with automatic child issue creation and linking.
Parent: #26 (ARCH-source-of-truth)

## Problem

Large architectural work needs to be broken down into smaller focused tasks, but there's no automated way to define and create sub-issues from an idea file. Engineers must manually create child issues and link them to parents, which is error-prone and time-consuming.

## Proposal

1. Define Sub-Issues section format in idea files:

   ```markdown
   ## Sub-Issues

   1. **ARCH-ideas-issue-sync** - Description of sub-issue
   2. **ARCH-ideas-pr-integration** - Description of sub-issue
   ```

2. Update `parseIdeaFile()` to extract Sub-Issues section:
   - Parse numbered list items with bold prefixes
   - Extract sub-issue tag/title and description
   - Return array of sub-issue metadata

3. Update `scripts/ideas-to-issues.mjs` to:
   - Detect Sub-Issues section in parent idea file
   - Create parent Issue first
   - Check if sub-issue idea files exist in `/ideas`
   - Create child Issues from sub-issue idea files if they exist
   - Add "Parent: #N" to child Issue bodies
   - Add task list to parent Issue body linking all children

4. Add `linkChildIssues()` function:
   - Updates parent Issue body with task list: `- [ ] #N Child issue title`
   - Uses `gh issue edit` to update parent Issue

## Acceptance Checklist

- [ ] Idea files support `## Sub-Issues` section with numbered list format.
- [ ] `parseIdeaFile()` extracts sub-issue metadata (tag, description).
- [ ] `ideas-to-issues.mjs` detects and processes Sub-Issues section.
- [ ] Child Issues created from corresponding idea files in `/ideas`.
- [ ] Child Issue bodies include "Parent: #N" reference.
- [ ] Parent Issue body updated with task list of all child Issues.
- [ ] Script handles missing sub-issue idea files gracefully (skip or warn).
- [ ] Dry-run mode shows parent and all child Issues that would be created.
