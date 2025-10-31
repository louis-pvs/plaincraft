# ARCH-scripts-first-automation-suite

Lane: C (DevOps & Automation)
Issue: #97
Status: in-progress

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** scripts-first, automation, lifecycle

## Purpose

Implement the Scripts-First Lifecycle v3 automation commands (`idea-intake`,
`create-branch`, `open-or-update-pr`, `reconcile-status`, `closeout`,
`commit-guard`, `report`) with guardrails that respect Projects as the status
source of truth.

## Problem

The direction document defines a lifecycle but the current repository lacks the
CLI surface or CI enforcement to make it real. Missing automation leaves us with:

- Manual Project edits that drift from idea files and branches.
- Branches created outside the sanctioned scripts, bypassing ID validation.
- PRs and closeouts that forget to bump status, archive ideas, or append
  changelog entries, breaking the SoT contract.

## Proposal

1. Scaffold each `ops/*.mjs` command with the lane A helper modules, keeping
   `--dry-run`/`--yes` ergonomics and 10-minute execution budgets.
2. Wire reconciliation jobs (status drift, commit guards) into CI and pre-commit
   hooks so the lifecycle cannot be bypassed.
3. Build a shared configuration file (`scripts/config/lifecycle.json` or
   similar) to map Project field IDs, statuses, and type enums for reuse.
4. Add smoke/spec coverage for the happy path and failure states (e.g., missing
   Project item, branch already open, PR mismatched).

## Acceptance Checklist

- [x] `ops/idea-intake.mjs`, `ops/create-branch.mjs`, `ops/open-or-update-pr.mjs`,
      `ops/reconcile-status.mjs`, `ops/closeout.mjs`, and `ops/report.mjs`
      implemented with shared helper modules.
- [ ] `checks/commit-guard.mjs` and `checks/drift.mjs` enforce commit headers and
      Project/idea parity locally and in CI.
- [x] Lifecycle config file documents Project field IDs, status enums, and type
      mappings with validation.
- [x] CI workflow added/updated to run lifecycle smoke tests (`pnpm scripts:lifecycle-smoke` or equivalent) on PRs.
- [ ] Documentation updated (README snippets, ADR note) showing the four-command
      workflow and how to recover from failed runs.

## Status

- 2025-10-31 - In progress: Lifecycle config + loaders landed (`scripts/config/lifecycle.json`, `scripts/_lib/lifecycle.mjs`), and intake/branch/PR commands now emit validated plans (`ops/idea-intake.mjs`, `ops/create-branch.mjs`, `ops/open-or-update-pr.mjs`). CI guardrail job calls `pnpm scripts:lifecycle-smoke` but Projects mutations (status reconcile, closeout, report) still pending.
- 2025-11-03 - Latest: Added placeholder planners for `ops/reconcile-status.mjs`, `ops/closeout.mjs`, `ops/report.mjs`, and extended lifecycle smoke to exercise the new scripts. Guardrails still failing on policy lint until the CLI contract flags (`--yes`, `--output`, `--log-level`, `--cwd`) are added to the new ops commands and documentation is updated.
