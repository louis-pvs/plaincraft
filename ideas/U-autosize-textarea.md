# U-autosize-textarea

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for docs, Lane C (DevOps & Automation) for validation hooks.
- **Labels:** unit, textarea, accessibility

## Purpose

Deliver an autosizing textarea that respects soft/hard limits, surfaces character feedback, and remains accessible across form compositions.

## Problem

Current textareas either grow unpredictably or clip content, leaving users without feedback on limits. Teams reimplement length counters and blocking logic inconsistently, harming accessibility and QA repeatability.

## Proposal

1. Define props for min/max rows, soft/hard character limits, value, and change/validate callbacks.
2. Implement autosizing logic with resize observers, counter feedback with warning threshold, and guard rails for hard-limit enforcement.
3. Ensure accessible announcements and Storybook coverage including `play()` stories for deterministic demos.

## Acceptance Checklist

- [ ] Component grows with content while respecting configured limits.
- [ ] Counter warns when soft limit approached.
- [ ] Hard limit blocks additional input and communicates reason.
- [ ] Accessibility behaviors verified (labels, descriptions, announcements).

## Status

- 2025-11-07 - Draft captured to track autosizing textarea unit.

<!-- prettier-ignore -->
_Owner: @lane-a
