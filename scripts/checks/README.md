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

## Rollback

```bash
git restore scripts/checks/my-check.mjs
```

## Links

- USAGE: /templates/script/USAGE.md
- Storybook: /storybook/?path=/docs/governance-script-automation--docs
- Playbook: /playbook/patterns/script-automation-guardrails.html

_Owner: @lane-c_
