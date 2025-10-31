# Changelog Template

Version: 0.1.0  
Last Updated: 2025-10-28

## Overview

Template for consolidating changelog entries from `_tmp/` into `CHANGELOG.md` with proper formatting and structure.

## Files

- `CHANGELOG.md` - Standard Keep a Changelog format template
- `_tmp/` - Directory for temporary release note files
- `USAGE.md` - How to use this template
- `template.config.json` - Metadata and validation schema

## Quick Start

```bash
# 1. Create temporary changelog entry
echo "# Feature Title\n\n- Implementation detail" > _tmp/001-feature.md

# 2. Consolidate into CHANGELOG.md
pnpm run changelog:consolidate

# 3. Commit with proper ticket prefix
git commit -m "[ARCH-changelog] Add release notes"
```

## Structure

### CHANGELOG.md Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [X.Y.Z] - YYYY-MM-DD

### Highlights

- Major feature descriptions
- Breaking changes

### Tooling & Commands

- New scripts or commands
- Configuration changes

### Rollout Notes

- Deployment instructions
- Migration steps
```

### Temporary Entry Format (\_tmp/)

```markdown
# Section Title

- Bullet point describing change
- Reference to ticket: `[U-slug]` or `[ARCH-slug]`
- Link to script: `scripts/script-name.mjs`
```

## Naming Convention

Temporary files use ordering prefix:

- `001-feature.md` - First entry
- `010-hotfix.md` - Hotfix entry
- `020-tooling.md` - Tooling update

## Automation

The consolidation script:

1. Reads files from `_tmp/` in lexical order
2. Extracts `# Title` as section heading
3. Merges content under appropriate release version
4. Deletes processed temporary files

## Links

- Unit script: `/scripts/ops/consolidate-changelog.mjs`
- Automation hook: `/scripts/pre-commit-changelog.mjs`
- Commit hook: `/scripts/commit-msg-hook.mjs`
- Storybook view: `/storybook/?path=/docs/governance-release-changelog--docs`
- Playbook pattern: `/playbook/patterns/release-changelog-automation.html`
- Historical reference only: `/guides/_archive/2025/11-guides-sunset/guide-changelog.md` (do not follow for active work)
