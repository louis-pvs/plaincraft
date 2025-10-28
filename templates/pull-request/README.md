# Pull Request Template

**Version:** v0.1.0  
**Category:** Process/Workflow  
**Purpose:** Standard PR description template with context, changes, and verification checklist.

## Overview

Use this template when creating pull requests to provide:

- Clear context and motivation
- Summary of changes made
- Verification checklist for reviewers
- Links to related issues and documentation

## Template Contents

- `pull-request.md` - PR body with context, changes, testing, and checklist sections

## When to Use

**Use this template for:**

- All feature branches being merged to main/develop
- Bug fixes with code changes
- Refactoring PRs
- Documentation updates with context

**Skip template for:**

- Automated dependency updates (use dependabot template)
- Emergency hotfixes (minimal template)
- Draft PRs in early stages

## Quick Start

```bash
# Copy template for manual PR creation
cp templates/pull-request/pull-request.md .github/pull_request_template.md

# Or use via script (auto-generates PR body)
node scripts/generate-pr-content.mjs --issue 123
```

## Related

- Guide: `guides/guide-workflow.md`
- Script: `scripts/generate-pr-content.mjs`, `scripts/create-worktree-pr.mjs`
- Template: `templates/issue-unit/`, `templates/issue-composition/`
