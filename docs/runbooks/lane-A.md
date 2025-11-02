---
id: runbook-lane-a
owner: "@lane-a"
lane: A
version: 1.0.0
created: 2025-11-02
ttl_days: 60
last_verified: 2025-11-02
next: /runbooks/lane-B
---

# Lane A Runbook (Developer UI)

**Related:** [Lane B](/runbooks/lane-B) · [Lane C](/runbooks/lane-C) · [Lane D](/runbooks/lane-D) · [Observer](/runbooks/observer) · [Operator SOP](/runbooks/operator-registry-sop) · [Artifact Lifecycle](/runbooks/artifact-manual-lifecycle)

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

---

**Navigation:** [Next: Lane B →](/runbooks/lane-B)
