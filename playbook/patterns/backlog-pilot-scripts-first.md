# Backlog Pilot Scripts-First Ops

- **Audience:** Lane D backlog pilots stewarding the Plaincraft Roadmap
- **Decision Anchor:** [ARCH-scripts-first-project-governance](https://github.com/louis-pvs/plaincraft/blob/main/ideas/ARCH-scripts-first-project-governance.md)
- **Owner:** @lane.d
- **TTL:** Review by 2026-04-30
- **Future Metric:** Weekly governance report delivered with ≤48 hour lag and zero duplicate project IDs
- **Recorded Media:** Record later

## Why it Matters

Scripts-First only works when the backlog keeps Projects as the status source of truth. Lane D pilots watch for drift, unblock automation failures, and make sure Roadmap metadata mirrors idea files and branches. With a published playbook and a scheduled audit report, backlog pilots can resolve issues before they snowball into stale cards or missing owners.

## Daily Intake Review

1. Run `pnpm scripts:lifecycle-smoke --yes --output json` on the current branch (or download the latest artifact from the **Project & Issue Management → Sync Project Fields** workflow).
2. Confirm new tickets include `Lane`, `Priority`, and checklist metadata before approving automation bootstrap.
3. If `pnpm guardrails` fails because of missing owner/scaffold refs, bounce back to the lane owner with the `lifecycle-smoke-report.json` excerpt.
4. Add `blocked by` notes in the roadmap when automation fails so other lanes can see the hold.

## Weekly Audit Flow (cron Mondays 09:00 UTC)

1. Review the artifact from the **Project Governance Audit** workflow (GitHub → Actions → `project-governance-report`).
2. Cross-check the `statuses` list against `.repo/projects.json`. Missing statuses or lanes require a `pnpm gh:setup-project` run with updated templates.
3. Spot-check random items directly in the Roadmap for owner and priority alignment.
4. Update the audit log (see ADR below) with discrepancies and remediation actions.

## Rollback & Escalation

- **Automation failure (scripts crash):** capture the run ID, set Project status to `Pending-<script>`, and page Lane C with the guardrails output.
- **Schema drift (missing field / option):** re-run `pnpm gh:setup-project --yes` to reconcile fields, then rerun `pnpm ops:report --yes` to refresh the cache.
- **Duplicate IDs:** immediately archive the least active card using `pnpm ops:closeout --id <ID> --dry-run` to confirm impact, then delete manually if safe.
- **Escalation path:** Lane D → Lane C (script owners) → Lane A (API/pipeline) if GitHub permissions block action.

## Links

- Lifecycle Governance Report: [`pnpm ops:report`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/ops/report.mjs)
- Weekly Audit Workflow: [`.github/workflows/project-audit.yml`](https://github.com/louis-pvs/plaincraft/blob/main/.github/workflows/project-audit.yml)
- Project Sync Workflow: [`.github/workflows/project.yml`](https://github.com/louis-pvs/plaincraft/blob/main/.github/workflows/project.yml)
- Schema Cache: [`.repo/projects.json`](https://github.com/louis-pvs/plaincraft/blob/main/.repo/projects.json)
- Ideas Source: [`ideas/ARCH-scripts-first-project-governance.md`](https://github.com/louis-pvs/plaincraft/blob/main/ideas/ARCH-scripts-first-project-governance.md)
