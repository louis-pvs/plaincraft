# [ARCH-ci] CI Pipeline Refresh (2025-10-26)

## Highlights

- Split `.github/workflows/ci.yml` into five focused jobs (`check`, `build-storybook`, `storybook-test`, `build-demo`, `summary`) with concurrency control and artifact reuse.
- Introduced nightly/manual recording workflow (`record.yml`) plus `scripts/record-stories.mjs` to capture `.webm`/`.gif` assets for docs.
- Automated Storybook verification through `scripts/test-storybook.mjs`, which builds when required, serves via an internal Node static server, and cleans up reliably.
- Switched Vitest to the `threads` pool so `pnpm test` runs without CLI overrides.
- Added `scripts/check-ci.mjs` to query or watch GitHub workflow runs (`node scripts/check-ci.mjs --watch`) for status dashboards.

## Tooling & Commands

- `pnpm typecheck && pnpm lint && pnpm test && pnpm storybook:test` — pre-push suite (storybook script handles build/serve/test).
- `pnpm storybook:test:json` — JSON artifacts for CI summary.
- `pnpm record:stories` / `STORIES=component--story pnpm record:stories` — generate media for docs.
- `node scripts/check-ci.mjs [--watch|--run-id=<id>]` — monitor workflow progress from the CLI.

## Local Timing Snapshot (Node 22.15.1, pnpm 9.0.0)

- `pnpm typecheck`: 7.3 s
- `pnpm lint`: 3.3 s
- `pnpm test`: 1.5 s (18 tests)
- `pnpm storybook:test`: 6.9 s with cached `storybook-static/`
- Fresh Storybook build (`pnpm build:storybook`): 20.4 s → inherited by `storybook:test --rebuild`

## Rollout Notes

- Monitor first CI run to record actual job durations and replace the local snapshot above.
- Use `node scripts/check-ci.mjs --watch` during integration windows to track job completion and surface failures quickly.
- Nightly recording stays opt-in; trigger manually (`gh workflow run record.yml -f stories=all`) to validate GIF output before documentation updates.
