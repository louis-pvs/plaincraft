---
id: policy-workflow-enforcement
owner: @lane-c
lane: C
version: 1.0.0
created: 2025-11-02
ttl_days: 90
last_verified: 2025-11-02
---

# Workflow Enforcement Contract

## What is enforced

1. Commit headers must match this pattern:
   ^\[([A-Z]+-\d+)\]\s+(feat|fix|perf|refactor|chore|docs|test|build|ci)(\([a-z0-9-]+\))?:\s.+$
2. No slugs in commit headers (slugs belong in PR titles only).
3. Branch format must be: type/ID-slug
4. PR title must start with [ID] and match branch ID.
5. One open branch and one open PR per ID at any time.

## What is reported (dashboards)

- Commit compliance rate per team.
- Project status lag (items >1 step behind).
- CI p50/p95 deltas vs baseline (+/− 90s tripwire).
- Orphaned templates and stale READMEs.

## Exceptions

- Lane D approves waivers. Lane C logs and time-limits them (≤14 days).
