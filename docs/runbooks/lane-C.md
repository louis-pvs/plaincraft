---
id: "runbook-lane-c"
owner: "@lane-c"
lane: "C"
version: "1.1.0"
created: "2025-11-02"
ttl_days: 60
last_verified: "2025-11-02"
---

# Lane C Runbook (DevOps & Enforcement)

**Trigger**: Pilot PR opened  
**Inputs required**: Pilot branch, baseline metrics, artifact caps, commit rules  
**Owner**: Lane C  
**Time box**: 30 minutes to set gates; 2 runs to confirm baseline  
**Stop rule**: edits to projections or p95 exceeds budget for 2 runs

**Steps**

1. Enforce commit/PR title checks on pilot branch.
2. Set CI p95 and artifact size tripwires.
3. Post metrics after first two runs; gate status accordingly.

**Outputs**: Green dashboard entry or blocked PR with reason  
**Hand-off**: Back to Lane D for rollout decision  
**Evidence**: Metrics screenshot, gate config note, PR comment link
