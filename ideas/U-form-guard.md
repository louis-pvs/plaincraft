# U-form-guard

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for rollout documentation, Lane C (DevOps & Automation) for lifecycle guardrails.
- **Labels:** unit, form, accessibility

## Purpose

Introduce a form guard unit that blocks navigation on unsaved changes, synchronizes inline banners, and supports accessible announcements.

## Problem

Unsaved changes logic appears in multiple flows with inconsistent blocking behavior, leading to accidental data loss and conflicting banner patterns. Without a governed unit, teams rely on ad hoc implementations.

## Proposal

1. Define props for dirty detection, confirmation copy, callbacks, and banner slotting.
2. Wire `beforeunload` integration, router interception, and inline banner updates with consistent UX.
3. Ensure accessible alerts, Storybook coverage, and tests for both block and release paths.

## Acceptance Checklist

- [ ] Navigation blocked whenever form remains dirty.
- [ ] Guard releases once a save completes successfully.
- [ ] Inline banner announces state via `role="alert"` and remains accessible.

## Status

- 2025-11-07 - Draft opened to unify form guard behavior.

<!-- prettier-ignore -->
_Owner: @lane-a
