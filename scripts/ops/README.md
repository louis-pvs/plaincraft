# Script Ops

## When to use

- Orchestrate multi-step automations that compose guardrail helpers.
- Wire repository workflows to GitHub, Storybook, or Playbook.
- Ship resilient tooling that teams can run locally or in CI.

## Scaffold

```bash
cp scripts/_template-ops.mjs scripts/ops/my-automation.mjs
# scaffold_ref: /templates/script@v0.1
```

## Wire

- Register the new command in `package.json` under `scripts`.
- Document expected flags in `/templates/script/USAGE.md`.
- Update `/scripts/README.md` with a short summary.

## Test

```bash
pnpm scripts:test -- --filter my-automation
```

## Guardrail checklist

- `pnpm scripts:lint` - header and CLI contract
- `pnpm scripts:smoke` - `--help` and `--dry-run`
- `pnpm scripts:size` - enforce LOC limits
- `pnpm scripts:test -- --filter my-automation` - focused unit assertions
- `pnpm scripts:test -- --filter create-worktree-pr` - required when modifying worktree bootstrap helpers
- `pnpm gh:worktree <issue>` automatically ensures git hooks are installed in new worktrees before dependencies install, so lint-staged/Prettier fire on first commit.

## Rollback

```bash
git restore scripts/ops/my-automation.mjs
```

## Links

- USAGE: /templates/script/USAGE.md
- Storybook: /storybook/?path=/docs/governance-script-automation--docs
- Playbook: /playbook/patterns/script-automation-guardrails.html

_Owner: @lane-c_
