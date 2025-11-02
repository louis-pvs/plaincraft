---
id: "adr-2025-11-auto-intake-and-cascade"
owner: "@lane-d"
status: "Accepted"
version: "1.0.0"
created: "2025-11-02"
review_after_days: 180
---

# Title: Auto Intake & Registry-Driven Cascade

## Context

Handoffs require human nagging, which is stupid and slow. We need zero-talk intake from ADR to Intake Card and automatic baton passing A → B → C → D, enforced by the registry and CI.

## Decision

Adopt registry-driven docs with automation:

- ADR commit auto-creates/updates Intake Card and assigns A.
- Registry row controls baton: current_owner, next_owner, next_lane.
- D cannot accept until A/B/C evidence fields are present in the registry.

## Consequences

- Faster intake, fewer stalls, clear ownership.
- CI fails if ADR IDs are missing from the registry or baton fields are empty.
- People who ignore CODEOWNERS will meet a red X instead of your DMs.

## Intake Hand-off (Zero-Talk)

- ADR ID: adr-2025-11-auto-intake-and-cascade
- Delta type: Docs
- Pilot unit/pattern: U-registry-docs-pilot
- Owners: A:@lane-a B:@lane-b C:@lane-c D:@lane-d
- Seams: src/registry-docs/**, storybook/docs/Patterns/registry-docs.mdx, playbook/pages/patterns/registry-docs.md, docs/\_registry.yaml, .github/workflows/**
- Invariants: Edit once in registry or unit README; no manual edits to generated projections; CI p95 budget +90s max; evidence links required per lane
- Baseline window: last 5 green CI runs
- Stop rule: Intake Card live by T+30m; freeze after 2 successive runs over +90s budget or missing evidence
- Contracts touched: CONTRACT-docs-registry, policy-one-next-owner, policy-acceptance-matrix
- Docs affected: WORKFLOW-adr-intake-zero-talk, WORKFLOW-merge-gate, POLICY-no-talk-dissemination
- Registry updates: add row for ARCH-registry-driven-docs with current_owner:@lane-d, next_owner:@lane-a, next_lane:A; then cascade baton per matrix
- Review date: 2026-05-02

## Acceptance

- Intake Card exists and assigned to A with baton fields set.
- Registry row present with baton and surfaces set.
- CI “Registry Enforcement” passes; automation workflows active.
- Evidence captured in registry:
  A: storybook_run, readme_diff, pr_url
  B: playbook_page, asset_note
  C: gate_comment, metrics_note
  D: decision_log, registry_commit

## Rollback

Disable the three automation workflows; remove baton fields from registry rows; revert CODEOWNERS if needed.
