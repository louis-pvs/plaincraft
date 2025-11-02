---
id: runbook-lane-a
owner: @lane-a
lane: A
version: 1.1.0
created: 2025-11-02
ttl_days: 60
last_verified: 2025-11-02
---

# Lane A Runbook (Developer UI)

**Trigger**: Ticket assigned and pilot named  
**Inputs required**: Pilot ID, acceptance, component paths, a11y rules  
**Owner**: Lane A  
**Time box**: 1 working day  
**Stop rule**: a11y criticals or CI p95 drift > +90s during pilot

**Steps**

1. Create success, error, empty stories for the pilot.
2. Update unit README snippet only; link template and Storybook.
3. Open PR with Doc Impact filled.

**Outputs**: Passing stories, updated README snippet, PR link  
**Hand-off**: Lane B writes playbook narrative  
**Evidence**: Storybook test result, PR checks, README diff

---

## ADR Mode (do this when an ADR appears)

Same as above, but restricted to the pilot blast radius. No refactors outside the pilot.
