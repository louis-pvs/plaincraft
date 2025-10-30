---
id: PB-recording-placement-v3
owner: lane.b
lane: B
type: playbook
priority: P1
state: ready
next_state: in-progress
issue: 93
acceptance:
  - Governance docs define placement rules, caption template, and rejection criteria for GIFs
  - Playbook pages embed one GIF per decision with alt text, caption, and template links
  - Curation log tracks where each asset lives, the decision it supports, and page owner
  - TTL process and “stale media” indicators documented for Lane D handoff
---

# PB-recording-placement-v3

Lane: B (Playbook & Narrative Stewardship)

## Lane

- **Primary Lane:** B (Playbook & Narrative Stewardship)
- **Partners:** Lane A for asset intake, Lane D for backlog tracking, Lane C for storage changes.

## Purpose

Embed Lane A’s deterministic GIFs only where they alter decisions, ensure every
clip is traceable to the owning template, and keep Playbook narratives lean and
actionable.

## Process

1. Update Storybook governance docs with placement rules, caption template, and
   rejection checklist.
2. Curate Playbook pages so each decision point gets exactly one GIF (plus still
   fallback) with alt text and guardrail caption.
3. Maintain a curation log recording asset path, decision supported, page owner,
   and last updated date; expose TTL reminders when units change.
4. Provide guidance for Lane D on how to audit media freshness during backlog
   reviews.

## Acceptance Checklist

- [ ] Storybook governance doc published with placement rules, caption template,
      and traceability requirements.
- [ ] Target Playbook pages updated with one GIF per decision, alt text, caption,
      README/template links, and still fallback.
- [ ] Curation log (CSV/JSON/README) records embed location, decision support,
      page owner, and TTL date.
- [ ] Documentation for backlog pilots (Lane D) explains media freshness checks
      and escalation path when assets go stale.
