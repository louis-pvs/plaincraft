# ARCH-lifecycle-pr-auto-sync

Lane: C (DevOps & Automation)
Status: Draft

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** lifecycle, automation, github-api

## Purpose

Automatically update pull requests, Project status, and idea frontmatter when lifecycle commands run with `--yes`, eliminating manual copy/paste and keeping the single source of truth intact.

## Problem

We currently emit dry-run plans (`ops/open-or-update-pr.mjs`, `ops/reconcile-status.mjs`, `ops/closeout.mjs`, `ops/report.mjs`) but never execute the write path. Impact:

- PR templates drift from idea content because the commands never push updates.
- GitHub Projects and idea frontmatter require hand edits after each run, defeating automation guarantees.
- Guardrails catch format issues, but developers must still sync content manually.

## Proposal

1. Implement write-mode helpers (Octokit or `gh api`) inside lifecycle ops scripts to apply the generated plans:
   - `open-or-update-pr` updates PR title/body, labels, and draft state.
   - `reconcile-status` updates Project item fields and idea status frontmatter atomically.
   - `closeout` archives branches, appends changelog entries, and toggles Project to Merged.
   - `report` publishes lifecycle snapshots to the repo (JSON) and GitHub summary.
2. Factor shared GitHub client utilities into `scripts/_lib/github.mjs` (reuse existing token detection and repo slug helpers).
3. Extend lifecycle smoke with a `--execute` gate in CI (nightly) to cover a sandbox repository, while keeping PR checks in dry-run mode.
4. Update documentation (Playbook, Storybook, templates) to reflect the new `--yes` modes and permissions needed.

## Acceptance Checklist

- [ ] Lifecycle ops (`open-or-update-pr`, `reconcile-status`, `closeout`, `report`) perform GitHub mutations when `--yes` is supplied.
- [ ] `scripts/_lib/github.mjs` exposes reusable helpers with error handling and rate-limit backoff.
- [ ] Lifecycle smoke gains an optional `--execute` path (nightly CI) using a sandbox repo to validate writes.
- [ ] Storybook + Playbook docs updated to describe the automated PR/Project sync behaviour.
- [ ] `pnpm guardrails` (dry-run) stays green; nightly execute job publishes a summary artifact.

## Status

- 2025-11-03 - Logged draft: captured gaps in lifecycle write-mode automation and outlined mutation plan.

<!-- prettier-ignore -->
_Owner: @lane-c
