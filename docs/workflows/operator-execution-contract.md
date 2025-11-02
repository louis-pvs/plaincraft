---
id: workflow-operator-execution-contract
owner: @lane-d
lane: D
version: 1.0.0
created: 2025-11-02
last_verified: 2025-11-02
ttl_days: 180
---

# Operator Execution Contract

Single-page contract defining triggers, outputs, and the no-philosophy rule.

## Triggers (type these in requests)

- ADR NOW <title>
- DOC ROUTE <id>
- PLAYBOOK PAGE <id>
- STORYBOOK DOC <id>
- POLICY ENFORCE

## What you receive per trigger

- **Artifacts**: repo-ready files with correct paths and frontmatter, zipped.
- **Checklist**: Trigger, Inputs, Owner, Time box, Stop rule, Steps, Outputs, Hand-off, Evidence.
- **Placeholders**: If data is missing, fields are filled with `[TBD]` so work can start.

## SLA & Stop Rules

- Responses contain download links and exact repo paths.
- If conflicting prior docs exist, both are marked and routed to Lane D.
- If ID or audience missing after intake, work is blocked until provided.

## Visibility & Tone (short form)

- Public by default. Private only for `docs/internal/*` and secrets.
- Playbook: decision-first, ≤200 words, 2-line caption. Storybook: technical.
- ADR/Workflow: neutral, operational. Policy: contractual, testable.
