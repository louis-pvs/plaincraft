# Scripts Quick Reference

Quick reference for all automation scripts in the repository.

## Setup & Environment

### `pnpm gh:prepare`

**Script:** `scripts/prepare-gh.mjs`  
**Purpose:** Check GitHub CLI installation and authentication

**What it does:**

- Verifies `gh` CLI is installed
- Checks authentication status
- Tests repository access
- Validates CI monitoring commands
- Shows installation instructions if needed

**Usage:**

```bash
pnpm gh:prepare
```

**Output:**

- ✅ All checks pass → shows available commands
- ❌ Setup needed → shows installation/auth instructions

## Changelog Management

### `pnpm changelog`

**Script:** `scripts/consolidate-changelog.mjs`  
**Purpose:** Consolidate temporary summaries into CHANGELOG.md

**What it does:**

1. Reads all `_tmp/*.md` files (sorted alphabetically)
2. Extracts version from `package.json`
3. Generates `## [version] - YYYY-MM-DD` entry
4. Adds each summary as `### <Title>` section
5. Inserts before existing entries (latest first)
6. Deletes `_tmp/*.md` files after success

**Usage:**

```bash
# Manual consolidation
pnpm changelog

# Or directly
node scripts/consolidate-changelog.mjs
```

**Pre-commit Hook:**

- Automatically runs if `_tmp/*.md` files exist
- Stages `CHANGELOG.md` for commit
- Part of `simple-git-hooks` workflow

**Input:**

```
_tmp/
  001-feature.md     # First summary
  002-bugfix.md      # Second summary
```

**Output:**

```markdown
## [0.1.0] - 2025-10-26

### First Feature

Content from 001-feature.md

### Bug Fix

Content from 002-bugfix.md
```

## Version Management

### `pnpm version:bump`

**Script:** `scripts/bump-version.mjs`  
**Purpose:** Bump semantic version based on commits

**What it does:**

- Analyzes last 10 commits for conventional patterns
- Detects bump type: major/minor/patch
- Updates `package.json` version
- Writes to `GITHUB_OUTPUT` for CI

**Usage:**

```bash
# Auto-detect from commits
pnpm version:bump

# Force specific bump
pnpm version:bump major
pnpm version:bump minor
pnpm version:bump patch
```

**Commit Patterns:**

- `[MAJOR]`, `breaking:` → major bump (1.0.0 → 2.0.0)
- `[MINOR]`, `feat:` → minor bump (1.0.0 → 1.1.0)
- `[PATCH]`, `fix:` → patch bump (1.0.0 → 1.0.1)
- Default → patch bump

## CI Monitoring

### `pnpm ci:check`

**Script:** `scripts/check-ci.mjs`  
**Purpose:** Check latest CI workflow status

**Requirements:** GitHub CLI (`gh`) installed and authenticated

**What it does:**

- Queries GitHub Actions via `gh` CLI
- Shows latest workflow run status
- Displays duration, conclusion, jobs
- Formats output as ASCII table

**Usage:**

```bash
# One-time check
pnpm ci:check

# Watch mode (refreshes every 5s)
pnpm ci:watch
```

**Output:**

```
CI Status Report
Branch: feat/ci-strategy
Run: #123 - CI workflow

Status: ✅ completed
Duration: 1m 23s

Jobs:
  ✅ check (32s)
  ✅ build-storybook (45s)
  ✅ storybook-test (38s)
```

## PR Management

### `pnpm pr:generate`

**Script:** `scripts/generate-pr-content.mjs`  
**Purpose:** Generate PR title and description from CHANGELOG.md

**What it does:**

1. Reads `CHANGELOG.md`
2. Extracts latest version sections
3. Generates PR title with commit tag
4. Formats PR body with all sections
5. Outputs to `GITHUB_OUTPUT` for workflow

**Usage:**

```bash
# Generate PR content
pnpm pr:generate

# Or directly
node scripts/generate-pr-content.mjs
```

**Example:**

```markdown
CHANGELOG.md:

## [0.1.0] - 2025-10-26

### [ARCH-ci] Feature One

### [ARCH-ci] Feature Two

Generated PR:
Title: [ARCH-ci] Feature One, Feature Two
Body: (full content with checklist)
```

**Workflow Integration:**

- Used by `.github/workflows/pr-update.yml`
- Automatically updates PR title/description
- Triggered on PR open/sync

**Commit Tag Reminder:**

- All commits must start with the ticket ID in square brackets (`[U-<slug>]`, `[C-<slug>]`, `[B-<slug>]`, `[ARCH-<slug>]`, `[PB-<slug>]`).
- The PR title generated from the changelog will inherit the same tag; ensure your commits match before pushing.

## Testing

### `pnpm test`

**Config:** `vitest.config.ts`  
**Purpose:** Run unit tests

**Usage:**

```bash
# Run tests
pnpm test

# With JSON output
pnpm test:json
```

### `pnpm storybook:test`

**Script:** `scripts/test-storybook.mjs`  
**Purpose:** Automated Storybook testing with server lifecycle

**What it does:**

1. Checks for existing `storybook-static` build
2. Builds if needed (or force rebuild with `--rebuild`)
3. Starts static HTTP server on port 6006
4. Waits for server ready
5. Runs `test-storybook` via npx
6. Cleans up server on exit/error

**Usage:**

```bash
# Standard test
pnpm storybook:test

# Force rebuild
pnpm storybook:test:rebuild

# With JSON output
pnpm storybook:test:json
```

## Recording

### `pnpm record:stories`

**Script:** `scripts/record-stories.mjs`  
**Purpose:** Record Storybook stories as videos/GIFs

**What it does:**

1. Starts Storybook server
2. Captures stories with Playwright
3. Records 5-second videos
4. Converts to GIFs with ffmpeg (if available)

**Usage:**

```bash
# Record all stories
pnpm record:stories

# Record specific story
STORIES=component--story pnpm record:stories
```

**Output:**

```
artifacts/video/*.webm
docs/assets/gif/*.gif
```

## Pre-commit Hooks

### Pre-commit Changelog Hook

**Script:** `scripts/pre-commit-changelog.mjs`  
**Trigger:** Automatic on `git commit`

**What it does:**

1. Checks if `_tmp/*.md` files exist
2. If yes and `CHANGELOG.md` not staged:
   - Runs `pnpm changelog`
   - Stages `CHANGELOG.md`
3. Continues to `lint-staged`

**Skip:**

```bash
git commit --no-verify
```

### Lint-staged

**Config:** `package.json` → `lint-staged`

**What it does:**

- Formats staged files with Prettier
- Lints staged files with ESLint
- Auto-fixes issues when possible

## Development Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format:check
pnpm format

# Full check (pre-push)
pnpm check    # typecheck && lint && test
```

## Workflow Commands

```bash
# Pre-push validation
pnpm typecheck && pnpm lint && pnpm test && pnpm storybook:test

# Integration window checklist
pnpm check            # Quick validation
pnpm storybook:test   # Full validation

# Post-merge cleanup
pnpm changelog        # Consolidate summaries (if pre-commit missed)
```

## Script Locations

```
scripts/
  bump-version.mjs              # Version bumping
  check-ci.mjs                  # CI monitoring
  consolidate-changelog.mjs     # Changelog consolidation
  generate-pr-content.mjs       # PR generation
  pre-commit-changelog.mjs      # Pre-commit hook
  prepare-gh.mjs                # GitHub CLI setup
  record-stories.mjs            # Story recording
  test-storybook.mjs            # Automated Storybook testing
```

## Quick Troubleshooting

**CI monitoring not working:**

```bash
pnpm gh:prepare   # Check gh CLI setup
```

**Pre-commit hook not running:**

```bash
pnpm prepare      # Reinstall git hooks
```

**Storybook tests failing:**

```bash
pnpm storybook:test:rebuild   # Force rebuild
```

**Changelog not consolidating:**

```bash
ls -la _tmp/      # Check if summaries exist
pnpm changelog    # Run manually
```

**Version bump not detecting commits:**

```bash
git log --oneline -10   # Check recent commits
pnpm version:bump patch # Force bump type
```
