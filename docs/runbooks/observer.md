---
id: runbook-observer
owner: @lane-d
version: 1.0.0
created: 2025-11-02
ttl_days: 60
last_verified: 2025-11-02
---

# Observer Brief (Situational Checks)

- Intake stuck → missing ID or duplicate items. Halt after 10 min; triage.
- Branch without PR → mismatch ID/title. If no PR in 5 min, open manually; file follow-up.
- Commit failures → header/tag mismatch. If ≥3, squash.
- Status drift → UI edits without reconcile. After one reconcile, lock and escalate.
- CI flake/slow → +90s p95, asset bloat, browser bump. Two days in a row, freeze non-critical jobs.
