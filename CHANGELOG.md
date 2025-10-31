# Changelog

All notable changes live here. Follow the [changelog guide](guides/CHANGELOG-GUIDE.md) for structure and authoring notes.

## [0.13.0] - 2025-10-31

## [0.12.0] - 2025-10-31

## [0.11.0] - 2025-10-31

## [0.4.0] - 2025-10-27

### Changes

### [ARCH-worktree-prep-commit] Bootstrap commit automation for worktree script

**Type**: Architecture improvement  
**Lane**: C  
**Related**: Issue #23

#### Summary

Enhanced `pnpm gh:worktree` script to automatically create a bootstrap commit when no commits exist on the branch, ensuring PR creation succeeds immediately without manual intervention.

#### Changes

**Script Updates (`scripts/create-worktree-pr.mjs`)**:

- Added `createBootstrapCommit()` function that creates `.worktree-bootstrap.md` with metadata
- Automatically stages and commits bootstrap file when branch has no commits
- Bootstrap commit includes `[skip ci]` flag to avoid unnecessary CI runs
- Added `--no-bootstrap` flag to opt out of automatic commit behavior
- Bootstrap file includes timestamp, issue reference, and instructions for cleanup

**Documentation Updates**:

- Updated `SCRIPTS-REFERENCE.md` with bootstrap commit behavior documentation
- Added `--no-bootstrap` usage example
- Documented cleanup/amend workflow for bootstrap commits

**Script Compatibility (`scripts/ideas-to-issues.mjs`)**:

- Added support for `ARCH-` and `PB-` prefixes in idea file processing
- Enables architecture and playbook ideas to be converted to issues automatically

#### Impact

- **Developer Experience**: Eliminates the manual step of creating an initial commit before PR creation
- **Workflow Efficiency**: Worktree script now completes end-to-end without interruption
- **Flexibility**: Opt-out flag preserves manual workflow option for teams that prefer it
- **Dogfooding**: Validates the improved script immediately for this feature implementation

#### Testing

- Bootstrap commit creation tested with new worktree flows
- Graceful degradation verified when bootstrap creation fails
- `--no-bootstrap` flag behavior confirmed
- Linting passes for all modified scripts

## [0.3.0] - 2025-10-26

### [ARCH-ideas-pipeline] Automated project creation for ideas workflow

## Changes

- Added `ensure-project` job to `.github/workflows/ideas.yml`
- Auto-detects missing or invalid project configuration
- Creates "Plaincraft Roadmap" project automatically when needed
- Commits `pipeline-config.json` updates with `[skip ci]`
- Updated CI-STRATEGY.md with automation documentation

## Benefits

- Zero-config project setup for new repos
- Self-healing if project gets deleted
- Eliminates manual `gh:setup-project` step
- Issues from ideas always added to project board

## Technical Details

The `ensure-project` job runs before `create-issues-from-ideas` and:

1. Checks for existing project in config
2. Verifies project still exists in GitHub
3. Runs `setup-project.mjs` if needed
4. Outputs project existence status to dependent jobs

Project creation is idempotent and reuses the same script as manual workflows.

Closes #19

### [ARCH-worktree-pr-fix] Fix worktree script PR creation failures

## Changes

- Added `hasCommitsForPR()` function to detect commits before PR creation
- Changed PR body handling from inline escaping to file-based approach
- Added graceful skip when branch has no commits
- Improved error messages and user guidance
- Added `writeFile` import to support temp file creation

## Benefits

- No confusing errors when creating worktrees for new issues
- Reliable PR body handling for complex markdown content
- Clear instructions shown when PR can't be created yet
- Better developer experience for common workflow

## Technical Details

The script now:

1. Creates worktree and branch successfully
2. Checks commit count with `git rev-list --count`
3. Skips PR creation gracefully if no commits exist
4. Shows helpful next steps: `gh pr create --fill --draft`
5. Uses temp file for PR body to avoid escaping issues

This fixes the `GraphQL: No commits between main and <branch>` error that was misleading users when the worktree/branch creation actually succeeded.

Closes #20

## [0.2.0] - 2025-10-26

### [B-pr-template-enforcement] PR template compliance gaps

- Auto-extract ticket ID from changelog bullet tags and auto-generate `Closes #N` by searching GitHub issues
- Fetch and copy acceptance checklist from linked issue to pre-populate PR body
- Generate concise scope summary showing complete first sentence instead of truncated text
- Pre-check "Closes #N" checkbox and populate ticket ID field when issue is found
- Detect lane label from tag prefix (U→A, B→B, C/ARCH→C, D/PB→D)
- Add unit tests for ticket ID extraction, lane detection, and scope summary generation

## [0.1.0] - 2025-10-26

### Highlights

- [ARCH-ci] Split `.github/workflows/ci.yml` into dedicated `check`, `build-storybook`, `storybook-test`, `build-demo`, and `summary` jobs to tighten feedback loops.
- [ARCH-ci] Added nightly/manual recording workflow (`record.yml`) with supporting scripts (`scripts/record-stories.mjs`, `scripts/test-storybook.mjs`).
- [PB-roadmap] Standardised ticket hygiene across Unit/Composition/Bug issues and enforced lane-scoped project views with WIP 3.

### Tooling & Commands

- [ARCH-ci] Vitest now defaults to the `threads` pool (`pnpm test` runs without overrides).
- [ARCH-ci] Storybook testing consolidated behind `pnpm storybook:test` / `pnpm storybook:test:json`.
- [ARCH-ci] Workflow monitor available via `pnpm ci:check` / `node scripts/check-ci.mjs`.
- [ARCH-ci] Centralised metadata lives in `.github/pipeline-config.json` for CI, scripts, and automation.

### Issue & Project Compliance

- [PB-roadmap] Issue templates require ticket IDs, lane labels, and acceptance checklists so items integrate with the Plaincraft Roadmap project.
- [PB-roadmap] Project views per lane enforce WIP limit 3; automation applies `lane:*` labels and blocks merges without a `Closes #…` reference.
- [PB-roadmap] PR template requires the ticket ID prefix, lane label confirmation, and pasted acceptance checklist.

### Local Timing Snapshot (Node 22.15.1)

- `pnpm typecheck`: 7.3 s
- `pnpm lint`: 3.3 s
- `pnpm test`: 1.5 s (18 tests)
- `pnpm storybook:test`: 6.9 s (cached build)
- Fresh Storybook build (`pnpm build:storybook`): 20.4 s

### Rollout Notes

- Replace the local timings with actual CI numbers after the first pipeline run.
- Use `pnpm ci:check --watch` during integration windows to track job status.
- Nightly recording stays opt-in; trigger `gh workflow run record.yml -f stories=all` when validating GIF output.
