# C-profile-form-composed

- **Lane**: A (Component development - Pair A owns implementation)
- **Metric Hypothesis**: Demonstrate composition pattern combining multiple form fields. Measure adoption through Storybook interaction test coverage and nightly recording success rate.
- **Invariants**: Form validation must be accessible (ARIA labels, error announcements), keyboard shortcuts documented (Cmd/Ctrl+Enter to save, Esc to reset), all fields must respect max-length constraints.
- **Issue**: #53

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
