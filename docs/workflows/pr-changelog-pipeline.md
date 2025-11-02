---
id: workflow-pr-changelog
owner: "@lane-c"
lane: C
version: 1.0.0
created: 2025-11-02
ttl_days: 90
last_verified: 2025-11-02
prev: /workflows/idea-lifecycle
next: /workflows/project-board-integration
---

# PR-Based Changelog Pipeline

## Overview

The Plaincraft project uses a **PR-based changelog mechanism** instead of commit message parsing. This approach extracts changelog entries directly from merged PR bodies, providing more accurate and structured changelog management.

## How It Works

### 1. PR Creation with Changelog Section

When creating a PR, include a `## Changes` section in the PR body:

\`\`\`markdown

## Changes

- Added new feature X
- Fixed bug in component Y
- Updated documentation for Z
  \`\`\`

### 2. Automatic Extraction on Merge

When a PR is merged to `main`:

1. The `pr-changelog` workflow automatically triggers
2. `scripts/ops/extract-pr-changelog.mjs` extracts the changelog section
3. A markdown summary file is created in `_tmp/pr-{number}-{slug}.md`
4. The summary file is committed back to `main` with `[skip ci]`

### 3. Consolidation on Version Bump

When bumping the version (via `version` workflow or manual `pnpm changelog`):

1. All `_tmp/*.md` files are consolidated into `CHANGELOG.md`
2. Entries are organized under the new version number
3. Temporary summary files are deleted (unless `--keep-temp` is used)

## Workflow Files

- `.github/workflows/pr-changelog.yml` - Extracts changelog on PR merge
- `.github/workflows/version.yml` - Consolidates changelog on version bump

## Scripts

### Extract Changelog from PR

\`\`\`bash

# Extract from specific PR

pnpm changelog:extract -- --pr-number 123 --yes

# Dry-run preview

pnpm changelog:extract -- --pr-number 123
\`\`\`

### Consolidate Changelog

\`\`\`bash

# Consolidate all summaries into CHANGELOG.md

pnpm changelog --yes

# Dry-run preview

pnpm changelog

# Keep temporary files after consolidation

pnpm changelog --yes --keep-temp
\`\`\`

## Changelog Section Patterns

The extraction script recognizes the following section headers:

- `## Changes`
- `## Changelog`
- `## What Changed`
- `## Summary`
- `### Changes`

## Benefits Over Commit-Based Approach

1. **More Accurate**: Changelog content is explicitly written, not parsed from commits
2. **Less Strict**: No rigid commit message format requirements
3. **Better Context**: PR bodies provide more space for detailed change descriptions
4. **Easier to Review**: Changelog content is reviewed as part of PR review
5. **Flexible**: Authors can structure changelog content as needed

## Migration Notes

### Old Approach (Deprecated)

- Relied on parsing `[TAG]` from commit messages
- Required strict commit message formats
- Often missed or incorrectly parsed changes

### New Approach (Current)

- Extracts from PR body `## Changes` section
- No commit message requirements
- Explicit, reviewer-approved changelog content

## Example PR Body

\`\`\`markdown

## Overview

This PR implements the new dashboard analytics feature.

## Changes

- Added `DashboardAnalytics` component with chart support
- Integrated with analytics API endpoint
- Added unit tests for data processing logic
- Updated storybook with analytics examples

## Testing

- Manual testing with sample data
- All unit tests passing
- Verified mobile responsiveness

## Related

Closes #123
\`\`\`

## Troubleshooting

### "No changelog section found"

**Problem**: The PR was merged but no summary file was created.

**Solution**: Ensure the PR body includes a recognized changelog section header (`## Changes`, etc.) with content below it.

### Summary files not consolidating

**Problem**: Summary files exist in `_tmp/` but aren't being consolidated.

**Solution**: Run `pnpm changelog --yes` to manually consolidate, or wait for the next version bump workflow.

### Duplicate entries

**Problem**: Same changelog entry appears multiple times.

**Solution**: The consolidation script automatically deduplicates entries by version. If you see duplicates, they're likely from different versions.
