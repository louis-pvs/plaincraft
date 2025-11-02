---
id: runbook-lane-d-zero-talk
owner: "@lane-d"
lane: D
version: 1.0.1
created: 2025-11-02
last_verified: 2025-11-02
ttl_days: 120
---

# Lane D — Zero-Talk Intake Mode

**Trigger** ADR file with an **Intake Hand-off** block appears or updates to `status: Accepted`.

**Inputs required** ADR link, hand-off block content.

**Owner** Lane D. **Time box** 30 minutes. **Stop rule** No pilot by T+60m → freeze.

**Steps**

1. New issue from `ADR Intake Card` template; paste block; assign A/B/C/D.
2. Update `docs/_registry.yaml`: mark dependents Stale; `last_verified` timestamps.
3. Comment URLs on ADR and Project; move Project status to Ticketed.

**Outputs** Intake Card URL; registry diff committed.

**Hand-off** Lane A starts pilot stories.

**Evidence** Project item link; ADR comment link; commit SHA.
