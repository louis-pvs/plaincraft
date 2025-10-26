# Changelog

All notable changes live here. Follow the [changelog guide](guides/CHANGELOG-GUIDE.md) for structure and authoring notes.

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
