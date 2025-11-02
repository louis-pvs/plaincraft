---
id: runbook-observer
owner: "@lane-d"
version: 1.0.0
created: 2025-11-02
ttl_days: 60
last_verified: 2025-11-02
prev: /runbooks/lane-D
next: /runbooks/operator-registry-sop
---

# Observer Brief (Situational Checks)

**Related:** [Lane A](/runbooks/lane-A) · [Lane B](/runbooks/lane-B) · [Lane C](/runbooks/lane-C) · [Lane D](/runbooks/lane-D) · [Operator SOP](/runbooks/operator-registry-sop) · [Artifact Lifecycle](/runbooks/artifact-manual-lifecycle)

Use when things hiccup. Quick verdicts, clear stop rules.

- Intake stuck: malformed/missing ID; duplicate Project items. Stop after 10 min → triage.
- Branch no PR: title/ID mismatch or duplicate PR. If no PR in 5 min → open manually, file follow-up.
- Commit failures: PR title ID ≠ commit ID or slug in header. If ≥3 bad commits → squash.
- Status drift: human UI edits without reconcile. If persists after one reconcile → lock and escalate.
- CI flake/slow: +90s p95, asset bloat, browser bump. Two days in a row → freeze non-critical jobs.

---

**Navigation:** [← Lane D](/runbooks/lane-D) · [Next: Operator SOP →](/runbooks/operator-registry-sop)
