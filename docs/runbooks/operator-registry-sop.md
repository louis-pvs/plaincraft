---
id: runbook-operator-registry-sop
owner: @lane-d
version: 1.0.0
created: 2025-11-02
ttl_days: 60
last_verified: 2025-11-02
---

# Operator SOP — Registry-Driven Docs

## Daily

- Stale scan for pages and TTL < 7 days; assign owners/dates.
- Status drift check on 3 recent IDs (Idea ↔ Project ↔ PR within 1 step).
- CI sanity: commit compliance >95%, no new failing gates.

## Per PR

- Doc Impact is present and specific.
- If Stale: set expiry in registry. If update-now: verify render. If no-impact: spot-check one dependency.

## Weekly

- Post “Stale N, Coverage M, Orphans K.”

## Monthly

- TTL sweep; waiver audit; policy contradiction check.
