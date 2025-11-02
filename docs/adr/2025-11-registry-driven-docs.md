---
id: adr-2025-11-pilot-registry-driven-docs
owner: "@lane-d"
status: Accepted
version: 1.0.0
created: 2025-11-02
review_after_days: 180
---

# Title: Registry-Driven Docs Pilot

## Context

We need a zero-talk handoff and single-source-of-truth for docs updates across Storybook, Playbook, and runbooks.

## Decision

Adopt registry-driven docs with ADR Intake Card workflow and per-lane runbooks. Pilot on one unit pattern.

## Consequences

Faster intake, fewer stale docs, CI enforcement on projections.

## Intake Hand-off (Zero-Talk)

- ADR ID: ARCH-registry-driven-docs
- Delta type: Docs
- Pilot unit/pattern: U-inline-edit (first end-to-end pattern)
- Owners: A:@lane-a B:@lane-b C:@lane-c D:@lane-d
- Seams: src/components/inline-edit/**, storybook/docs/inline-edit/**, playbook/pages/inline-edit/\*\*
- Invariants: Do not edit generated projections by hand; CI p95 budget +90s
- Baseline window: last 5 green runs
- Stop rule: Card by T+30m; freeze after 2 blown runs over +90s budget
- Contracts touched: CONTRACT-docs-registry
- Docs affected: PATTERN-inline-edit, RUNBOOK-lane-D, WORKFLOW-adr-intake
- Registry updates: WORKFLOW-adr-intake already added; add PATTERN-inline-edit & RUNBOOK-lane-D; mark dependents Stale
- Review date: 2026-05-01

## Pilot Tracking

- Baseline metrics file: `artifacts/baseline-ci.json`
- p95 total avg (baseline): 547.0 s
- p95 build avg (baseline): 321.4 s
- Tripwire delta: +90 s over baseline p95 total
- First pilot PR: https://github.com/louis-pvs/plaincraft/pull/149
- Gate status: **PASSED** (local run verified by Lane C)
- Waivers: scripts/checks/doc-gates.mjs (expires 2025-11-16, approved by Lane D)

### Decision Log

| Timestamp (UTC)      | Outcome              | p95 Delta vs Baseline | Notes                                                       | Approved By |
| -------------------- | -------------------- | --------------------- | ----------------------------------------------------------- | ----------- |
| 2025-11-02T17:30:00Z | Deployment Unblocked | N/A                   | Lane C: Frontmatter quoting sweep, waiver enforcement added | Lane D      |
| 2025-11-02T17:52:00Z | Docs Build GREEN     | N/A                   | Lane D: Removed dead link, verified deployment ready        | Lane D      |
| [TBD]                | Pilot Approved       | [TBD]                 | Awaiting PR #149 merge + real CI baseline capture           | Lane D      |
