# Lifecycle Config

## When to use

- Define or update Scripts-First lifecycle metadata (Project field IDs, enums, branch/commit patterns).
- Share config across ops scripts, guardrails, and docs without duplicating values.

## Scaffold

```bash
mkdir -p scripts/config
cp scripts/config/lifecycle.json scripts/config/lifecycle.local.json
```

## Wire

- `scripts/_lib/lifecycle.mjs` loads `lifecycle.json`.
- Ops commands (`idea-intake`, `create-branch`, `open-or-update-pr`, etc.) consume the normalized config.
- Reference the same file in CI (guardrails baseline, lifecycle smoke).

## Test

```bash
pnpm scripts:test -- --filter lifecycle
```

## Rollback

```bash
git restore scripts/config/lifecycle.json scripts/config/README.md
```

## Links

- Idea: ARCH-scripts-first-automation-suite
- Guardrails: scripts/checks/lifecycle-smoke.mjs

\_Owner: @lane-c
