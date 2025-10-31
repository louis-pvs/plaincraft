# ARCH-recording-storage-migration

Lane: C (DevOps & Automation)
Issue: #96
Status: in-progress

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** recording, assets, pipeline

## Purpose

Provide resilient storage, optimization, and delivery pipelines for the new
recording assets so Lane A/B can ship clips without worrying about paths moving
or size enforcement failing.

## Problem

Current recording assets live ad-hoc in unit folders and rely on manual
optimization. As we centralize scripts-first workflows, we need automation to:

- Enforce size/duration/format rules consistently.
- Relocate assets when storage layout changes without breaking links.
- Expose metadata for TTL and stale detection.

Without Lane C’s migration, Lane A/B will block on path changes, and guardrails
will drift.

## Proposal

1. Design an asset pipeline (likely under `artifacts/recordings/`) with CLI
   helpers to copy/optimize GIFs and sync metadata.
2. Implement size/duration validation scripts that fail CI when assets exceed
   thresholds; integrate into `docs-governance` or dedicated workflow.
3. Provide relative-link resolver so Storybook/Playbook can embed assets even if
   underlying storage rewires (e.g., JSON manifest).
4. Plan migration from existing inline assets, including git LFS or repo size
   considerations.

## Acceptance Checklist

- [ ] Recording storage layout defined and documented, including manifest format
      for asset lookup.
- [ ] Optimization/validation script added (e.g., `scripts/ops/recordings-opt.mjs`)
      enforcing ≤2 MB GIF, ≤10 s duration, 960 px width.
- [ ] CI workflow updated to run the validation on relevant changes and surface
      clear errors.
- [ ] Migration plan executed for existing assets, with redirects or manifest
      entries keeping Storybook/Playbook links intact.
- [ ] Metadata (alt text, captions, decision labels, TTL) exposed for Lane B/D
      automation.
