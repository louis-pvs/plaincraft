# U-field-error

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for form guidance, Lane C (DevOps & Automation) for validation hooks.
- **Labels:** unit, field, validation

## Purpose

Create an input field unit with consistent async validation and inline error patterns so forms stay predictable and accessible.

## Problem

Forms implement async validation differently, resulting in flickering errors, missing screen-reader feedback, and retry flows that require manual patching. This slows lane adoption and hurts UX.

## Proposal

1. Define props for validator promises, pending states, and error messaging slots.
2. Implement delayed error surfacing with screen-reader text, retry clearing, and focus management.
3. Provide Storybook exercises, tests, and documentation for adoption.

## Acceptance Checklist

- [ ] Error message delayed appropriately and includes SR-friendly content.
- [ ] Retry path clears previous errors once validation succeeds.

## Status

- 2025-11-07 - Draft captured for async field error unit.

<!-- prettier-ignore -->
_Owner: @lane-a
