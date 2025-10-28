# Issue (Composition) Template

**Version:** v0.1.0  
**Category:** Process/Workflow  
**Purpose:** Multi-component issue template for complex features with sub-tasks.

## Overview

Use this template when creating GitHub issues for:

- Features spanning multiple components
- Refactoring projects affecting multiple files
- Coordinated work requiring parallel sub-tasks
- Issues with dependencies between tasks

## Template Contents

- `issue-composition.md` - GitHub issue body with overview, sub-tasks checklist, and coordination notes

## When to Use

**Use this template when:**

- Multiple components or files need changes
- Work can be parallelized across sub-tasks
- Team coordination required
- Estimated effort is > 4 hours or spans multiple sessions

**Use Issue (Unit) template instead when:**

- Single component affected
- No sub-tasks needed
- Clear, bounded scope
- Estimated effort < 4 hours

## Quick Start

```bash
# Copy template to new issue
cp templates/issue-composition/issue-composition.md my-feature.md

# Or use via script with sub-issue creation
node scripts/create-worktree-pr.mjs \
  --template issue-composition \
  --create-subissues
```

## Related

- Guide: `guides/guide-workflow.md`
- Script: `scripts/merge-subissue-to-parent.mjs`
- Template: `templates/issue-unit/` (for sub-tasks)
