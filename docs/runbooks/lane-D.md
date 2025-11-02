---
id: runbook-lane-d
owner: "@lane-d"
lane: D
version: 1.0.0
created: 2025-11-02
ttl_days: 60
last_verified: 2025-11-02
prev: /runbooks/lane-C
next: /runbooks/observer
---

# Lane D Runbook (Ideas & Product Ops)

**Related:** [Lane A](/runbooks/lane-A) · [Lane B](/runbooks/lane-B) · [Lane C](/runbooks/lane-C) · [Observer](/runbooks/observer) · [Operator SOP](/runbooks/operator-registry-sop) · [Artifact Lifecycle](/runbooks/artifact-manual-lifecycle)

## Before

- Idea has ID, owner, lane, type, priority, acceptance.
- No duplicate ID in Project.

## During

- Advance one state only; note blockers.
- Reconcile idea frontmatter to Project status.

## After

- Links verified (Idea ↔ Project ↔ Branch ↔ PR).
- Archive on closeout.

**Success:** single source of truth preserved; zero duplicate truth.
