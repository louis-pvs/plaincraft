# Integration Window Commands

Quick reference for scheduled integration windows (:00 and :30).

## Pre-Push Checks (Required)

```bash
# Run the full check suite (RECOMMENDED)
pnpm typecheck && pnpm lint && pnpm test && pnpm storybook:test

# Note: pnpm check only runs unit tests, not Storybook tests
# For complete validation, use the full command above
```

**What each command does:**

- `pnpm typecheck` - TypeScript compilation check
- `pnpm lint` - ESLint validation
- `pnpm test` - Unit tests (now uses threads pool by default)
- `pnpm storybook:test` - **Automated** Storybook tests (builds, serves, tests, cleans up)

## Git Flow

```bash
# Always pull with rebase
git pull --rebase

# Commit with work ID prefix
git add .
git commit -m "[ARCH-ci] Split CI into parallel jobs, add recording workflow"

# Push only during integration windows (:00 or :30)
git push
```

## Post-Push Monitoring

```bash
# Watch CI status (if gh cli installed)
gh run watch

# Or view in browser
# Go to: https://github.com/louis-pvs/plaincraft/actions
```

## Manual Recording Trigger

```bash
# Trigger recording workflow for all stories
gh workflow run record.yml -f stories=all

# Trigger for specific stories
gh workflow run record.yml -f stories=inline-edit-label--default,inline-edit-label--editing

# Check recording workflow status
gh run list --workflow=record.yml
```

## Artifact Download

```bash
# List recent runs
gh run list --limit 5

# Download artifacts from a specific run
gh run download RUN_ID

# Or download via web UI:
# Actions > Select Run > Scroll to Artifacts > Download
```

## Local Recording Test (Optional)

```bash
# Install ffmpeg if not present
# macOS: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg

# Build Storybook (if not already built)
pnpm build:storybook

# Start Storybook dev server in background
pnpm storybook &
STORYBOOK_PID=$!

# Wait for server
sleep 5

# Record stories (wrapper handles server connection)
pnpm record:stories

# Stop Storybook
kill $STORYBOOK_PID

# Check outputs
ls -lh artifacts/video/
ls -lh docs/assets/gif/
```

## Automated Test Workflows

### Storybook Tests (No Manual Steps!)

```bash
# Simple - everything automated
pnpm storybook:test

# What it does automatically:
# 1. Checks for storybook-static/, builds if missing
# 2. Starts http-server on port 6006
# 3. Waits for server ready
# 4. Runs test-storybook
# 5. Cleans up server
```

### Unit Tests

```bash
# Standard run (uses threads pool)
pnpm test

# With JSON output for CI
pnpm test:json
```

## Troubleshooting

### CI fails on storybook-test

```bash
# Run locally to debug (now fully automated)
pnpm storybook:test

# Force rebuild if stale
pnpm storybook:test:rebuild

# Old manual way (no longer needed):
# pnpm build:storybook
# pnpm dlx http-server storybook-static --port 6006 &
# pnpm storybook:test
```

### Recording fails locally

```bash
# Check ffmpeg
ffmpeg -version

# Check Storybook is running
curl http://localhost:6006/iframe.html?id=inline-edit-label--default

# Run with verbose Playwright logs
DEBUG=pw:api pnpm record:stories
```

### Time budget exceeded

```bash
# Check individual job times in GitHub Actions UI
# If over budget, consider:
# 1. Reduce storybook-test parallelism in .storybook/test-runner.ts
# 2. Remove recording from default CI (already done - it's nightly only)
# 3. Optimize dependency installation
```

## Integration Window Protocol

**10 minutes before window:**

1. Pull latest: `git pull --rebase`
2. Run checks: `pnpm check`
3. Stage changes: `git add .`
4. Commit with tag: `git commit -m "[ARCH-ci] ..."`

**At window time (:00 or :30):**

1. Final pull: `git pull --rebase`
2. Push: `git push`
3. Watch CI: `gh run watch`

**If CI red:**

1. Check logs in Actions UI
2. Fix locally
3. Wait for next window
4. Repeat

**If green:**

1. ✅ Done
2. Update `CHANGELOG-ci.md` if needed
3. Notify team in chat

## Emergency Hotfix

If critical CI issue blocks everyone:

1. Announce in chat: "Hotfix window - 30 min"
2. Fix the issue
3. Push alone: `git push`
4. Resume normal integration windows after fix confirmed

## Pair C Responsibilities

During integration windows:

- Monitor CI status
- Debug workflow failures
- Coordinate on `package.json` or `pnpm-lock.yaml` changes
- Manage CI time budget
- Generate GIFs via recording workflow as needed

---

**Remember:** Only push GREEN at integration windows (:00 and :30).
