# Ideas Templates - Usage Guide

## Purpose

Canonical templates for creating idea files that populate GitHub Issues and drive development workflow.

## Templates

### 1. Unit Template (`idea-unit-template.md`)

**When to use:**

- Creating a single UI component, hook, or utility
- Self-contained functionality with clear boundaries
- Reusable building block

**Naming:** `U-<slug>.md` (e.g., `U-inline-edit-label.md`)

**Required sections:**

- Lane (A/B/C/D)
- Contracts - API surface and props
- Props + Shape - Data structure
- Behaviors - Interaction patterns
- Acceptance Checklist

### 2. Composition Template (`idea-composition-template.md`)

**When to use:**

- Combining multiple Units into a feature
- Cross-component workflows
- User-facing functionality with metrics

**Naming:** `C-<slug>.md` (e.g., `C-profile-form-composed.md`)

**Required sections:**

- Lane (A/B/C/D)
- Metric Hypothesis - Success criteria
- Units In Scope - Which units compose this
- Acceptance Checklist

### 3. Brief Template (`idea-brief-template.md`)

**When to use:**

- Architecture decisions
- Process improvements
- Non-code initiatives

**Naming:** `ARCH-<slug>.md`, `PB-<slug>.md`, `B-<slug>.md`

**Required sections:**

- Purpose - Why this exists
- Problem - What needs solving
- Proposal - How to solve it
- Acceptance Checklist

## Quick Start

```bash
# 1. Copy template
cp templates/ideas/idea-unit-template.md ideas/U-your-slug.md

# 2. Edit the file (fill in all sections)

# 3. Validate structure
pnpm run ideas:validate

# 4. Create GitHub Issue
node scripts/ideas-to-issues.mjs U-your-slug.md

# 5. Create worktree and PR
node scripts/create-worktree-pr.mjs <issue-number>
```

## Validation Rules

All idea files must:

- Follow naming convention (prefix-slug.md)
- Include all required sections for their type
- Specify a Lane (A/B/C/D)
- Have a non-empty Acceptance Checklist
- Pass `ideas:validate` script

## Sub-Issues

For multi-step work, define sub-issues:

```markdown
## Sub-issues

1. **ARCH-setup-foundation** - Set up project structure
2. **U-button-component** - Create button unit
3. **C-form-composition** - Compose form from units
```

Each sub-issue becomes a separate GitHub Issue linked to parent.

## Lane Definitions

- **A** - Core infrastructure, foundational work
- **B** - Feature development, user-facing functionality
- **C** - Improvements, refactoring, technical debt
- **D** - Documentation, process, non-code work

## Automation

Once an idea file exists:

- `ideas-to-issues.mjs` creates GitHub Issue
- Issue number synced back to idea file
- `sync-ideas-checklists.mjs` keeps checklists in sync
- `create-worktree-pr.mjs` scaffolds branch and PR

## Related Scripts

- `/scripts/validate-ideas.mjs` - Validate structure
- `/scripts/ideas-to-issues.mjs` - Create GitHub Issues
- `/scripts/sync-ideas-checklists.mjs` - Sync checklists
- `/scripts/create-worktree-pr.mjs` - Create worktree + PR

## Version History

- v0.1.0 (2025-10-28) - Initial templates
