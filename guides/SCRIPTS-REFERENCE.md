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

## PR Requirements & Automation

### `pnpm pr:create-issue`

**Script:** `scripts/pr-requirements.mjs`  
**Purpose:** Create GitHub issues with lane labels and acceptance checklists

**What it does:**

- Creates issue with proper lane label
- Auto-detects lane from commit tag
- Generates type-specific acceptance checklist
- Applies additional labels and assignees
- Returns issue number and URL

**Usage:**

```bash
# Create unit issue with auto-detected lane
pnpm pr:create-issue -- --create-issue "Add Button component" --tag U-button

# Create issue with explicit lane
pnpm pr:create-issue -- --create-issue "Add feature" --lane A --type unit

# Create architecture issue
pnpm pr:create-issue -- --create-issue "Refactor state" --lane C --type architecture

# Add assignees and labels
pnpm pr:create-issue -- --create-issue "Fix bug" --tag U-inline --assignee @me --label high-priority
```

**Options:**

- `--create-issue <title>` - Issue title (required)
- `--lane <A|B|C|D>` - Lane assignment (auto-detected from tag if omitted)
- `--tag <tag>` - Commit tag for lane detection
- `--type <type>` - Issue type: unit, composition, bug, architecture (default: unit)
- `--body <text>` - Issue body text
- `--label <label>` - Additional label (repeatable)
- `--assignee <user>` - Assignee (repeatable)

### `pnpm pr:verify`

**Script:** `scripts/pr-requirements.mjs`  
**Purpose:** Verify PR meets all requirements

**What it checks:**

- ✓ Issue reference (Closes #123)
- ✓ Lane label present
- ✓ All commits have tag prefix
- ✓ Acceptance checklist included

**Usage:**

```bash
# Verify specific PR
pnpm pr:verify -- 123

# Verify current branch's PR
pnpm pr:verify
```

**Output:**

- ✅ All requirements met
- ❌ Lists missing requirements

### `pnpm pr:check`

**Script:** `scripts/pr-requirements.mjs`  
**Purpose:** Check PR requirements (CI mode - exits with error code)

**What it does:**

- Same checks as `pr:verify`
- Exits with code 0 if passed
- Exits with code 1 if failed (blocks CI)

**Usage:**

```bash
# In CI pipeline
pnpm pr:check -- $PR_NUMBER

# Check current branch (auto-detects PR)
pnpm pr:check
```

**Use case:** Add to CI pipeline as merge blocker

## Changelog Management

### `pnpm changelog`

**Script:** `scripts/consolidate-changelog.mjs`  
**Purpose:** Consolidate temporary summaries into CHANGELOG.md

**What it does:**

1. Reads all `_tmp/*.md` files (sorted alphabetically)
2. Extracts version from `package.json`
3. Generates `## [version] - YYYY-MM-DD` entry
4. **Detects duplicate versions** and merges sections if found
5. Adds each summary as `### <Title>` section
6. Inserts before existing entries (latest first)
7. Deletes `_tmp/*.md` files after success

**Features:**

- **Duplicate prevention:** Merges new sections into existing version instead of creating duplicate headers
- Auto-deletes temporary files after consolidation
- Sorts summaries alphabetically by filename
- Creates `_tmp/` directory if missing

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

### Pipeline Configuration (`.github/pipeline-config.json`)

**Purpose:** Central template that defines Issue/Project metadata and PR
requirements so CI jobs and helper scripts stay synchronized.

**Sections:**

- `project` – Project ID, lane-specific views (WIP limit 3), required labels,
  and canonical field mapping.
- `tickets` – Ticket type definitions mapping prefixes (`U-`, `C-`, `B-`) to
  their Issue templates, default labels, and Project fields.
- `pull_requests` – Required merge rules (`Closes #…`, lane labels, acceptance
  checklist) plus template expectations for enforcement.

**Usage:**

- Reference when updating Issue templates, adding new ticket types, or changing
  roadmap fields; keeping this JSON up to date lets CI read the requirements
  without hard-coding them.
- Future automation can parse this file to validate tickets, enforce lane
  limits, and produce status dashboards.

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
