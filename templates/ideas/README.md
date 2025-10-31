# Ideas Template

**Version:** 0.1.0  
**Category:** Workflow  
**Created:** 2025-10-28

## Overview

Template system for creating structured idea documents with different types: Unit (U-), Composition (C-), and Architecture/Brief (ARCH-, PB-, B-).

## Purpose

Standardize idea documentation with consistent structure and validation requirements for tracking feature proposals, architectural decisions, and composition workflows.

## Files

- `idea-unit-template.md` - Single-purpose features or bugs (U- prefix)
- `idea-composition-template.md` - Multi-component features (C- prefix)
- `idea-brief-template.md` - Architectural decisions and briefs (ARCH-, PB-, B- prefix)
- `template.config.json` - Template configuration and validation rules

## Quick Start

```bash
# Copy template to ideas folder
cp templates/ideas/idea-unit-template.md ideas/U-my-feature.md

# Or use the composition template
cp templates/ideas/idea-composition-template.md ideas/C-complex-feature.md
```

## Required Sections

All idea documents must include:

- **Purpose** - Why this idea exists
- **Problem** - What problem it solves
- **Proposal** - How to implement
- **Acceptance Checklist** - Definition of done
- **Status log** - Dated bullet list tracking lifecycle transitions (Draft → Ticketed → Branched → PR Open → In Review → Merged → Archived)

## Naming Convention

- `U-[slug].md` - Unit ideas
- `C-[slug].md` - Composition ideas
- `ARCH-[slug].md` - Architecture ideas
- `PB-[slug].md` - Playbook ideas
- `B-[slug].md` - Brief ideas

## Required Guardrails

- Run `pnpm guardrails` locally before every PR or status update. CI blocks merges when guardrails fail.
- Use `pnpm drift:check --output json` to confirm idea metadata (lane/status) is canonical; fix any mismatches immediately.
- Attach dry-run transcripts from the lifecycle commands (`ops:idea-intake`, `ops:create-branch`, `ops:open-or-update-pr`, `ops:closeout`, `ops:report`) to your status notes so other lanes can audit transitions without parsing diffs.

## Links

- Playbook: `/playbook/patterns/ideas-source-of-truth.html`
- Storybook: `/storybook/?path=/docs/governance-ideas-pipeline--docs`
- Release storytelling: `/playbook/patterns/release-changelog-automation.html`
- Lifecycle governance: `/storybook/?path=/docs/governance-lifecycle-intake--docs`
- `/templates/ideas/USAGE.md` - Detailed usage examples
