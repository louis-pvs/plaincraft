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
- Status log (chronological bullet list of lifecycle transitions)
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
- Status log - Track Draft → Ticketed → Branched → PR Open → In Review → Merged
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
- Status log - Dated entries for major lifecycle decisions
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

# 5. Create worktree and PR (updates idea metadata)
node scripts/create-worktree-pr.mjs <issue-number>
# Updates the idea frontmatter with `Issue: #<number>` and logs the status transition
# before pushing the bootstrap commit.
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

- **A — Foundations & Tooling**: Autodocs, shared component primitives, and interaction testing infrastructure.
- **B — Narrative & Enablement**: Playbook/Storybook narratives, documentation migrations, and developer training material.
- **C — DevOps & Automation**: Guardrails, CLI workflows, CI pipelines, and policy enforcement.
- **D — Program Operations**: Backlog pilots, release governance, roadmap hygiene, and cross-lane coordination.

## Automation

Once an idea file exists:

- `ideas-to-issues.mjs` creates GitHub Issue
- Issue number synced back to idea file
- `sync-ideas-checklists.mjs` keeps checklists in sync
- `create-worktree-pr.mjs` scaffolds branch and PR, updating the source idea
  with the assigned issue number and `status: in-progress`
- Always run `pnpm guardrails` before pushing; treat failures as blockers until resolved.
- Use `pnpm drift:check --output json` to confirm Lane/Status remain canonical before requesting review.

## Related Scripts

- `/scripts/validate-ideas.mjs` - Validate structure
- `/scripts/ideas-to-issues.mjs` - Create GitHub Issues
- `/scripts/sync-ideas-checklists.mjs` - Sync checklists
- `/scripts/create-worktree-pr.mjs` - Create worktree + PR

## Version History

- v0.1.0 (2025-10-28) - Initial templates
