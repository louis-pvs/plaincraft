# User Story Template

Template for creating development-ready user stories that connect ideas to roadmap execution.

## Purpose

User stories bridge the gap between product ideas and technical implementation. This template provides a standardized format for:

- Defining user needs and desired outcomes
- Connecting stories to source ideas and roadmap cards
- Specifying acceptance criteria and technical scope
- Tracking story lifecycle from draft to deployment

## Quick Start

```bash
# Copy template for a new story
cp templates/user-story/user-story-template.md ideas/U-my-feature.md

# Or use the script
pnpm new:story
```

## When to Use

- Starting development on a new feature
- Converting an approved idea into actionable work
- Creating stories for roadmap lane assignments
- Documenting feature requirements before implementation

## Naming Convention

- User stories: `U-<slug>` (e.g., `U-profile-form-composed.md`)
- Creator stories: `C-<slug>` (e.g., `C-creator-onboarding-bridge.md`)

Files should live in `/ideas/` directory alongside their source idea files.

## Required Fields

- **Title**: Format `[U-<slug>]` or `[C-<slug>]` with short outcome statement
- **Persona & Need**: As a / I want / So that statements
- **Context**: Links to source idea, roadmap card, related docs
- **Scope**: Acceptance criteria as checklist
- **Technical Notes**: Implementation details, API changes, dependencies
- **Risks & Dependencies**: Blockers, edge cases, technical debt

## Related Files

- `/guides/USER-STORY-GUIDE.md` - Best practices for writing effective stories (archived if exists)
- `/templates/ideas/` - Source idea templates
- `/templates/roadmap-project/` - Roadmap card structure
- `/scripts/new-snippet.mjs` - Story creation automation

## Validation

Stories are validated during:

- PR creation (via GitHub Actions)
- Pre-commit hooks (if story is staged)
- Manual check: `pnpm docs:check`

Required structure:

- Proper title format with U- or C- prefix
- All required sections present
- Valid links to source idea and roadmap card
- At least 3 acceptance criteria
