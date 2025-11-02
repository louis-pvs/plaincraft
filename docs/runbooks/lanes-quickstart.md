---
id: runbook-lanes-quickstart
owner: @lane-d
version: 1.0.0
created: 2025-11-02
last_verified: 2025-11-02
ttl_days: 120
---

# Lanes Quickstart

Use this when an ADR drops. If any field is blank, do not start.

## Lane D

**Trigger** ADR accepted.  
**Inputs** ADR link, delta type, pilot name, owners A/B/C/D.  
**Owner** Lane D.  
**Time box** 30 minutes.  
**Stop rule** No pilot by T+60 min → freeze rollout talk.  
**Steps** 1) Create Intake Card. 2) Mark dependents Stale in registry. 3) Post links in ADR + Project.  
**Outputs** Intake Card URL; registry diff.  
**Hand-off** Lane A.  
**Evidence** Project item URL; ADR comment.

## Lane A

**Trigger** Intake Card live and assigned.  
**Inputs** Pilot ID, acceptance, component paths, a11y rules.  
**Owner** Lane A.  
**Time box** 1 day.  
**Stop rule** a11y criticals or p95 +90s.  
**Steps** 1) Success/error/empty stories. 2) Update unit README snippet. 3) Open PR with Doc Impact.  
**Outputs** Passing stories; README diff; PR link.  
**Hand-off** Lane B.  
**Evidence** Storybook test result; PR checks.

## Lane B

**Trigger** Lane A PR green.  
**Inputs** Pilot ID, GIF ≤2 MB at 960 px, README link.  
**Owner** Lane B.  
**Time box** 1 day.  
**Stop rule** Oversized media or missing backlinks.  
**Steps** 1) 200-word narrative + 2-line caption. 2) Embed links to README and Storybook. 3) Flip Stale to Verified.  
**Outputs** Updated Playbook page.  
**Hand-off** Lane C.  
**Evidence** Page link; asset note.

## Lane C

**Trigger** Pilot PR opened.  
**Inputs** Pilot branch, baseline metrics, artifact caps, commit rules.  
**Owner** Lane C.  
**Time box** 30 minutes to set gates; 2 runs to baseline.  
**Stop rule** Projections edited or p95 budget blown 2 runs.  
**Steps** 1) Enforce commit/PR checks. 2) Set p95 + size tripwires. 3) Post metrics and gate.  
**Outputs** Green dashboard or blocked PR with reason.  
**Hand-off** Lane D for rollout.  
**Evidence** Metrics screenshot; PR comment.
