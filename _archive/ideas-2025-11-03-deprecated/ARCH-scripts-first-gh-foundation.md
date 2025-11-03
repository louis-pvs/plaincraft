# ARCH-scripts-first-gh-foundation

Lane: A (Foundations & Tooling)
Issue: 98

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Labels:** scripts-first, gh-lib, lifecycle

## Purpose

Ship the reusable GitHub and Git helpers that power the Scripts-First Lifecycle v3
so every other lane can rely on a stable, authenticated core to drive intake,
branching, and reconciliation.

## Problem

The lifecycle v3 plan assumes `_lib/gh.mjs`, `_lib/projects.mjs`, `_lib/git.mjs`,
and `_lib/id.mjs` exist with predictable behavior. Today those modules are
sketches scattered across older automation experiments. Without hardened,
versioned foundations:

- Ops scripts reimplement GitHub calls ad-hoc and break on auth or pagination.
- Branch creation and commit guardrails drift because helpers disagree on ID
  parsing/validation.
- Downstream lanes (B, C, D) cannot trust Project updates or branch state, so
  the “Projects is status-SoT” rule collapses.

## Proposal

1. Stand up the `_lib` modules with strong typing, retries, and Corepack-aware
   CLI ergonomics (`--dry-run` by default, `--yes` for mutations).
2. Add idempotent smoke/spec coverage for each helper (Octokit mocks, git
   fixtures) and wire them into `pnpm scripts:test` + `scripts:smoke`.
3. Publish a developer README describing the helper APIs, auth expectations, and
   extension points for future ops scripts.
4. Seed sample usage across `ops/idea-intake.mjs` and `ops/create-branch.mjs`
   so other lanes inherit the contract instantly.

## Acceptance Checklist

- [ ] `_lib/gh.mjs`, `_lib/projects.mjs`, `_lib/git.mjs`, and `_lib/id.mjs`
      implemented with documented exports and retry/auth guardrails.
- [ ] New unit and smoke tests cover GitHub pagination, ID validation, and git
      branch creation helpers.
- [ ] Developer README added under `scripts/_lib/` (or updated) outlining helper
      usage and env requirements.
- [ ] `ops/idea-intake.mjs` and `ops/create-branch.mjs` refactored to use the
      new helpers without local wrappers.
- [ ] Corepack-driven workflows verified on a clean clone under 10 minutes
      (`pnpm install`, targeted script run, tests).
