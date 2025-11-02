---
id: workflow-adr-intake
owner: @lane-d
lane: D
version: 1.0.0
created: 2025-11-02
ttl_days: 180
last_verified: 2025-11-02
---

# ADR → Action Workflow

A single, event‑driven workflow every lane follows the moment an ADR appears.

```mermaid
flowchart TB
  ADR[ADR opened or updated] --> Classify[Classify delta\nPolicy | Docs | Contracts | CI | Mixed]
  Classify --> Intake[Create ADR Intake Card\n(owner, delta, pilot, stop rule)]
  Intake --> Pilot[Name pilot unit/pattern\nand map contracts]
  Pilot --> Registry[Seed/update registry entries\nmark dependents Stale]
  Registry --> PR[Open pilot PR\nwith Doc Impact filled]
  PR --> Run[Execute pilot\nA/B/C/D do lane steps]
  Run --> Decision{Pilot passes?}
  Decision -- yes --> Rollout[Schedule rollout\nun-Stale dependents]
  Decision -- no --> Rescope[Stop by stop rule\nrescope or waive with expiry]
  Rollout --> Closeout[Update last_verified + TTL\nArchive Intake Card]
```

## ADR Intake Card (paste into a Project item)

- ADR: [link]
- Delta type: Policy | Docs | Contracts | CI | Mixed
- Seams: systems/paths touched
- Invariants: things that must not change
- Rollout: Pilot then gradual | Wide | Deferred
- Stop rule: time and CI p95 budget (+90 s tripwire)
- Baseline window: last 5 green runs
- Pilot: [unit/pattern]
- Owners: A [name], B [name], C [name], D [name]
- Contracts touched: CONTRACT-\*
- Registry updates: IDs to add/edit
- Docs affected: PATTERN-_, RUNBOOK-_, WORKFLOW-\*
- Decision log: one-line outcome
