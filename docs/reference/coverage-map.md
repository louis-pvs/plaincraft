---
id: ref-coverage-map
owner: "@lane-d"
lane: D
version: 1.0.0
created: 2025-11-02
ttl_days: 90
last_verified: 2025-11-02
prev: /reference/contracts
next: /reference/pr-body-generation
---

# Coverage Map

> Links each adopted contract to implementation artifacts (scripts, templates, docs, tests) for drift detection.

## Purpose

Provide traceability from governance contracts to concrete code and documentation so we can detect when a change in a contract requires updates elsewhere.

## Structure

Each contract lists its mapped artifacts categorized by type. Future automation will parse this file to determine stale coverage after changes.

## Map

### identity

- Scripts: `scripts/ops/create-branch.mjs`, `scripts/checks/commit-guard.mjs`
- Templates: `templates/*` (naming conventions)
- Docs: ADR `adr-2025-11-one-artifact-e2e`
- Tests: Commit guard specs (if present)

### lifecycle

- Scripts: `scripts/ops/idea-intake.mjs`, `scripts/ops/create-branch.mjs`, `scripts/ops/open-or-update-pr.mjs`, `scripts/ops/closeout.mjs`, `scripts/ops/reconcile-status.mjs`
- Docs: `/docs/workflows/idea-lifecycle.md`
- Tests: Lifecycle smoke `scripts/checks/lifecycle-smoke.mjs`

### project-schema

- Scripts: `scripts/ops/setup-project.mjs`, `scripts/ops/reconcile-status.mjs`
- Docs: `/docs/reference/project-schema.md`
- Cache: `.repo/projects.json`

### frontmatter

- Scripts: `scripts/ops/idea-intake.mjs`
- Docs: ADR `adr-2025-11-one-artifact-e2e`

### template

- Scripts: `scripts/ops/new-template.mjs`, `scripts/checks/template-coverage.mjs`
- Docs: Template catalog in `/templates` & generated README

### governance

- Docs: ADR `adr-2025-11-one-artifact-e2e`
- Scripts: `scripts/checks/guardrails.mjs`

### freshness

- Scripts: (Planned) stale marking reconcilers
- Docs: ADR `adr-2025-11-one-artifact-e2e`

## Guardrails

- Every contract section must list at least one script and one doc unless intentionally deferred.
- Missing mappings raise a warning in `pnpm guardrails --scope docs`.
- Changes to a contract or mapped artifact trigger a stale review workflow.

## Future Automation

1. Auto-update this map via a generation script scanning script metadata.
2. Add status badges per contract (coverage %, stale items count).
3. Integrate with PR guardrails to fail when coverage gaps widen.
