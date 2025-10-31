# U-step-timeline

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for walkthrough demos, Lane C (DevOps & Automation) for scroll guardrails.
- **Labels:** unit, timeline, accessibility

## Purpose

Create a timeline unit that guarantees the current step stays visible and supports pagination for earlier steps without sacrificing accessibility.

## Problem

Existing timelines often clip the active step off-screen, lack pagination for long histories, and provide little assistance for screen readers. Reimplementing these patterns wastes time and causes inconsistent UX.

## Proposal

1. Define props for steps, current index, pagination settings, and callbacks.
2. Implement auto-scroll / focus management so the active step remains in view with keyboard/pointer input.
3. Provide pagination for prior steps plus Storybook coverage and a recorded demo for narrative guidance.

## Acceptance Checklist

- [ ] Current step scrolls into view when state changes.
- [ ] Pagination allows browsing prior steps without losing position.

## Status

- 2025-11-07 - Draft established to govern step timeline unit.

<!-- prettier-ignore -->
_Owner: @lane-a
