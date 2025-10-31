# U-toast-to-gif

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for recording standards, Lane C (DevOps & Automation) for script integration.
- **Labels:** unit, recording, toast

## Purpose

Provide a deterministic toast interaction harness tailored for GIF capture so documentation and demos remain consistent.

## Problem

Story recordings frequently require manual timing tweaks to align toasts, resulting in jittery GIFs and drift across docs. Without a standardized anchor, Playbook assets degrade rapidly.

## Proposal

1. Define props for message, delay, duration, and control hooks tied to recording scripts.
2. Implement deterministic timing respecting global recording delay knobs and ensure consistent layout.
3. Tag Storybook stories with `tags:["record"]` and capture official assets for Lane B's recording standard.

## Acceptance Checklist

- [ ] Interaction timing remains deterministic across runs.
- [ ] Global recording delay knob honored during playback.
- [ ] Storybook story tagged with `tags:["record"]` for automation.

## Status

- 2025-11-07 - Draft logged to support repeatable toast recordings.

<!-- prettier-ignore -->
_Owner: @lane-a
