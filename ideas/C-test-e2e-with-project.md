---
id: C-test-e2e-with-project
title: C-test-e2e-with-project
owner: "@lane-d"
lane: C
type: Composition
priority: P3
status: Ticketed
version: 1.0.0
created: 2025-11-02
last_verified: 2025-11-02
ttl_days: 60
acceptance:
	must_have:
		- Project item visible with lifecycle fields
		- Branch created and status advanced to Branched
		- PR created and status advanced to PR Open
		- Merge updates status to Merged and changelog extracted
	wont_have:
		- Automated status transitions beyond scope of test
	evidence: []
work_items:
	issue: "#147"
	branch: "feat/C-144-test-e2e-project"
	pr: TBD
	project_item: TBD
---

# C-test-e2e-with-project

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Partners:** Lane D for workflow policy validation

## Metric Hypothesis

Improve E2E workflow automation from 40% to 95% by validating project board integration with all lifecycle scripts.

## Units In Scope

- `scripts/ops/ideas-to-issues.mjs` — creates GitHub issues with project board integration
- `scripts/ops/create-branch.mjs` — creates branch and updates project status
- `scripts/ops/open-or-update-pr.mjs` — creates PR with auto-generated body and updates project status
- GitHub Project board with lifecycle fields (Status, ID, Type, Lane, Owner, Priority)

## Purpose

Test the complete E2E workflow with the new GitHub Project board to verify all automation works correctly with real project tracking.

## Problem

We need to validate that:

- Project item creation works during idea-intake
- Project status updates work during branch creation (Ticketed → Branched)
- Project status updates work during PR creation (Branched → PR Open)
- Project status updates work after merge (PR Open → Merged)

## Proposal

Create a minimal test ticket and run through the complete workflow:

1. Run `ops:idea-intake` to create issue and add to project
2. Run `ops:create-branch` to create branch and update status
3. Make a trivial change
4. Run `ops:open-or-update-pr` to create PR and update status
5. Merge PR and verify changelog extraction
6. Run `ops:consolidate-changelog` to update CHANGELOG.md

## Acceptance Checklist

- [ ] Issue created and added to project with "Todo" status
- [ ] Branch created and project status updated to "In Progress"
- [ ] PR created and project status remains "In Progress" (or "Done" if that's the workflow)
- [ ] PR merged and changelog extracted automatically
- [ ] CHANGELOG.md updated successfully
- [ ] Project item visible in project board throughout workflow

## Work Item Links (Manual - Lane D)

| Artifact     | Reference                   | Status   |
| ------------ | --------------------------- | -------- |
| Issue        | #147                        | Ticketed |
| Branch       | feat/C-144-test-e2e-project | Branched |
| PR           | (pending)                   | PR Open  |
| Project Item | (manual check needed)       | Ticketed |

Advance one state at a time. After each manual update:

1. Edit this frontmatter `status`.
2. Update Project board single-select field.
3. Fill the reference link in this table.
4. Re-verify (`last_verified`) if a major workflow step completes.
