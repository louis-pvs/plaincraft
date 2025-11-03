# U-vitest-coverage-alignment

Lane: C

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** testing, tooling, devx

## Contracts

- Keep coverage tooling compatible with the current Vitest major so `pnpm vitest --coverage` remains stable across local and CI runs.
- Ensure peer dependency alignment between `@vitest/coverage-v8` and `vitest`.
- Provide a documented path for future major upgrades.

## Props + Shape

- `dependencies.vitest` (semver string) — current runner version that must stay aligned with coverage tooling.
- `devDependencies["@vitest/coverage-v8"]` (semver string) — reporter dependency to match the Vitest major.
- `pnpm-lock.yaml` (lockfile) — verifies the resolved versions and absence of peer warnings.

## Behaviors

- Detect mismatched coverage/runner versions during audits.
- Downgrade or upgrade the coverage reporter to match the installed Vitest major.
- Run coverage locally/CI to confirm the alignment before closing the unit.

## Purpose

Prevent coverage runs from breaking by ensuring the V8 coverage reporter and core Vitest runner stay on matching major versions.

## Problem

The project upgraded `@vitest/coverage-v8` to `^4.0.4` while `vitest` is still pinned to `2.1.4`. The coverage plugin declares `peerDependencies: vitest@4.0.4`, so pnpm installs an incompatible reporter that expects the Vitest 4 API. Running `pnpm vitest --coverage` now emits peer warnings and can fail once the reporter calls unsupported hooks, creating CI instability and developer friction.

## Proposal

1. **Short term:** Downgrade `@vitest/coverage-v8` to the latest `2.x` release that matches the current Vitest major, regenerate the lockfile, and verify coverage still works.
2. **Long term (optional):** Plan a controlled upgrade to Vitest 4 when we're ready for its breaking changes; update config, scripts, and tests accordingly.

## Acceptance Checklist

- [ ] `@vitest/coverage-v8` version aligned with installed Vitest major in `package.json`
- [ ] Lockfile regenerated without peer dependency warnings
- [ ] `pnpm vitest --coverage` passes locally
- [ ] CI coverage job (if any) passes without Vitest peer warnings
- [ ] Follow-up ticket (if needed) logged for eventual Vitest 4 migration

## Notes

- Impact: High for developers relying on coverage locally and in CI
- Effort: Low (dependency bump + lockfile regen + quick verification)
- Risk: Low once versions match; medium for future major upgrade
