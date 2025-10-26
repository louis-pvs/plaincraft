# Changelog

All notable changes live here. Follow the [changelog guide](guides/CHANGELOG-GUIDE.md) for structure and authoring notes.

## [0.1.0] - 2025-10-26

### Key Changes

- Split `.github/workflows/ci.yml` into dedicated `check`, `build-storybook`, `storybook-test`, `build-demo`, and `summary` jobs, adding nightly story recording support.
- Added helper scripts for Storybook (`test-storybook.mjs`), recording (`record-stories.mjs`), and workflow monitoring (`check-ci.mjs`), plus centralized pipeline metadata in `.github/pipeline-config.json`.
- Standardised ticket hygiene: enforced Unit/Composition/Bug templates, lane-scoped project views with WIP 3, and PR requirements that demand ticket IDs, lane labels, and acceptance checklists.

### Notes

- Local timings (Node 22.15.1): typecheck 7.3 s, lint 3.3 s, test 1.5 s, storybook:test 6.9 s (cached), fresh Storybook build 20.4 s.
- Replace these with CI timings after the first pipeline run and ensure `pnpm ci:check --watch` reports green before rollout.
