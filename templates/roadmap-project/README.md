# Roadmap Project Template

**Version:** 0.1.0  
**Category:** Planning  
**Created:** 2025-10-28

## Overview

GitHub Projects V2 template configuration for roadmap tracking and sprint planning.

## Purpose

Standardize project board setup with consistent columns, views, and automation rules for managing development roadmaps.

## Files

- `roadmap-project-template.json` - GitHub Projects V2 configuration
- `template.config.json` - Template metadata and usage
- `USAGE.md` - Detailed setup instructions

## Quick Start

```bash
# Apply template using setup script
node scripts/ops/setup-project.mjs --config templates/roadmap-project/roadmap-project-template.json

# Or manually via GitHub CLI
gh project create --owner louis-pvs --title "Sprint Roadmap" \
  --format json < templates/roadmap-project/roadmap-project-template.json
```

## Features

- Standard column structure (Backlog, In Progress, Review, Done)
- Custom fields for priority, lane (Foundations/Narrative/Automation/Operations), and effort
- Automated card movement based on issue/PR state
- Sprint-based views and filtering

## Links

- Playbook: `/playbook/patterns/roadmap-project-onboarding.html`
- Storybook: `/storybook/?path=/docs/governance-roadmap-onboarding--docs`
- Automation script: `/scripts/ops/setup-project.mjs`
