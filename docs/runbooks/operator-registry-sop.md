---
id: runbook-operator-registry-sop
owner: "@lane-d"
version: 1.0.0
created: 2025-11-02
ttl_days: 60
last_verified: 2025-11-02
prev: /runbooks/observer
next: /runbooks/artifact-manual-lifecycle
---

# Operator SOP — Registry-Driven Docs

**Related:** [Lane A](/runbooks/lane-A) · [Lane B](/runbooks/lane-B) · [Lane C](/runbooks/lane-C) · [Lane D](/runbooks/lane-D) · [Observer](/runbooks/observer) · [Artifact Lifecycle](/runbooks/artifact-manual-lifecycle)

You keep the registry true, grant waivers with dates, and ensure projections don't lie. Judgment only; no YAML gymnastics during reviews.

## Daily (≈5 minutes)

- Stale scan: pages flagged Stale or expiring within 7 days. Assign owners and dates.
- Status drift: sample 3 recent IDs; ensure Idea ↔ Project ↔ PR ≤ 1 step apart.
- CI sanity: commit compliance >95%, no new failing gates.

Stop rule: if Stale count rises two days in a row, open a visible debt ticket with owner/date.

## Per PR (if components/stories/contracts/templates changed)

- Doc Impact present: contracts changed, affected docs (by ID), action: update now / mark Stale with expiry / no-impact.
- If update now: verify the projection renders.
- If Stale: set expiry date in registry.
- If no-impact: spot-check one dependency.

Stop rule: missing Doc Impact → label policy-blocked.

## Weekly (≈15 minutes)

- Report: Stale pages, coverage gaps (contracts with 0 pages), orphaned templates.
- Nav coherence: nothing outside registry nav.
- Post: “Stale N, Coverage M, Orphans K.”

Stop rule: contract with 0 pages for 2 weeks → create Playbook task, assign Lane B.

## Monthly (≈20 minutes)

- TTL sweep: extend/update any doc within 7 days of expiry.
- Waiver audit: close or renew with justification (≤14 days).
- ADR glance: no policy contradiction.

Stop rule: >10% pages Stale → schedule a mini-migration week.

## During migrations

- Mark affected pages Under migration with target contract and ETA.
- Require one pilot updated end-to-end in the same PR before wide merge.
- Don’t re-record GIFs until stories stabilize; publish still thumbnail with “record after.”

Stop rule: pilot missing → block refactor PR.

## Hotfixes

- Create a B-\* ticket ID; ship minimal patch.
- Immediately mark impacted pages Stale and file follow-up within 3 business days.

## Never do

- Edit generated projections by hand.
- Approve PR that changes contracts without Doc Impact.
- Let a page sit Stale past expiry.

---

**Navigation:** [← Observer](/runbooks/observer) · [Next: Artifact Lifecycle →](/runbooks/artifact-manual-lifecycle)
