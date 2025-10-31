# U-skeleton-switch

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for docs/story demos, Lane C (DevOps & Automation) for governance checks.
- **Labels:** unit, skeleton, accessibility

## Purpose

Introduce a loader-to-content toggle unit that pairs skeleton placeholders with an accessible switch to standardize loading states.

## Problem

Apps show inconsistent skeleton markup and toggle behaviors, leading to redundant implementations and accessibility gaps (e.g., screen readers reading hidden skeletons).

## Proposal

1. Model props for loading state, switch labels, and slots for skeleton/content.
2. Implement skeleton visibility with `aria-hidden` plus accessible switch patterns reflecting state.
3. Cover with tests, Storybook interactions, and recording for Lane B adoption guides.

## Acceptance Checklist

- [ ] Skeleton region toggles `aria-hidden` accurately.
- [ ] Switch reflects state via `aria-checked`.

## Status

- 2025-11-07 - Draft documented to govern skeleton switch unit.

<!-- prettier-ignore -->
_Owner: @lane-a
