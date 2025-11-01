# PB-recording-standard

Lane: B (Narrative & Enablement)
Status: Draft

## Lane

- **Primary Lane:** B (Narrative & Enablement)
- **Partners:** Lane A (Foundations & Tooling) for Storybook hooks, Lane D (Program Operations) for rollout training.
- **Labels:** documentation, recording, playbook

## Purpose

Document the canonical process for capturing videos and GIFs from Storybook so every lane produces deterministic, lightweight assets.

## Problem

Teams capture media with ad-hoc delays, inconsistent tagging, and no shared size or duration caps. This bloats repositories, breaks accessibility guidance, and leaves Playbook stories outdated.

## Proposal

1. Define a recording checklist covering global delay knobs, command usage, and asset storage contracts.
2. Provide size/time caps, naming conventions, and tagging rules that automation (Lane C) can enforce.
3. Publish Playbook page with linked Storybook examples plus status-note template for Lane D adoption.

## Process

1. Update `/templates/script/README.md` and recording scripts with the canonical delay knob and tagging guidance.
2. Capture sample recordings (GIF + video) following the checklist; document expected file structure and metadata.
3. Publish the Playbook page with links to Storybook demos and circulate adoption notes via Lane D status update.
4. Hand off to Lane C to wire guardrails that enforce the new standards.

## Acceptance Checklist

- [ ] Global delay knob documented with recommended defaults.
- [ ] Tagging rule and asset destinations explained.
- [ ] Size/time caps published with rationale.
- [ ] Required commands list included with examples.

## Status

- 2025-11-07 - Draft logged to steward recording standards.

<!-- prettier-ignore -->
_Owner: @lane-b
