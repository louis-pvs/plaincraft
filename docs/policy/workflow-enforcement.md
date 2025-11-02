---
id: "policy-workflow-enforcement"
owner: "@lane-c"
lane: "C"
version: "1.0.0"
created: "2025-11-02"
ttl_days: 90
last_verified: "2025-11-02"
---

# Workflow Enforcement Contract

## Enforced

1. Commit header pattern: ^\[([A-Z]+-[a-z0-9-]+)\]\s+.+$
2. No slugs in commit headers.
3. Branch format: type/ID-slug
4. PR title starts with [ID] and matches branch ID.
5. One open branch and one open PR per ID at any time.

## Reported

- Commit compliance rate
- Project status lag
- CI p95 delta vs baseline (+/− 90s tripwire)
- Orphaned templates and stale READMEs

## Exceptions

Lane D approves waivers; Lane C records and time-limits them (≤14 days).
