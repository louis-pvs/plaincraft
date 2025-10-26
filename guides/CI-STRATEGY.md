# CI Strategy

## Overview

Split CI pipeline with parallel jobs, headless Storybook testing, and optional recording workflow for video/GIF generation.

## Workflows

### Main CI (`.github/workflows/ci.yml`)

Runs on push to `main` and `feat/aligned-lanes-v1`, plus all PRs.

**Jobs:**

1. **check** - Typecheck, lint, unit tests
   - Runs format check, TypeScript, ESLint
   - Executes vitest unit tests
   - Uploads test results as JSON artifact

2. **build-storybook** - Build Storybook static site
   - Compiles Storybook to `storybook-static/`
   - Uploads build artifact for reuse

3. **storybook-test** - Headless interaction & a11y tests
   - Downloads pre-built Storybook
   - Runs Playwright-based test-runner
   - Validates interactions and accessibility
   - Uploads test results

4. **build-demo** - Build demo application
   - Compiles Vite demo to `dist/`
   - Uploads artifact

5. **summary** - PR summary generation
   - Aggregates all job results
   - Posts markdown summary to PR

**Artifacts:**

- `unit-test-results` (JSON, 30 days)
- `storybook-static` (build, 7 days)
- `storybook-test-results` (JSON, 30 days)
- `demo-dist` (build, 7 days)

### Recording Workflow (`.github/workflows/record.yml`)

Nightly at 2 AM UTC or manual trigger via workflow_dispatch.

**Purpose:** Generate videos and GIFs for visual documentation.

**Process:**

1. Build Storybook
2. Launch headless Chromium with video recording
3. Visit each story, record 5-second interaction
4. Convert `.webm` videos to optimized `.gif` using ffmpeg
5. Upload artifacts

**Outputs:**

- `artifacts/video/*.webm` (7 days retention)
- `docs/assets/gif/*.gif` (30 days retention)

**Manual trigger:**

```bash
# Via GitHub UI or gh cli
gh workflow run record.yml -f stories=component--story-id
gh workflow run record.yml -f stories=all
```

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

**Target:** Total CI time ≤ baseline + 90 seconds

**Strategy:**

- Parallel job execution (check + build-storybook run simultaneously)
- Playwright browser caching
- Artifact reuse (build once, test separately)
- Recording workflow excluded from default CI (nightly only)

**Expected timeline:**

- check: ~60s
- build-storybook: ~45s
- storybook-test: ~40s (downloads artifact, no rebuild)
- build-demo: ~30s
- summary: ~5s

Total wall time: ~60s (parallel) + 40s (sequential) = **~100s** (within budget)

## Invariants

1. **No component code changes** - Only CI/workflow files modified
2. **Separate concerns** - Each job has single responsibility
3. **Artifact-driven** - Build once, use multiple times
4. **Optional recording** - Video/GIF generation doesn't block CI
5. **Cache aggressively** - Playwright browsers, pnpm store

## Rollout Checklist

- [x] Split ci.yml into separate jobs
- [x] Add artifact uploads
- [x] Create record.yml workflow
- [x] Add recording script with ffmpeg
- [x] Create artifact directories
- [x] Update package.json scripts
- [x] Configure test-runner for parallelism
- [ ] Verify time budget in actual CI run
- [ ] Generate first set of GIFs via manual trigger
- [ ] Update docs to reference GIF locations

## Handoff Contracts

**From Pair A (component work):**

- Story IDs with `record` tag → Recording workflow targets these

**To Pair B (docs):**

- Final GIF filenames in `docs/assets/gif/` → Link from documentation pages

**To Pair D (project management):**

- CI test artifacts → Link to issues for debugging

## Local Development

### Run checks locally

```bash
pnpm check  # Runs typecheck, lint, test (unit tests only)
pnpm typecheck && pnpm lint && pnpm test && pnpm storybook:test  # Full pre-push
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

**Old manual way (no longer needed):**

```bash
# This is now handled automatically by pnpm storybook:test
pnpm build:storybook
pnpm dlx http-server storybook-static --port 6006 &
pnpm storybook:test
```

### Record stories locally

```bash
# Requires ffmpeg: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)
pnpm storybook &  # Start dev server
pnpm record:stories  # Record all
STORIES=inline-edit-label--default pnpm record:stories  # Record one
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

## Files Owned (Pair C)

```
.github/workflows/
  ci.yml          # Main CI pipeline
  record.yml      # Nightly recording workflow
scripts/
  record-stories.mjs  # Video recording + GIF conversion
artifacts/
  video/          # Output directory (gitignored)
docs/assets/gif/  # GIF output (gitignored, committed selectively)
.storybook/
  test-runner.ts  # Storybook test configuration
```
