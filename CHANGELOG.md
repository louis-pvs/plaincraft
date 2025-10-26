# Changelog

All notable changes to this project will be documented in this file. Follow the
[changelog convention guide](guides/CHANGELOG-COMPLIANCE.md) for structure and content.

## [0.1.0] - 2025-10-26

### [ARCH-ci] Test PR Template Integration

This tests that the PR generation respects the template structure.

## Features

- Integrates with PR template sections
- Auto-fills lane label based on commit tag
- Preserves template structure for manual completion

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
