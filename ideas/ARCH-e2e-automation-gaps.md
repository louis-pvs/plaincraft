# ARCH-e2e-automation-gaps

Lane: C (DevOps & Automation)

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Partners:** Lane D for workflow policy validation, Lane B for documentation updates

## Purpose

Fix critical automation gaps discovered during E2E workflow validation to achieve true end-to-end automation from idea creation through deployment without manual intervention.

## Problem

The E2E workflow validation revealed that only 40% of the workflow is truly automated. Several critical gaps require manual intervention:

1. **Project GraphQL Query Broken**: All project status updates fail with GraphQL union selection error, blocking project board tracking throughout the entire workflow
2. **PR Body Not Auto-populated**: The `ops:open-or-update-pr` script creates PRs with minimal body, requiring manual addition of changelog section
3. **PR-Changelog Workflow Not Triggering**: The `pr-changelog.yml` workflow doesn't trigger automatically after PR merge, requiring manual extraction
4. **Double-Execution Bug**: The `consolidate-changelog` script runs both dry-run AND actual execution, causing confusion
5. **Merge and Ready Status Manual**: No automation for marking PR ready or auto-merging on approval

These gaps mean developers must manually intervene at 6+ points in the workflow, defeating the purpose of scripts-first automation.

## Proposal

### Phase 1: Quick Wins (2 hours)

1. **Fix Double-Execute Bug** (15 mins)
   - Add explicit `return` after `succeed()` in dry-run path of `consolidate-changelog.mjs`
   - Test with `--dry-run` flag to ensure single execution

2. **Debug Workflow Trigger** (30 mins)
   - Verify `pr-changelog.yml` is committed and enabled
   - Check workflow permissions and trigger conditions
   - Test with a dummy PR merge

3. **Basic PR Body Auto-population** (1 hour)
   - Extract Purpose, Problem, and Proposal sections from idea file
   - Generate proper `## Changes` section from idea proposal
   - Add `Closes #N` with issue number

### Phase 2: Enhanced PR Body (2-3 hours)

4. **Enhanced PR Body Generation** (2 hours)
   - Parse all idea file sections reliably
   - Handle different idea types (ARCH, C, B, PB, U)
   - Include acceptance checklist in PR body
   - Add proper markdown formatting

5. **Testing and Refinement** (1 hour)
   - Test with multiple idea file formats
   - Verify changelog extraction still works
   - Document new PR body format

### Phase 3: Project Board Integration (4-6 hours) - OPTIONAL

6. **Fix GraphQL Union Query** (3-4 hours)
   - Restructure fieldValues query to handle unions properly
   - Move `field { id name }` inside each union case
   - Update all affected functions: `loadProjectCache`, `findProjectItemByFieldValue`, `ensureProjectStatus`
   - Test with actual GitHub Projects V2 API

7. **Full Integration Testing** (1-2 hours)
   - Run complete E2E test with project updates
   - Verify status transitions work
   - Document any remaining limitations

## Acceptance Checklist

### Phase 1 (Quick Wins)

- [ ] Double-execute bug fixed in `consolidate-changelog.mjs`
- [ ] `pr-changelog.yml` workflow triggers automatically on PR merge
- [ ] Changelog extraction creates `_tmp/` summary file without manual intervention
- [ ] PR body includes basic sections: Overview, Changes, Related

### Phase 2 (Enhanced)

- [ ] PR body auto-populated from idea file Purpose, Problem, Proposal
- [ ] PR body includes `## Changes` section properly formatted
- [ ] PR body includes acceptance checklist from idea file
- [ ] Tested with multiple idea types (ARCH, C, B, PB, U)
- [ ] Documentation updated with new PR body format

### Phase 3 (Optional - Project Board)

- [ ] GraphQL union selection error resolved
- [ ] Project status updates work throughout workflow
- [ ] Status transitions: Ticketed → Branched → PR Open → Merged
- [ ] All project-related functions tested and working

### General

- [ ] All existing tests still pass
- [ ] New tests added for PR body generation
- [ ] E2E workflow success rate improved from 40% to 80%+ (without Phase 3) or 95%+ (with Phase 3)
- [ ] Documentation updated with automation improvements
