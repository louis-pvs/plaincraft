# Issue (Unit) Template

**Version:** v0.1.0  
**Category:** Process/Workflow  
**Purpose:** Single-purpose issue template for bugs, small features, or focused tasks.

## Overview

Use this template when creating GitHub issues for:

- Bug fixes with clear reproduction steps
- Small features that affect a single component
- Documentation updates
- Refactoring tasks with well-defined scope

## Template Contents

- `issue-unit.md` - GitHub issue body with problem, solution, and acceptance criteria sections

## When to Use

**Use this template when:**

- The issue has a single, clear deliverable
- No sub-tasks or parallel work required
- Scope is well-defined and bounded
- Estimated effort is < 4 hours

**Use Issue (Composition) template instead when:**

- Multiple components or files affected
- Parallel sub-tasks required
- Coordination across team members needed
- Estimated effort is > 4 hours

## Quick Start

```bash
# Copy template to new issue
cp templates/issue-unit/issue-unit.md .github/ISSUE_TEMPLATE/bug_report.md

# Or use via script (updates the idea file with the issue number and marks it in-progress)
node scripts/create-worktree-pr.mjs --template issue-unit
```

## Related

- Guide: `guides/guide-workflow.md`
- Script: `scripts/create-worktree-pr.mjs`
- Template: `templates/issue-composition/` (for multi-part issues)
