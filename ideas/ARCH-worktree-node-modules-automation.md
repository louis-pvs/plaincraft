# ARCH-worktree-node-modules-automation

Lane: C (DevOps & Automation)
Issue: (pending)

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** workflow, worktree, automation

## Purpose

Stop new worktrees from failing lint/tests because `node_modules` is missing.
Each checkout currently requires a manual `rm -rf node_modules && pnpm install`,
slowing the scripts-first workflow and producing noisy guardrail failures.

## Problem

`scripts/ops/create-worktree-pr.mjs` gives us a clean tree, but our shared
scripts depend on `node_modules`. Without caching or automatic install:

- Guardrail commands (`pnpm guardrails`, `ops:create-branch`, etc.) crash with
  `ERR_MODULE_NOT_FOUND`.
- Developers waste minutes re-installing dependencies per worktree.
- CI parity breaks because local guardrails are skipped or fail noisy.

## Proposal

1. Add a post-checkout automation (worktree bootstrap) that either reuses an
   existing pnpm store or runs `pnpm install` once for the worktree.
2. Cache `node_modules/.pnpm` per worktree path so repeated guardrail runs are
   fast.
3. Update the worktree script docs so the install step is transparent and can
   be skipped with `--no-install` for offline hacking.

## Acceptance Checklist

- [ ] Worktree creation hook installs or links `node_modules` automatically.
- [ ] Guardrail commands succeed in the fresh worktree without manual steps.
- [ ] Documentation updated (worktree README, Lane C guides) describing the new
      bootstrap behavior and override flag.
- [ ] Added smoke test verifying a brand-new worktree can run `pnpm guardrails`
      without manual dependency setup.
