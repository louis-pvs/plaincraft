---
id: runbook-observer
owner: "@lane-d"
version: 1.0.0
created: 2025-11-01
ttl_days: 60
last_verified: 2025-11-01
---

# Observer Brief (Situational Checks)

Use when things hiccup. Quick verdicts, clear stop rules.

- **Intake stuck:** malformed/missing ID; duplicate Project items. Stop after 10 min → triage.
- **Branch no PR:** title/ID mismatch or duplicate PR. If no PR in 5 min → open manually, file follow-up.
- **Commit failures:** PR title ID ≠ commit ID or slug in header. If ≥3 bad commits → squash.
- **Status drift:** human UI edits without reconcile. If persists after one reconcile → lock and escalate.
- **CI flake/slow:** +90s p95, asset bloat, browser bump. Two days in a row → freeze “nice to have” jobs.
