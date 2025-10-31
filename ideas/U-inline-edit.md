# U-inline-edit

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for Storybook docs + GIF demos, Lane C (DevOps & Automation) for guardrail coverage.
- **Labels:** unit, inline-edit, accessibility

## Purpose

Deliver an inline-edit label component that keeps optimistic saves trustworthy, accessible, and recorder-friendly for narrative assets.

## Problem

Teams currently hand-roll inline edit patterns, causing inconsistent enter/escape semantics, unverified optimistic flows, and missing Storybook recordings. Without a governed unit, documentation and demos drift and accessibility coverage is uneven.

## Proposal

1. Model props and contract (value, status, callbacks) with clear optimistic state transitions.
2. Implement keyboard + pointer behaviors, optimistic commit with rollback, and deterministic Storybook stories with `play()` coverage.
3. Capture a record-ready interaction (`tags:["record"]`) and wire guardrail tests (behavior + a11y) before adoption.

## Acceptance Checklist

- [ ] Props table documents value, status, callbacks, and optimistic constraints.
- [ ] Enter/Escape flows commit or cancel edits predictably.
- [ ] Blur-to-save path mirrors Enter behavior with rollback on failure.
- [ ] Accessibility coverage: focus states, announcements, and SR text verified.
- [ ] Storybook `play()` plus one recorded story published for demos.

## Status

- 2025-11-07 - Draft created to capture inline edit unit scope and acceptance.

<!-- prettier-ignore -->
_Owner: @lane-a
