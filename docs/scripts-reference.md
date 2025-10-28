# Scripts Quick Reference

Quick reference for all automation scripts in the repository.

## Ideas-as-Source-of-Truth Scripts

### `node scripts/ideas-to-issues.mjs`

**Purpose:** Automatically create GitHub Issues from idea files with full metadata population

**What it does:**

- Extracts Purpose, Problem, Proposal, Acceptance Checklist from idea files
- Generates comprehensive Issue body with all sections
- Adds source file link footer (`Source: /ideas/filename.md`)
- Processes Sub-Issues section (creates child Issues with Parent: #N reference)
- Updates parent Issue with task list of all children
- Supports dry-run mode for preview

**Usage:**

```bash
# Create issue from specific idea file
node scripts/ideas-to-issues.mjs ARCH-source-of-truth.md

# Create issues from all idea files
node scripts/ideas-to-issues.mjs

# Preview without creating (dry-run)
node scripts/ideas-to-issues.mjs --dry-run

# Create issue for specific prefix
node scripts/ideas-to-issues.mjs U-bridge-intro
```

**Features:**

- Auto-detects type from filename prefix (U-, C-, B-, ARCH-, PB-)
- Adds appropriate labels (type:unit, lane:C, etc.)
- Checks for existing Issues to prevent duplicates
- Backward compatible with idea files missing optional sections

### `node scripts/create-worktree-pr.mjs`

**Purpose:** Create dedicated worktree and PR from Issue with idea file sourcing

**What it does:**

- Creates isolated git worktree for parallel development
- Fetches Issue metadata from GitHub
- Sources PR body content from corresponding idea file
- Automatically links PR to Issue
- Sets up git config and dependencies
- Publishes branch and creates PR

**Usage:**

```bash
# Create worktree and PR for issue #42
node scripts/create-worktree-pr.mjs 42
```

**Worktree location:** `/home/user/repo-feat-branch-name`

### `node scripts/merge-subissue-to-parent.mjs`

**Purpose:** Merge completed sub-issue branch to parent branch

**What it does:**

- Detects parent issue from `Parent: #N` metadata in idea file
- Finds parent worktree by branch name pattern
- Fetches and merges sub-issue branch to parent branch
- Handles merge conflicts with clear error messages
- Auto-pushes merged parent branch

**Usage:**

```bash
# Merge sub-issue #31 to its parent
node scripts/merge-subissue-to-parent.mjs 31
```

**Workflow:**

```
Sub-issue branch → Parent branch → Main (when all sub-issues complete)
```

### `node scripts/sync-issue-to-card.mjs`

**Purpose:** Sync GitHub Issue content back to idea card file (bidirectional sync)

**What it does:**

- Finds idea file for given Issue number (via Source reference or title match)
- Fetches Issue body content from GitHub API (non-interactive)
- Updates idea file sections with Issue content:
  - Adds/updates `Issue: #N` metadata in front matter
  - Replaces Problem, Proposal, Acceptance Checklist sections
  - **Replaces entire Sub-Issues section** with GitHub checklist format
  - Preserves checkbox state (`- [ ]` vs `- [x]`)
- Skips `## Details` section (contains source reference)

**Usage:**

```bash
# Sync issue #42 content to its idea file
node scripts/sync-issue-to-card.mjs 42
```

**Important Notes:**

- **Sub-Issues section is completely replaced** - don't manually edit after Issue creation
- Only sync after Issue is updated in GitHub (not before)
- This enables GitHub Issue as single source of truth for tracking progress
- Use after closing sub-issues to update parent card with `[x]` checkboxes

### `node scripts/ops/consolidate-changelog.mjs`

**Purpose:** Consolidate `_tmp/*.md` summaries into CHANGELOG.md with guardrails

**Status:** **Migrated** - Guardrails-compliant orchestrator (legacy `_tmp/` workflow still supported)

**Current behavior:** Dry-run first, deduplicates duplicate versions, supports JSON/text output, optional temp-file cleanup

**Roadmap:**

- Add idea-file sourcing to replace `_tmp/` workflow
- Auto-link related issues and PRs during consolidation
- Provide richer summary metadata for docs automation

### `node scripts/ops/create-issues-from-changelog.mjs`

**Purpose:** Generate GitHub issues for each changelog section with guardrail defaults

**Status:** **Migrated** - Guardrails-compliant orchestrator with dry-run JSON output

**Current behavior:**

- Default dry-run with structured JSON output (`--yes` flips to execution)
- Normalizes lane labels to the new `lane-*` taxonomy when tags are present
- Supports `--version`, `--filter`, and `--max` to target specific releases or sections
- Optionally assigns created issues to `@me` with `--assign`

**Usage:**

```bash
# Preview issues for the latest release
node scripts/ops/create-issues-from-changelog.mjs --dry-run --output json

# Create real issues for version 0.4.0 and assign to yourself
node scripts/ops/create-issues-from-changelog.mjs --version 0.4.0 --yes --assign
```

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

### `pnpm gh:worktree`

**Script:** `scripts/create-worktree-pr.mjs`  
**Purpose:** Create an isolated worktree/branch for an Issue and open a draft PR linked to it.

**What it does:**

- Fetches Issue metadata via `gh issue view` (title, labels, body).
- Generates a branch name from the ticket tag in the Issue title (`[U-…]`, `[C-…]`, `[B-…]`, `[ARCH-…]`, `[PB-…]`).
- Creates a git worktree (reusing or force-recreating branches when requested).
- Runs `scripts/post-checkout.mjs` inside the worktree to install dependencies and push the branch upstream.
- Verifies the branch exists on origin before attempting PR creation.
- **Checks for commits** on the branch before creating PR; gracefully skips PR creation if no commits exist yet.
- **Creates bootstrap commit** automatically if no commits exist (unless `--no-bootstrap` is used), ensuring PR can be created immediately.
- Drafts a PR (unless `--no-draft`) with `Closes #<issue>` pre-filled, using temp file for body content.

**Usage:**

```bash
# Standard flow (creates worktree, branch, bootstrap commit, draft PR)
pnpm gh:worktree -- 42

# Dry run preview
pnpm gh:worktree -- 42 --dry-run

# Custom worktree directory & base branch
pnpm gh:worktree -- 58 --dir ../plaincraft-otp --base develop

# Force-remove existing worktree/branch
pnpm gh:worktree -- 99 --force

# Create PR ready for review (not draft)
pnpm gh:worktree -- 77 --no-draft

# Skip bootstrap commit (manual workflow)
pnpm gh:worktree -- 42 --no-bootstrap
```

**Notes:**

- Issue titles must retain the ticket ID prefix so the branch/tag naming is correct.
- If the branch has not been pushed yet, the script stops and prints the exact `git push` command.
- **Bootstrap commit behavior**: By default, the script creates a `.worktree-bootstrap.md` file with metadata and commits it with `[skip ci]` to ensure PR creation succeeds immediately. You can amend or delete this commit once you add your actual changes.
- Use `--no-bootstrap` to skip the automatic commit if you prefer the manual workflow.
- **If no commits exist** and bootstrap is disabled, PR creation is skipped with instructions to commit and re-run the script.
- Replace the TODO sections in the generated PR body before requesting review.
- Default worktree path is `../plaincraft-<branch-name>`; override with `--dir` whenever needed.

## Changelog Management

### `pnpm changelog`

**Script:** `scripts/ops/consolidate-changelog.mjs`  
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
node scripts/ops/consolidate-changelog.mjs
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

### Roadmap Project Template (`templates/roadmap-project-template.json`)

**Purpose:** Seed data for recreating the Plaincraft Roadmap via API scripts or
manual import.

**Contents:**

- Project metadata (name, description).
- Board views for lanes A–D with filters and WIP limits.
- Field definitions mirroring the guide (`ID`, `Lane`, `Acceptance`, `Units`,
  `Metric`).
- Required lane/type labels and automation notes.

**Usage:**

- Use as input when scripting project creation (e.g., GitHub API, Octokit).
- Update when the roadmap’s structure changes to keep API automation aligned.

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

### `pnpm build:playbook`

**Purpose:** Build VitePress documentation site

**What it does:**

- Compiles VitePress docs from `/playbook` directory
- Generates static site to `playbook-static/`
- Used in CI and deploy workflows

**Usage:**

```bash
pnpm build:playbook
```

**Development:**

```bash
pnpm playbook:dev      # Start dev server
pnpm playbook:preview  # Preview built site
```

## Deployment Scripts

### `node scripts/generate-gh-pages-index.mjs`

**Purpose:** Generate root landing page for GitHub Pages deployment

**What it does:**

- Creates a responsive landing page with navigation cards
- Links to `/demo`, `/storybook`, and `/playbook` sites
- Generates styled HTML with gradient background and hover effects
- Optimized for fast loading (no external dependencies)

**Usage:**

```bash
# Generate to default location (_deploy/)
node scripts/generate-gh-pages-index.mjs

# Generate to custom location
node scripts/generate-gh-pages-index.mjs path/to/output
```

**Used by:** `.github/workflows/deploy.yml`

**Output:** Root `index.html` with navigation to all deployed sites

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
  commit-msg-hook.mjs           # Commit message validation (git hook)
  consolidate-changelog.mjs     # Changelog consolidation
  generate-pr-content.mjs       # PR generation
  pre-commit-changelog.mjs      # Pre-commit hook
  prepare-gh.mjs                # GitHub CLI setup
  record-stories.mjs            # Story recording
  test-storybook.mjs            # Automated Storybook testing
```

## Git Hooks

### `commit-msg-hook.mjs`

**Purpose:** Enforce ticket ID prefix conventions in commit messages

**Automatically runs on:** Every commit (via simple-git-hooks)

**What it validates:**

- Commit message starts with valid ticket prefix: `[U-*]`, `[C-*]`, `[B-*]`, `[ARCH-*]`, `[PB-*]`
- Space exists after the ticket prefix
- Ticket slug uses kebab-case (lowercase with hyphens)
- Commit message has meaningful content (>10 characters)

**Skips validation for:**

- Merge commits (messages starting with "Merge")
- Revert commits (messages starting with "Revert")
- Empty messages

**Valid commit message formats:**

```bash
[U-button-component] Add accessible button with ARIA support
[C-form-wizard] Implement multi-step form composition
[B-focus-trap] Fix keyboard navigation in modal
[ARCH-ci-split] Add Playbook build track to CI pipeline
[PB-recording] Document video recording standards
```

**Invalid formats (will be rejected):**

```bash
Add button component                    # Missing ticket prefix
[button] Add component                  # Invalid prefix format
[U-Button-Component] Add component      # Uppercase in slug (warning)
[U-button]Add component                 # Missing space after prefix
[U-x] y                                 # Message too short (warning)
```

**Manual testing:**

```bash
# Test with valid message
echo "[ARCH-test] Test commit" > /tmp/msg.txt
node scripts/commit-msg-hook.mjs /tmp/msg.txt

# Test with invalid message
echo "Invalid commit" > /tmp/msg.txt
node scripts/commit-msg-hook.mjs /tmp/msg.txt
```

**Installation:**

The hook is automatically installed when you run:

```bash
pnpm install       # Runs prepare script
pnpm prepare       # Reinstalls git hooks
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
