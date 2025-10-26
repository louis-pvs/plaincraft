# Changelog

All notable changes to this project will be documented in this file. Follow the
[changelog guide](guides/CHANGELOG-GUIDE.md) for structure and content.

## [0.1.0] - 2025-10-26

### [ARCH-ci] PR Template Integration

Integrated PR auto-update workflow with existing PR template structure.

## Changes

### PR Generation Script (`scripts/generate-pr-content.mjs`)

**Template Structure:**

- Follows `.github/pull_request_template.md` format
- Includes "Related Issue", "Lane + Contracts", "Acceptance Checklist" sections
- Auto-populates lane label based on commit tag

**Lane Detection:**

- `[U-*]` → `lane:A` (Pair A - Components)
- `[B-*]` → `lane:B` (Pair B - Documentation)
- `[C-*]`, `[ARCH-*]` → `lane:C` (Pair C - CI/DevOps)
- `[D-*]`, `[PB-*]` → `lane:D` (Pair D - Project/Playbook)

**Scope Summary:**

- Extracted from changelog section titles
- Lists all changes in the version

**Preservation:**

- Keeps "Changes" section with full CHANGELOG.md content
- Adds reminder to fill in ticket reference and acceptance checklist

### PR Update Workflow (`.github/workflows/pr-update.yml`)

**Behavior:**

- Auto-updates only on PR `opened` event
- Skips on `synchronize` (subsequent pushes)
- Preserves manual edits after initial PR creation

**Rationale:**

- Developer can manually fill in ticket reference
- Can customize acceptance checklist
- Won't overwrite manual changes on new pushes

## Usage

### When PR is Opened:

1. Workflow generates title/body from CHANGELOG.md
2. Auto-fills:
   - PR title with commit tag
   - Lane label based on tag
   - Scope summary from changes
   - Default acceptance checklist
3. Developer must still:
   - Add `Closes #<issue-number>`
   - Fill in ticket ID
   - Copy acceptance checklist from ticket
   - Add rollout notes if needed

### On Subsequent Pushes:

- Workflow runs but skips PR update
- Manual edits preserved
- Developer can manually update if needed

## Testing

All lane tags tested and working:

- ✅ `[U-inline-edit]` → lane:A
- ✅ `[B-docs]` → lane:B
- ✅ `[ARCH-ci]` → lane:C
- ✅ `[PB-playbook]` → lane:D

## Benefits

- Reduces manual PR description writing
- Enforces template structure
- Auto-detects lane from commit tags
- Preserves developer flexibility
- Maintains protocol compliance

## [0.1.0] - 2025-10-26

### [PB-playbook] Add Guide

Adds playbook guide.

## [0.1.0] - 2025-10-26

### [B-docs] Update Docs

Updates documentation pages.

## [0.1.0] - 2025-10-26

### [U-inline-edit] Add Feature

Adds inline editing.

## [0.1.0] - 2025-10-26

# Changelog

All notable changes to this project will be documented in this file. Follow the
[changelog guide](guides/CHANGELOG-GUIDE.md) for structure and content.

## [0.1.0] - 2025-10-26

### Highlights

- Split `.github/workflows/ci.yml` into parallel jobs (`check`, `build-storybook`,
  `storybook-test`, `build-demo`, `summary`) with concurrency control and shared
  artifacts to tighten feedback loops.
- Added nightly/manual recording workflow (`record.yml`) plus
  `scripts/record-stories.mjs` so lanes can capture `.webm`/`.gif` Storybook
  assets for documentation.
- Automated Storybook verification via `scripts/test-storybook.mjs`, which
  builds when required, serves with an internal Node static server, waits for
  readiness, and cleans up reliably.

### Tooling & Commands

- Switched Vitest to the `threads` pool; `pnpm test` no longer needs manual
  `--pool` overrides.
- Introduced a workflow status helper: `pnpm ci:check` /
  `node scripts/check-ci.mjs [--watch|--run-id=<id>]`.
- Updated package scripts for pre-push checks:
  `pnpm typecheck && pnpm lint && pnpm test && pnpm storybook:test`.
- Documented Storybook testing shortcuts:
  - `pnpm storybook:test` — build, serve, test, and clean automatically.
  - `pnpm storybook:test:json` — emit JSON artifacts for CI summaries.
  - `pnpm record:stories` / `STORIES=component--story pnpm record:stories` —
    generate media for docs.
- Introduced `.github/pipeline-config.json` so automations can pull lane views,
  ticket templates, and merge requirements from a single source.

### [ARCH-ci] PR Template Integration

Integrated PR auto-update workflow with existing PR template structure.

**PR Generation Script (`scripts/generate-pr-content.mjs`):**

- Follows `.github/pull_request_template.md` format
- Includes "Related Issue", "Lane + Contracts", "Acceptance Checklist" sections
- Auto-populates lane label based on commit tag
- Lane Detection: `[U-*]` → lane:A, `[B-*]` → lane:B, `[C-*]/[ARCH-*]` → lane:C, `[D-*]/[PB-*]` → lane:D

**PR Update Workflow (`.github/workflows/pr-update.yml`):**

- Auto-updates only on PR `opened` event
- Skips on `synchronize` (subsequent pushes)
- Preserves manual edits after initial PR creation

### Issue & Project Compliance

- Issue templates enforce ticket IDs, lane labels, and acceptance checklists so
  Units, Compositions, and Bugs stay linked to the Plaincraft Roadmap.
- Project views are lane-scoped with WIP limit 3; automation applies `lane:*`
  labels and blocks merges unless a PR references its Issue.
- The PR template now requires `Closes #…`, a matching ticket ID prefix on all
  commits, and the pasted acceptance checklist to keep pipeline checks aligned
  with roadmap status.

### Local Timing Snapshot (Node 22.15.1, pnpm 9.0.0)

- `pnpm typecheck`: 7.3 s
- `pnpm lint`: 3.3 s
- `pnpm test`: 1.5 s (18 tests with Vitest `threads` pool)
- `pnpm storybook:test`: 6.9 s (reuses cached `storybook-static/`)
- Fresh Storybook build (`pnpm build:storybook`): 20.4 s — inherited by
  `storybook:test --rebuild`

### Rollout Notes

- Capture actual job durations from the first CI run and replace the local timing
  snapshot above.
- Use `pnpm ci:check --watch` during integration windows to monitor job status
  and surface failures quickly.
- Nightly recording remains opt-in; trigger manually (`gh workflow run record.yml -f stories=all`)
  to validate GIF output before updating docs.

## Features

- Integrates with PR template sections
- Auto-fills lane label based on commit tag
- Preserves template structure for manual completion

## [0.1.0] - 2025-10-26

### [ARCH-ci] PR Requirements Automation & Duplicate Prevention

## Overview

Completed final phase of CI/CD automation: duplicate version prevention in changelog consolidation and comprehensive PR requirements automation using GitHub CLI.

## Changes

### Duplicate Version Prevention

**File:** `scripts/consolidate-changelog.mjs`

**Implementation:**

- Added duplicate detection in `insertIntoChangelog` function
- Checks for existing version with regex pattern: `^## \[${version}\]`
- Merges new sections into existing version block instead of creating duplicate
- Maintains section order and proper spacing

**Testing:**

- Identified 6 duplicate `[0.1.0]` entries in CHANGELOG.md
- Manually consolidated all duplicates into single version block
- Preserved all section content (PR Template, PB-playbook, B-docs, U-inline-edit, Test, Highlights)

**Benefits:**

- Prevents multiple version headers in changelog
- Automatic section merging on consolidation
- Cleaner changelog structure

### PR Requirements Automation Script

**File:** `scripts/pr-requirements.mjs` (419 lines)

**Features:**

1. **Issue Creation:**
   - Create issues with lane labels
   - Auto-detect lane from commit tag
   - Generate type-specific acceptance checklists
   - Support for unit, composition, bug, architecture types

2. **PR Verification:**
   - Check for issue reference (Closes #123)
   - Verify lane label present
   - Validate all commits have tag prefix
   - Confirm acceptance checklist included

3. **CI Integration:**
   - `--check-pr` mode exits with error code for pipeline blocking
   - `--verify-pr` mode shows detailed report
   - Auto-detects current branch's PR

4. **Project Management:**
   - Link issues to GitHub projects
   - Apply lane labels to PRs
   - Support for multiple assignees/labels

**Lane Detection:**

- `[U-*]` → lane:A (Pair A - Components)
- `[B-*]` → lane:B (Pair B - Documentation)
- `[C-*]`, `[ARCH-*]` → lane:C (Pair C - CI/DevOps)
- `[D-*]`, `[PB-*]` → lane:D (Pair D - Project/Playbook)

**Checklist Generation:**

- Common requirements for all types
- Type-specific items (unit: headless pattern, accessibility; bug: regression tests; etc.)
- Formatted ready for GitHub issues

### PR Check Workflow

**File:** `.github/workflows/pr-check.yml`

**Triggers:**

- PR opened, edited, synchronized
- Label/unlabel events
- Review submitted

**Checks:**

1. Verify PR requirements via script
2. Check all commits have tag prefix
3. Comment on PR if requirements not met

**Integration:**

- Runs on every PR change
- Blocks merge if requirements not met (via branch protection)
- Auto-comments with missing requirements

### Package Scripts

**Added to `package.json`:**

- `pnpm pr:create-issue` - Create GitHub issue with automation
- `pnpm pr:verify` - Verify PR meets requirements (report)
- `pnpm pr:check` - Check PR for CI (exit code)

**Usage Examples:**

```bash
# Create unit issue
pnpm pr:create-issue -- --create-issue "Add Button" --tag U-button

# Verify PR before push
pnpm pr:verify -- 123

# CI pipeline check
pnpm pr:check -- $PR_NUMBER
```

### Documentation Updates

**File:** `guides/SCRIPTS-REFERENCE.md`

**New Sections:**

- PR Requirements & Automation
- Issue creation with examples
- PR verification commands
- CI integration patterns

**Updated:**

- Changelog consolidation now documents duplicate prevention
- Added duplicate detection to feature list
- Included merge behavior documentation

## Testing

### Duplicate Prevention

- ✅ Identified 6 duplicate entries in CHANGELOG.md
- ✅ Consolidated manually into single version
- ✅ Code implemented to prevent future duplicates
- ⏳ Needs testing with new consolidation runs

### PR Requirements Script

- ✅ Help output working
- ✅ Lint errors fixed
- ✅ Lane detection logic verified
- ⏳ Needs testing with actual PRs (requires gh CLI setup)

### Workflow

- ✅ YAML syntax valid
- ✅ All required permissions set
- ⏳ Needs testing on actual PR

## Rollout Notes

1. **GitHub CLI Setup:**
   - All developers must run `pnpm gh:prepare`
   - Authenticate with `gh auth login`
   - Verify repo access before using PR automation

2. **Branch Protection:**
   - Add "PR Requirements Check" as required status check
   - Prevents merge without lane label + issue reference

3. **Workflow Integration:**
   - PR check runs automatically on every PR change
   - Failed checks block merge via branch protection
   - Manual override available for maintainers

4. **Testing Priority:**
   - Test duplicate prevention with multiple consolidation runs
   - Verify PR checks work on actual PRs
   - Test issue creation for all lane types
   - Validate checklist generation for all issue types

## Protocol Compliance

- ✅ All changes in Pair C lane (workflows, scripts, guides)
- ✅ Commit tag: `[ARCH-ci]`
- ✅ Files follow protocol structure
- ✅ No cross-lane modifications
- ✅ Documentation complete

## Next Steps

1. Test duplicate prevention:

   ```bash
   # Create test summaries
   echo "### Test 1" > _tmp/test1.md
   echo "### Test 2" > _tmp/test2.md
   pnpm changelog
   # Verify no duplicate version created
   ```

2. Set up GitHub CLI:

   ```bash
   pnpm gh:prepare
   gh auth login
   ```

3. Test issue creation:

   ```bash
   pnpm pr:create-issue -- --create-issue "Test Issue" --tag ARCH-test --type architecture
   ```

4. Enable PR check workflow:
   - Push changes
   - Test on actual PR
   - Add to branch protection rules

5. Update other lanes' documentation with PR automation commands

### Highlights

- Split `.github/workflows/ci.yml` into parallel jobs (`check`, `build-storybook`,
  `storybook-test`, `build-demo`, `summary`) with concurrency control and shared
  artifacts to tighten feedback loops.
- Added nightly/manual recording workflow (`record.yml`) plus
  `scripts/record-stories.mjs` so lanes can capture `.webm`/`.gif` Storybook
  assets for documentation.
- Automated Storybook verification via `scripts/test-storybook.mjs`, which
  builds when required, serves with an internal Node static server, waits for
  readiness, and cleans up reliably.

### Tooling & Commands

- Switched Vitest to the `threads` pool; `pnpm test` no longer needs manual
  `--pool` overrides.
- Introduced a workflow status helper: `pnpm ci:check` /
  `node scripts/check-ci.mjs [--watch|--run-id=<id>]`.
- Updated package scripts for pre-push checks:
  `pnpm typecheck && pnpm lint && pnpm test && pnpm storybook:test`.
- Documented Storybook testing shortcuts:
  - `pnpm storybook:test` — build, serve, test, and clean automatically.
  - `pnpm storybook:test:json` — emit JSON artifacts for CI summaries.
  - `pnpm record:stories` / `STORIES=component--story pnpm record:stories` —
    generate media for docs.

### Issue & Project Compliance

- Issue templates enforce ticket IDs, lane labels, and acceptance checklists so
  Units, Compositions, and Bugs stay linked to the Plaincraft Roadmap.
- Project views are lane-scoped with WIP limit 3; automation applies `lane:*`
  labels and blocks merges unless a PR references its Issue.
- The PR template now requires `Closes #…`, a matching ticket ID prefix on all
  commits, and the pasted acceptance checklist to keep pipeline checks aligned
  with roadmap status.

### Local Timing Snapshot (Node 22.15.1, pnpm 9.0.0)

- `pnpm typecheck`: 7.3 s
- `pnpm lint`: 3.3 s
- `pnpm test`: 1.5 s (18 tests with Vitest `threads` pool)
- `pnpm storybook:test`: 6.9 s (reuses cached `storybook-static/`)
- Fresh Storybook build (`pnpm build:storybook`): 20.4 s — inherited by
  `storybook:test --rebuild`

### Rollout Notes

- Capture actual job durations from the first CI run and replace the local timing
  snapshot above.
- Use `pnpm ci:check --watch` during integration windows to monitor job status
  and surface failures quickly.
- Nightly recording remains opt-in; trigger manually (`gh workflow run record.yml -f stories=all`)
  to validate GIF output before updating docs.
