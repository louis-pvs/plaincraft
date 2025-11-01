---
id: runbook-lane-a
owner: "@lane-a"
lane: A
version: 1.0.0
created: 2025-11-01
ttl_days: 60
last_verified: 2025-11-01
---

# Lane A Runbook (Developer UI)

## Before

- Ticket has ID, acceptance, template link.
- Stories planned: success, failure, empty.
- a11y expectations clear.

## During

- Deterministic stories; no silent refactors.
- Keep README thin; link to template and Storybook.

## After

- Stories pass CI; a11y criticals = 0.
- Snapshot deltas explained.
- Status advanced by one step; notes updated.

**Success:** one unit/composition shipped; no CI p95 regression; README under cap.
