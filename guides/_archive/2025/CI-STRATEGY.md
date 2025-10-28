# CI Strategy

## Overview

Comprehensive CI/CD automation with parallel jobs, headless Storybook testing, automated version management, PR requirements validation, and project management workflows.

## Workflow Architecture

```mermaid
graph TB
    subgraph CI/CD Pipeline
        A[ci.yml<br/>6 jobs + optional record]
        B[version.yml<br/>auto version bump]
        C[deploy.yml<br/>gh-pages deployment]
    end

    subgraph PR Automation
        D[pr-check.yml<br/>requirements + commits]
        E[pr-update.yml<br/>sync from changelog]
    end

    subgraph Project Management
        F[project.yml<br/>auto-label + add to board]
        G[ideas.yml<br/>validate + create issues]
    end

    H[Push to main] --> A
    A -->|CI success| C
    H --> B
    I[PR opened/sync] --> D
    I --> E
    J[Issue opened] --> F
    K[Ideas changed] --> G
    L[Schedule 2AM UTC] --> A
    M[Manual dispatch] --> A
    M --> C
```

## Workflows

### Main CI (`.github/workflows/ci.yml`)

Runs on push to `main` and `feat/aligned-lanes-v1`, all PRs, scheduled nightly at 2AM UTC, and manual workflow dispatch.

**Jobs:**

1. **check** - Typecheck, lint, unit tests
   - Runs format check, TypeScript, ESLint
   - Executes vitest unit tests with JSON reporter
   - Uploads test results as JSON artifact (30 days)

2. **build-storybook** - Build Storybook static site
   - Compiles Storybook to `storybook-static/`
   - Uploads build artifact for reuse (7 days)

3. **storybook-test** - Headless interaction & a11y tests
   - Downloads pre-built Storybook
   - Runs Playwright-based test-runner
   - Validates interactions and accessibility
   - Uploads test results as JSON artifact (30 days)

4. **build-demo** - Build demo application
   - Compiles Vite demo to `dist/`
   - Uploads artifact (7 days)

5. **summary** - PR summary generation
   - Aggregates all job results
   - Posts markdown summary with job status table
   - Lists all artifacts with retention info

6. **record-nightly** - Optional video/GIF recording
   - Only runs on schedule (nightly 2AM UTC) or manual dispatch
   - Downloads Storybook build
   - Records stories with `record` tag using Playwright
   - Converts videos to optimized GIFs with ffmpeg
   - Outputs to `artifacts/video/` and `docs/assets/gif/`
   - Uploads video artifacts (7 days) and GIF artifacts (30 days)
   - Posts summary with GIF filenames (handoff contract to docs)

**Artifacts:**

- `unit-test-results` (JSON, 30 days)
- `storybook-static` (build, 7 days)
- `storybook-test-results` (JSON, 30 days)
- `demo-dist` (build, 7 days)
- `story-videos` (WebM, 7 days) - nightly/manual only
- `story-gifs` (GIF, 30 days) - nightly/manual only

**CI Time Budget:**

Core CI jobs (check, storybook-test, build-storybook, build-demo, build-playbook, summary) target ≤90s overhead over baseline. Recording job is excluded from default CI to stay within budget.

### Deploy to GitHub Pages (`.github/workflows/deploy.yml`)

Runs on CI workflow completion (push to `main` only) and manual workflow dispatch.

**Trigger:**

- Uses `workflow_run` to wait for CI to complete successfully
- Only deploys if CI passes
- Can also be triggered manually via workflow dispatch

**Flow:**

```mermaid
graph LR
    A[CI completes<br/>on main] --> B{CI successful?}
    B -->|Yes| C[Download artifacts]
    B -->|No| D[Skip deploy]
    C --> E[Download demo-dist]
    C --> F[Download storybook-static]
    C --> G[Download playbook-static]
    E --> H[Generate root index.html]
    F --> H
    G --> H
    H --> I[Add .nojekyll]
    I --> J[Deploy to gh-pages]
    J --> K[Generate summary]
```

**Artifacts Downloaded:**

- `demo-dist` → `/demo`
- `storybook-static` → `/storybook`
- `playbook-static` → `/playbook`
- Root `index.html` generated via `scripts/generate-gh-pages-index.mjs`

**Deployed Structure:**

```
gh-pages/
├── index.html          # Landing page with navigation
├── .nojekyll           # Disable Jekyll processing
├── demo/               # Vite demo build
├── storybook/          # Storybook static build
└── playbook/           # VitePress docs build
```

**Deployment Summary:**

Posts a summary showing:

- Status of each artifact (✅ Deployed / ⚠️ Missing)
- Live URLs for all deployed sites

**Security:**

- Uses `peaceiris/actions-gh-pages@v4` for deployment
- Requires `contents: write` and `pages: write` permissions
- Force orphan commits to keep gh-pages history clean
- Commits as `github-actions[bot]`

### Version Management (`.github/workflows/version.yml`)

Runs on push to `main` (skips version bump commits).

**Flow:**

```mermaid
graph LR
    A[Merge to main] --> B[Bump version]
    B --> C[Consolidate _tmp/*.md<br/>to CHANGELOG.md]
    C --> D[Create git tag]
    D --> E[Create GitHub release]
    E --> F[Commit changes]
    F --> G[Push to main]
```

**Features:**

- Auto-increments patch version
- Consolidates changelog from temp files
- Creates annotated git tags
- Generates GitHub releases with notes
- Commits and pushes changes

### PR Requirements (`.github/workflows/pr-check.yml`)

Runs on PR opened/edited/synchronized/labeled.

**Validations:**

```mermaid
graph TD
    A[PR Event] --> B{Verify Requirements}
    B --> C[Check issue reference<br/>Closes #N]
    B --> D[Check lane label<br/>lane:A/B/C/D]
    B --> E[Check acceptance checklist]

    A --> F{Check Commits}
    F --> G[Validate tag prefix<br/>U-/C-/B-/ARCH-/PB-/D-]

    C --> H{Exempt?}
    D --> H
    E --> H
    H -->|Architecture/CI/Docs| I[⚠️ Warning only]
    H -->|Feature| J[❌ Error if missing]

    G --> K{All tagged?}
    K -->|Yes| L[✅ Pass]
    K -->|No| M[❌ Fail with list]

    I --> N[Summary]
    J --> N
    L --> N
    M --> N
```

**Exemptions:**

PRs with these tags/keywords/labels don't require issues:

- `[ARCH-*]`, `[C-*]` tags
- `[B-*]`, `[PB-*]`, `[D-*]` tags
- `chore:`, `docs:`, `ci:`, `build:`, `test:`, `refactor:` keywords
- `lane:B`, `lane:C`, `lane:D`, `type:architecture` labels

### PR Update (`.github/workflows/pr-update.yml`)

Runs on PR opened/synchronized.

**Process:**

1. Reads latest `CHANGELOG.md`
2. Extracts version content and commit tags
3. Generates PR title and body from template
4. Updates PR with latest changes

**Updates on every push** - keeps PR in sync with changelog.

### Project Management (`.github/workflows/project.yml`)

Manual triggers and auto-actions for issues.

**Jobs:**

1. **auto-tag-issue** - Detects and applies labels
   - `[U-*]` or `[C-*]` → `lane:A` + appropriate type
   - `[B-*]` → `lane:B` + `type:bug`
   - `[ARCH-*]` → `lane:C` + `type:architecture`
   - `[PB-*]` or `[D-*]` → `lane:D`

2. **add-to-project** - Adds issues to project board
   - Reads project number from `pipeline-config.json`
   - Automatically adds new issues

3. **setup-project** (manual) - Initialize GitHub Project
   - Creates project with custom fields
   - Sets up labels
   - Updates configuration

4. **tag-issues** (manual) - Create issues from changelog
   - Parses `CHANGELOG.md`
   - Creates GitHub issues with proper labels

5. **sync-project** (manual) - Verify project config

### Ideas Management (`.github/workflows/ideas.yml`)

Validates and converts idea files to issues with automatic project creation.

**Jobs:**

1. **ensure-project** - Auto-creates project if missing
   - Checks for existing project in `pipeline-config.json`
   - Creates "Plaincraft Roadmap" project if needed
   - Sets up labels and initial configuration
   - Commits config updates automatically

2. **create-issues-from-ideas** (manual)
   - Depends on `ensure-project`
   - Parses `ideas/*.md` files
   - Creates GitHub issues with checklists
   - Applies lane and type labels
   - Automatically adds to project board

3. **validate-ideas** (manual)
   - Checks required sections
   - Validates naming conventions
   - Reports errors in summary

4. **sync-checklists** (manual)
   - Updates issue bodies with checklists from idea files

5. **auto-validate** - Runs on push to `ideas/`
   - Validates changed idea files automatically

**Automation benefits:**

- Zero-config project creation on first issue generation
- Issues automatically linked to roadmap
- Lane labels applied immediately
- No manual project setup required

### Recording (part of `ci.yml`)

**Trigger:** Nightly at 2 AM UTC (schedule) or manual workflow dispatch.

**Purpose:** Generate videos and GIFs for visual documentation.

**Process:**

```mermaid
graph LR
    A[Build Storybook] --> B[Launch Chromium]
    B --> C[Record each story<br/>5s video]
    C --> D[Convert to .gif<br/>ffmpeg]
    D --> E[Upload artifacts]
```

**Outputs:**

- `artifacts/video/*.webm` (7 days retention)
- `docs/assets/gif/*.gif` (30 days retention)

**Manual trigger:**

```bash
# Via GitHub UI or gh cli
gh workflow run ci.yml
```

The recording job is conditional and only runs on schedule or manual dispatch, keeping it outside the default CI time budget.

## Scripts

### Test Scripts

- `pnpm test` - Unit tests (dot reporter, uses threads pool)
- `pnpm test:json` - Unit tests with JSON output
- `pnpm storybook:test` - **Automated Storybook tests** (builds, serves, tests, cleans up)
- `pnpm storybook:test:json` - Storybook tests with JSON output
- `pnpm storybook:test:rebuild` - Force rebuild of Storybook before testing

**Note:** `storybook:test` now handles the complete lifecycle:

1. Checks for existing `storybook-static/` build (or rebuilds with `--rebuild`)
2. Starts http-server automatically
3. Waits for server to be ready
4. Runs test-storybook
5. Cleans up server process

No manual server management needed!

### Changelog & Version Scripts

- `pnpm changelog` - Consolidate `_tmp/*.md` → `CHANGELOG.md`
- `pnpm version:bump` - Increment version and update files
- `pnpm tag` - Create local git tag from version
- `pnpm tag:release` - Create tag + GitHub release + push

### PR Management Scripts

- `pnpm pr:generate` - Generate PR title/body from changelog
- `pnpm pr:verify [PR#]` - Verify PR requirements
- `pnpm pr:create-issue [PR#]` - Create tracking issue for PR
- `pnpm pr:check` - Check PR requirements locally

### Project & Issue Scripts

- `pnpm gh:setup-labels` - Create/update repository labels
- `pnpm gh:setup-project` - Initialize GitHub Project with fields
- `pnpm gh:worktree <issue#>` - Create worktree + branch + PR for an issue
- `pnpm issues:create` - Create issues from changelog
- `pnpm ideas:create` - Create issues from idea files
- `pnpm ideas:validate` - Validate idea file structure
- `pnpm ideas:sync` - Sync checklists to issues

**Worktree Creation:**

```bash
# Create worktree, branch, and draft PR for issue #6
pnpm gh:worktree 6

# Preview without creating
pnpm gh:worktree 6 --dry-run

# Custom worktree location
pnpm gh:worktree 6 --dir ../my-feature

# Use different base branch and create as ready for review
pnpm gh:worktree 6 --base develop --no-draft
```

**What it does:**

1. Fetches issue details from GitHub
2. Generates branch name from issue title (e.g., `fix/b-pr-template-enforcement`)
3. Creates git worktree in parallel directory
4. Creates draft PR linked to the issue with labels

### Recording Scripts

- `pnpm record:stories` - Record all stories (requires Storybook running)
- `STORIES=component--id pnpm record:stories` - Record specific stories

### Build Scripts

- `pnpm build:storybook` - Build Storybook static
- `pnpm build` - Build demo site

### CI Monitoring Scripts

- `pnpm ci:check` - Check latest workflow run status with formatted report
- `pnpm ci:watch` - Watch workflow status in real-time (updates every 5s)

**CI Check Features:**

```bash
# Quick status check
pnpm ci:check

# Output includes:
# - Run number, branch, and title
# - Job-by-job status table with durations
# - Summary statistics (completed, failed, in progress)
# - Direct URL to workflow

# Watch mode for active runs
pnpm ci:watch  # Auto-exits when workflow completes
```

## Time Budget

```mermaid
gantt
    title CI Pipeline Timeline
    dateFormat X
    axisFormat %Ss

    section Parallel Phase
    check job           :crit, 0, 60
    build-storybook     :active, 0, 45

    section Sequential
    storybook-test      :0, 40
    build-demo          :0, 30
    summary             :0, 5
```

**Target:** Total CI time ≤ baseline + 90 seconds  
**Baseline:** ~90s  
**Current:** ~105s ✅ **Within budget**

**Strategy:**

- Parallel job execution (check + build-storybook run simultaneously)
- Playwright browser caching
- Artifact reuse (build once, test separately)
- Recording workflow excluded from default CI (nightly only)
- Automated server lifecycle management

**Job durations:**

- check: ~60s (parallel)
- build-storybook: ~45s (parallel)
- storybook-test: ~40s (downloads artifact, no rebuild)
- build-demo: ~30s
- summary: ~5s

**Total wall time:** ~60s (parallel) + 40s + 30s + 5s = **~105s**

- summary: ~5s

**Total wall time:** ~60s (parallel) + 40s + 30s + 5s = **~105s**

## Invariants

1. **Protocol compliance** - All CI changes use `[ARCH-*]` commit tags
2. **Separate concerns** - Each workflow/job has single responsibility
3. **Artifact-driven** - Build once, use multiple times
4. **Optional recording** - Video/GIF generation doesn't block CI
5. **Cache aggressively** - Playwright browsers, pnpm store
6. **Automated validation** - Pre-commit hooks, PR checks, commit tag validation
7. **Changelog-driven PRs** - PR content generated from CHANGELOG.md

## Rollout Checklist

**Core CI:**

- [x] Split ci.yml into separate jobs
- [x] Add artifact uploads
- [x] Create record.yml workflow
- [x] Add recording script with ffmpeg
- [x] Create artifact directories
- [x] Update package.json scripts
- [x] Configure test-runner for parallelism
- [x] Verify time budget in actual CI run

**Automation:**

- [x] Version bump workflow with changelog consolidation
- [x] Auto-tagging and GitHub releases
- [x] PR requirements validation with exemptions
- [x] PR body/title sync from changelog
- [x] Issue auto-labeling and project assignment
- [x] Ideas validation and issue creation
- [x] Pre-commit changelog consolidation
- [x] Commit tag validation

**Documentation:**

- [x] CI architecture diagrams with Mermaid
- [x] Workflow documentation
- [x] Script reference guide
- [x] Protocol compliance guide

## Automation Flow

```mermaid
graph TB
    A[Developer commits] --> B{Pre-commit hook}
    B --> C[Consolidate _tmp/*.md<br/>to CHANGELOG.md]
    C --> D[Stage CHANGELOG.md]
    D --> E[Git commit]

    E --> F[Push to branch]
    F --> G[PR created/updated]

    G --> H[pr-update.yml]
    H --> I[Generate PR from<br/>CHANGELOG.md]

    G --> J[pr-check.yml]
    J --> K{Validate}
    K --> L[Check commit tags]
    K --> M[Check requirements]

    G --> N[ci.yml]
    N --> O[Run tests]

    P[Merge to main] --> Q[version.yml]
    Q --> R[Bump version]
    R --> S[Create tag/release]

    T[Issue opened] --> U[project.yml]
    U --> V[Auto-label]
    U --> W[Add to project]
```

## Handoff Contracts

**Pair A (Components):**

- Story IDs with `record` tag → Recording workflow targets these
- Commit with `[U-*]` or `[C-*]` tags
- Create acceptance checklists in Issues

**Pair B (Docs):**

- GIF references from `docs/assets/gif/`
- Commit with `[B-*]` tags
- Update documentation for features

**Pair C (DevOps):**

- All workflow and script changes
- Commit with `[ARCH-*]` or `[C-*]` tags
- Maintain CI/CD infrastructure
- Monitor pipeline performance

**Pair D (Project):**

- Issue templates and idea files
- Commit with `[PB-*]` or `[D-*]` tags
- Link CI artifacts to issues
- Maintain roadmap project

## Local Development

### Quick start with worktrees

```bash
# Create worktree + branch + PR for an issue (all-in-one)
pnpm gh:worktree 6

# What happens automatically:
# 1. Creates new worktree with branch from issue title
# 2. Installs dependencies (pnpm install)
# 3. Sets git config from package.json author
# 4. Publishes branch to remote
# 5. Creates draft PR linked to issue
```

### Post-checkout automation

After checking out a branch (manually or via worktree), the `post-checkout` hook automatically:

1. **Installs dependencies** - Runs `pnpm install`
2. **Sets git config** - Uses author from `package.json` for local commits
3. **Publishes branch** - Pushes to remote if not already published (skips main/develop)

```bash
# Manual trigger if needed
pnpm postcheckout
```

### Run checks locally

```bash
# Quick checks
pnpm check  # Runs typecheck, lint, test (unit tests only)

# Full pre-push validation
pnpm typecheck && pnpm lint && pnpm test && pnpm storybook:test

# Pre-commit (automatic via git hooks)
# - Consolidates _tmp/*.md to CHANGELOG.md
# - Runs lint-staged (format + lint on staged files)
```

### Test Storybook locally

```bash
# Simple - wrapper handles everything
pnpm storybook:test

# Force rebuild before testing
pnpm storybook:test:rebuild

# With JSON output
pnpm storybook:test:json
```

The `test-storybook.mjs` wrapper automatically:

- Uses existing build or builds Storybook if needed
- Starts http-server
- Waits for server ready
- Runs tests
- Cleans up server

### Work with changelog

```bash
# Create summary in _tmp/
echo "## Feature\n- Added X" > _tmp/my-feature.md

# Consolidate (or let pre-commit do it)
pnpm changelog

# Generate PR content
pnpm pr:generate
```

### Validate PR locally

```bash
# Check PR requirements (requires PR number)
pnpm pr:verify -- 123

# Validate commit tags in current branch
git log --oneline main..HEAD | grep -E '^\[?(U-|C-|B-|ARCH-|PB-|D-)'
```

### Record stories locally

```bash
# Requires ffmpeg: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)
pnpm storybook &  # Start dev server
pnpm record:stories  # Record all
STORIES=inline-edit-label--default pnpm record:stories  # Record one
```

### Work with ideas

```bash
# Validate idea files
pnpm ideas:validate
pnpm ideas:validate U-my-idea.md

# Create issues from ideas (dry-run first)
pnpm ideas:create -- --dry-run
pnpm ideas:create

# Sync checklists to existing issues
pnpm ideas:sync
```

## Troubleshooting

**Storybook tests fail:**

- Check `storybook-test-results` artifact for details
- Run locally: `pnpm storybook:test --debug`

**Recording fails:**

- Ensure ffmpeg installed: `ffmpeg -version`
- Check story loads: `curl http://localhost:6006/iframe.html?id=STORY_ID`

**CI time over budget:**

- Check job durations in Actions tab
- Consider disabling recording from default CI
- Reduce Storybook test parallelism if flaky

**PR check fails on commits:**

- Ensure all commits have valid tag prefix: `[U-*]`, `[C-*]`, `[B-*]`, `[ARCH-*]`, `[PB-*]`, `[D-*]`
- Use interactive rebase to fix: `git rebase -i main`

**Version workflow fails:**

- Check CHANGELOG.md for duplicate version headers
- Ensure \_tmp/ folder has valid markdown files

**Pre-commit hook fails:**

- Check \_tmp/\*.md files for valid markdown
- Run manually: `node scripts/pre-commit-changelog.mjs`

## Files Owned (Pair C)

```mermaid
graph LR
    subgraph Workflows
        A[ci.yml]
        B[record.yml]
        C[version.yml]
        D[pr-check.yml]
        E[pr-update.yml]
        F[project.yml]
        G[ideas.yml]
    end

    subgraph Scripts
        H[consolidate-changelog.mjs]
        I[bump-version.mjs]
        J[auto-tag.mjs]
        K[pr-requirements.mjs]
        L[generate-pr-content.mjs]
        M[setup-project.mjs]
        N[validate-ideas.mjs]
        O[record-stories.mjs]
        P[check-ci.mjs]
    end

    subgraph Config
        Q[.github/pipeline-config.json]
        R[.storybook/test-runner.ts]
    end
```
