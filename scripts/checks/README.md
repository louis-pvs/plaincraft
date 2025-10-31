# Script Checks

## When to use

- Add a new compliance check for docs or pipeline guardrails.
- Extend validation without touching production apps.
- Automate governance that should run in CI.

## Scaffold

```bash
cp scripts/_template-checks.mjs scripts/checks/my-check.mjs
# scaffold_ref: /templates/script@v0.1
```

## Wire

- Export the checker from `scripts/checks/index.mjs` when published.
- Add the script name to `package.json` under the `scripts` block.
- Document usage in `/templates/script/USAGE.md`.

## Test

```bash
pnpm scripts:test -- --filter my-check
```

## guardrails:baseline

```bash
pnpm guardrails:baseline --output json
```

Summarizes the last N (default 10) `ci.yml` runs, reporting guardrails job p50/p95 runtimes alongside artifact sizes for `guardrails-report`, `storybook-static`, `demo-dist`, and `playbook-static`. Useful before adjusting the Guardrail Suite budget.

## scripts:lifecycle-smoke

```bash
pnpm scripts:lifecycle-smoke --yes --output json
```

Runs the executable lifecycle guardrails that exist today (idea metadata validation for Lanes C & D plus a dry-run of the guardrails baseline script). Defaults to `--dry-run` so CI can toggle execution via `--yes`.

## Rollback

```bash
git restore scripts/checks/my-check.mjs
```

## Links

- USAGE: /templates/script/USAGE.md
- Storybook: /storybook/?path=/docs/governance-script-automation--docs
- Playbook: /playbook/patterns/script-automation-guardrails.html
- Guardrails suite: `pnpm guardrails`

_Owner: @lane-c_
