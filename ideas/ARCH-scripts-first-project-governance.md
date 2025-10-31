---
id: ARCH-scripts-first-project-governance
owner: lane.d
lane: D
type: architecture
priority: P1
state: ready
next_state: in-progress
issue: 99
acceptance:
  - Project schema created or updated to match lifecycle v3 fields, with IDs captured for automation.
  - Automation workflow (`project-sync.yml` or updated `project.yml`) listens for lifecycle events and queues status transitions.
  - Weekly audit script/report (`ops/report.mjs` or similar) scheduled to flag drift, missing Owner, or duplicate IDs.
  - Backlog operating procedure published (doc or Playbook entry) covering intake review, rollback flow, and escalation.
  - Migration retro recorded in ADR comment with links to scripts and Project snapshots.
---

# ARCH-scripts-first-project-governance

Lane: D (Backlog & Project Stewardship)
Issue: 99

## Lane

- **Primary Lane:** D (Backlog & Project Stewardship)
- **Labels:** projects, governance, lifecycle

## Purpose

Operationalize the Scripts-First Lifecycle v3 across GitHub Projects so status,
priority, and release fields stay authoritative, and reconciliation scripts can
run unattended.

## Problem

The lifecycle relies on Projects as the status source of truth, but the current
board lacks the schema, automation hooks, and audit routines described in the
direction doc. Without a governed project:

- Intake scripts cannot create items with the correct fields or lanes.
- Branch/PR automation fails to transition status, leaving cards stuck in
  Ticketed/Branched.
- Reconciliation floods the board with corrections, eroding trust in the system.

## Proposal

1. Define and enforce the minimal Project schema (`ID`, `Type`, `Lane`,
   `Status`, `Owner`, `Priority`, `Release`) using setup scripts and periodic
   audits.
2. Configure workflows/webhooks so lifecycle scripts can queue status changes
   and closeouts without manual intervention.
3. Draft operating procedures for backlog pilots (Lane D) to review drift,
   resolve script failures, and coordinate rollbacks.
4. Document escalation paths (who owns what lane) inside the Project views and
   ADR thread.

## Acceptance Checklist

- [ ] Project schema created or updated to match lifecycle v3 fields, with IDs
      captured for automation.
- [ ] Automation workflow (`project-sync.yml` or updated `project.yml`) listens
      for lifecycle events and queues status transitions.
- [ ] Weekly audit script/report (`ops/report.mjs` or similar) scheduled to flag
      drift, missing Owner, or duplicate IDs.
- [ ] Backlog operating procedure published (doc or Playbook entry) covering
      intake review, rollback flow, and escalation.
- [ ] Migration retro recorded in ADR comment with links to scripts and Project
      snapshots.

## Status

- 2025-10-31 - Advanced to `ready` after normalizing idea frontmatter and confirming Plaincraft Roadmap card automation scope.
