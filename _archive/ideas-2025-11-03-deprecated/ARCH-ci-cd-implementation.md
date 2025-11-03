# ARCH-ci-cd-implementation

Lane: C (DevOps & Automation)
Created: 2025-10-28
Issue: (pending)

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, ci-cd

## Purpose

Track the end-to-end CI/CD implementation—from split pipelines through deploy automation and nightly recording—under the idea ➜ issue ➜ PR lifecycle so remaining guardrails and follow-up work have a canonical home.

## Problem

The CI/CD overhaul landed directly on the working branch. While the system is running (six parallel jobs, deploy workflow, nightly recording), there is no idea ticket documenting the scope, decisions, or remaining gaps. Without one:

- Product/ops visibility into CI health and debt is limited to the status doc
- Follow-up fixes (timeouts tuning, artifact monitoring, manual guardrail docs) lack an accountable owner
- Automation can’t sync progress to issues/PRs, breaking the ideas-as-source-of-truth pattern

## Proposal

Document the CI/CD stack, capture outstanding guardrails, and run the work through the standard lifecycle by:

1. Publishing an authoritative record of the pipeline design, runtime targets, and automation surfaces.
2. Tracking follow-up guardrail items (monitoring, alerting, documentation) as part of this architecture ticket and linked issues.
3. Validating that the deploy workflow, nightly recording, and artifact handling align with the documented expectations before closing the card.

## Implementation Snapshot

- Six parallel CI jobs (`check`, `build-storybook`, `storybook-test`, `build-demo`, `build-playbook`, `summary`) with explicit timeouts between 5–15 minutes and nightly `record-nightly` gated behind schedule/manual triggers
- pnpm dependency caching and Playwright browser caching with versioned keys keep workflows under the 15-minute feedback target
- JUnit artifacts uploaded for Storybook and unit tests, with retention set to 30 days (tests) / 7 days (builds)
- Deploy workflow consumes demo, Storybook, and playbook artifacts to publish the site bundle to `gh-pages`
- Script-first automation model (`scripts/ops`, `scripts/checks`) powers ideas-as-source-of-truth, worktree helpers, and recording tooling
- Template-first posture: new automation is expected to land with scaffolds or reusable scripts plus corresponding guide entries before large workflow changes ship

## Pipeline Composition

| Job               | Responsibility                              | Timeout |
| ----------------- | ------------------------------------------- | ------- |
| `check`           | Format check, typecheck, lint, unit tests   | 10 min  |
| `build-storybook` | Storybook static build                      | 10 min  |
| `storybook-test`  | Interaction + a11y tests (depends on build) | 15 min  |
| `build-demo`      | Vite demo build                             | 8 min   |
| `build-playbook`  | VitePress playbook build                    | 8 min   |
| `summary`         | Aggregated run results + artifact summary   | 5 min   |
| `record-nightly`  | Scheduled/manual video & GIF capture        | 20 min  |

Key features:

- Concurrency group cancels superseded runs (`ci-${{ github.ref }}`)
- Recording job uses `continue-on-error` and never runs on PR pushes
- Deploy workflow triggers via `workflow_run` on successful CI or manual dispatch
- Artifact naming is stable per run to avoid collisions; `generate-gh-pages-index.mjs` creates landing index

## Observability & Guardrails

- Timeouts prevent GitHub’s 6-hour default; next tuning step is to track runtimes across 5–10 runs
- Parallel execution keeps developer feedback fast; only `storybook-test` depends on `build-storybook`
- Artifact retention balances debugging vs. storage (tests 30 days, builds 7 days)
- Guardrails codified in `scripts/GUARDRAILS.md` and enforced via ops/check scripts
- Legacy root-level script shims now warn-and-exit to push teams toward the ops/checks hierarchy

## Outstanding Gaps

- Monitor job durations and adjust splits or timeouts if sustained drift appears
- Add artifact size monitoring to catch bloated Storybook/demo/playbook bundles
- Promote CLI usage (e.g., `pnpm ideas:validate`) in developer docs so validation happens locally, not just in workflows
- Publish task-focused guides (`/guides`) for CI setup, monitoring, and artifact validation that reference reusable scaffolds and scripts (include `scaffold_ref` / `artifact_id`)
- Evaluate conditional execution for documentation builds once metrics baseline is captured
- Establish alerting beyond GitHub's default notification emails for failed CI/CD runs
- Ensure README and folder-level docs signpost the new guides and lane tags (`lane:C`) so developers can navigate the workflow quickly
- **Validate workflow script references** - Audit all GitHub Actions workflows to ensure script paths match actual locations (idea-lifecycle.yml was referencing `scripts/archive-idea-for-issue.mjs` instead of `scripts/ops/archive-idea-for-issue.mjs`, causing zero automated runs since creation)
- **Fix archive script dry-run behavior** - `scripts/ops/archive-idea-for-issue.mjs` appears to always run in dry-run mode even when `--no-dry-run` is passed; the parseFlags or boolean handling may be incorrect, preventing manual archival via CLI (workaround: use git mv directly)

## Deliverables

- Synced GitHub issue summarising the CI/CD implementation scope and progress
- Pull request(s) capturing any remaining guardrails (artifact size checks, documentation updates, alerting hooks)
- Updated idea notes once monitoring work completes and runtime baselines are captured
- Published guides for CI pipeline setup, health monitoring, and artifact validation, each anchored to templates or scripts and linked from `README.md`

## Acceptance Checklist

- [ ] Idea synced to GitHub with lane `C` and labels (`automation`, `ci-cd`)
- [ ] Tracking issue opened with baseline metrics, remaining worklist, and owners
- [x] Artifact size monitoring implemented or deferred with documented rationale (deferred - tracking in Outstanding Gaps)
- [x] CI alerting decision recorded (custom notifications or explicit acceptance of defaults) (using GitHub defaults)
- [x] Developer workflow docs highlight CLI validation commands (`pnpm ideas:validate`, etc.) (documented in scripts-reference.md)
- [ ] Idea updated after monitoring window with observed runtimes and any timeout adjustments
- [x] Deploy workflow validated after any conditional execution changes (workflow running successfully)
- [ ] Task-specific CI guides published with `scaffold_ref` / `artifact_id` metadata and linked from the root README and relevant folders
- [x] Lane `C` tagging applied across issues/PRs, and CI job documentation references the lane for ownership clarity

## References

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `docs/scripts-reference.md`
