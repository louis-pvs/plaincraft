---
id: PB-scripts-first-lifecycle-rollout
owner: lane.b
lane: B
type: playbook
priority: P1
state: in-progress
next_state: review
issue: 91
acceptance:
  - [x] Storybook governance docs walk through the four lifecycle commands with SoT links
  - [x] Playbook pages narrate intake -> branch -> PR -> closeout with business framing
  - [x] Templates and README "Links" sections updated to the new governance docs
  - [ ] Training packet drafted for Lane D and shared in the ADR thread
---

# PB-scripts-first-lifecycle-rollout

Lane: B (Narrative & Enablement)

## Lane

- **Primary Lane:** B (Narrative & Enablement)
- **Partners:** Lane A for helper API references, Lane C for script usage demos,
  Lane D for rollout comms.

## Purpose

Teach teams how to work inside the Scripts-First Lifecycle v3 without reading
code. Every narrative (Playbook, Storybook governance docs, README links)
funnels developers toward the four sanctioned commands and explains how Project
status, ideas, and branches stay in sync.

## Status

- Storybook governance views published for Intake, Branch, PR Refresh, and Closeout, plus an overview map with SoT links.
- Playbook patterns live for lifecycle overview and rollback with rollout references in the index.
- Template READMEs and redirect stubs now point at the new governance docs.
- Training packet drafted; ADR share pending dry-run transcript capture.

## Process

1. Publish new Storybook governance docs for intake, branching, PR refresh, and
   closeout, each linking to helper APIs and CLI reference.
2. Author Playbook patterns that translate the lifecycle into business-facing
   language (e.g., "Ticketed -> Branched" expectations, rollback play).
3. Update template README "Links" sections (ideas, scripts, roadmap, changelog)
   to point at the new docs; add redirect stubs for legacy guidance.
4. Draft a training packet (video or doc) targeted at Lane D and backlog leads,
   then circulate via ADR comment thread.

## Acceptance Checklist

- [x] Storybook governance docs live for Intake, Branch, PR Open, and Closeout
      flows referencing helper APIs.
- [x] Playbook patterns published for lifecycle overview and rollback coverage,
      linked from Storybook pages.
- [x] Templates and script READMEs updated to reference the new docs; redirect
      stubs placed for superseded content.
- [ ] Training packet shared with Lane D + ADR subscribers, including quick
      start and FAQ.
