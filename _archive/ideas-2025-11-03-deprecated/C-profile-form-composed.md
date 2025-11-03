# C-profile-form-composed

Lane: A (Component development - Pair A owns implementation)
Issue: #53

## Lane

- **Primary Lane:** A (Component Development)
- **Collaboration:** Coordinate with Design Systems for cross-form consistency.

## Metric Hypothesis

Demonstrate a composition pattern that combines multiple form fields, measured by Storybook interaction test coverage and nightly recording success rate.

## Units In Scope

This composition does not depend on existing Unit components. It demonstrates form field composition with:

- Name input (text field with validation)
- Email input (text field with email validation)
- Bio textarea (multi-line field with character count)
- Form-level state management and validation

## Purpose

Create a composition example demonstrating how multiple form fields work together with:

- Unified validation state
- Coordinated save/reset actions
- Keyboard shortcuts for power users
- Accessible error messaging

This serves as a reference implementation for the "Composition Pattern" documented in the Playbook.

## Invariants

- Form validation must be accessible (ARIA labels, error announcements).
- Keyboard shortcuts documented (Cmd/Ctrl+Enter to save, Esc to reset).
- All fields must respect max-length constraints.

## Acceptance Checklist

- [x] ProfileFormComposed component implemented following headless pattern
- [x] useProfileFormController hook with form state management
- [x] ProfileFormView with Tailwind styling
- [x] Storybook stories with interaction tests
- [x] Stories tagged with 'record' for nightly recording
- [x] Demo added to demo/src/App.tsx
- [ ] Composition documented in Playbook patterns section
- [ ] CI passes (typecheck, lint, unit tests, Storybook tests)
- [ ] Recording generates GIF under 2MB at 960px width

---

_Source: `/ideas/C-profile-form-composed.md`_
