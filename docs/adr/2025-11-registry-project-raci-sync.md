---
id: "adr-2025-11-registry-project-raci-sync"
owner: "@lane-d"
status: "Accepted"
version: "1.0.0"
created: "2025-11-02"
review_after_days: 180
---

# Title: Registry Enforcement + GitHub Project RACI View Sync

## Context

People miss handoffs because ownership is scattered. The registry knows who is next, but the Project board does not scream it loudly enough. We need a single source of truth that drives a Project **RACI** view so nobody can ignore who does what next.

## Decision

Use the registry as the authority for role fields and sync them into a Project RACI view. CI blocks merges if the registry row is missing required baton or role fields. Automation keeps the Project item updated, labels lanes, and assigns the next owner. No side DMs. No manual spreadsheets.

## Scope

- Applies to all work items with IDs in the registry: `ARCH-*`, `U-*`, `C-*`, `PB-*`, `B-*`.
- RACI fields live in the registry and are mirrored to a Project item via automation.

## Contracts

- **Single source**: `docs/_registry.yaml` holds baton and RACI:
  - `current_owner`, `next_owner`, `next_lane`
  - `raci: { responsible, accountable, consulted[], informed[] }`

- **Project authority**: one Project item per `id`. Fields must reflect registry values.
- **Visibility**: Project view named **RACI** shows columns for `Status`, `Responsible`, `Accountable`, and highlights `next_owner`.

## Invariants

- A Project item cannot move forward if `next_owner` is empty.
- Lane D cannot accept unless A, B, C evidence links exist in the registry row.
- RACI fields must be present for every item that is Ticketed or beyond.
- The registry is edited by PR only. Project fields are machine-synced from the registry.

## Automation

- **Registry Enforcement**: CI job fails if any ADR’s `ADR ID:` is not present in the registry or if baton fields are missing.
- **ADR Intake Auto**: commits to `docs/adr/**` create or update the Intake Card and assign Lane A as `next_owner`.
- **Registry Cascade**: pushes to `docs/_registry.yaml` assign `next_owner`, label the lane on the Intake Card, and set Project fields.
- **D Accept Gate**: labels item `ready-for-d-accept` when A, B, C evidence fields are present in the registry.

## Project RACI View

- Saved view name: `RACI`
- Columns: `Status`, `ID`, `Title`, `Responsible`, `Accountable`, `Next Owner`, `Next Lane`, `Lane`, `Updated`
- Filters:
  - Include items where `Status` is in `Ticketed`, `Branched`, `PR Open`, `In Review`

- Highlights:
  - Row highlight when `Responsible != current_owner` or when `next_owner` is blank

- Sorting: `Status` ascending, then `Updated` descending

## Consequences

- Ownership is public and obvious. If work stalls, the RACI view shows exactly who is on the hook.
- Failing to set `next_owner` or RACI fields turns into a blocked PR.
- You stop being the human router.

## Intake Hand-off (Zero-Talk)

- ADR ID: adr-2025-11-registry-project-raci-sync
- Delta type: Contracts
- Pilot unit/pattern: U-registry-docs-pilot
- Owners: A:@lane-a B:@lane-b C:@lane-c D:@lane-d
- Seams: docs/\_registry.yaml, .github/workflows/\*\*, Project fields, .github/CODEOWNERS
- Invariants: Registry is the only editable cross-surface authority; Project reflects registry; CI blocks on missing baton or RACI
- Baseline window: last 5 green runs
- Stop rule: Intake Card live by T+30m; RACI row present by T+60m; freeze after 2 failed runs
- Contracts touched: policy-one-next-owner, policy-acceptance-matrix, policy-no-talk-dissemination
- Docs affected: WORKFLOW-adr-intake-zero-talk, WORKFLOW-merge-gate
- Registry updates: add `raci` object to pilot row; set `responsible` to current lane owner, `accountable` to lane D by default, `consulted` and `informed` per team list
- Review date: 2026-05-02

## Acceptance

- Project view `RACI` exists and shows the pilot item with:
  - `Responsible` equals `current_owner`
  - `Accountable` equals a named owner, default `@lane-d`
  - `Next Owner` and `Next Lane` match the registry row

- CI Registry Enforcement check passes
- Intake Card has automation label and assigned `next_owner`
- Evidence in registry:
  - A: storybook_run, readme_diff, pr_url
  - B: playbook_page, asset_note
  - C: gate_comment, metrics_note
  - D: decision_log, registry_commit

## Rollback

- Disable registry-to-Project sync workflow
- Remove RACI fields from Project and registry
- Keep Registry Enforcement to prevent orphaned IDs
