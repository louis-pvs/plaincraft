# U-dropzone

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for documentation demos, Lane C (DevOps & Automation) for upload guardrails.
- **Labels:** unit, upload, accessibility

## Purpose

Deliver a drag-and-drop upload unit with previews and type/size guards that stays accessible and predictable across product flows.

## Problem

Upload entry points today lack consistent validation, keyboard access, and preview scaffolding. Designers and developers duplicate logic, risking regressions and poor a11y support.

## Proposal

1. Define props for accepted mime types, size limits, multiple selection, and callbacks.
2. Implement drag/drop + keyboard file selection with clear feedback, validation, and inline previews.
3. Provide Storybook coverage with `play()` exercising validation paths plus recorded demo for Playbook narratives.

## Acceptance Checklist

- [ ] Oversized or disallowed files are rejected with clear messaging.
- [ ] Images display previews with remove/retry actions.
- [ ] Keyboard-accessible file input mirrors drag-and-drop behavior.

## Status

- 2025-11-07 - Draft recorded to scope dropzone unit.

<!-- prettier-ignore -->
_Owner: @lane-a
