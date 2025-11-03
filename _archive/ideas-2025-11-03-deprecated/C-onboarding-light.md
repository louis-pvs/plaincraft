# C-onboarding-light

Lane: B (Narrative & Enablement)
Status: Draft

## Lane

- **Primary Lane:** B (Narrative & Enablement)
- **Partners:** Lane A (Foundations & Tooling) for unit execution, Lane D (Program Operations) for rollout checklist + training.
- **Labels:** composition, onboarding, accessibility

## Metric Hypothesis

Improve activation completion for light onboarding by 20% through a guided name/email/OTP flow with undo support for typos.

## Units In Scope

- `U-autosize-textarea` — capture name input with length feedback.
- `U-snackbar-undo` — provide undo when email typo detected.
- `U-form-guard` — block navigation until onboarding form is saved.

## Purpose

Produce a reference onboarding flow that demonstrates progressive disclosure with undo and OTP confirmation while remaining accessible and recorder-friendly.

## Problem

Teams ship divergent onboarding forms with inconsistent keyboard support and rollback handling. OTP mocks are ad hoc, making demos flaky and training materials inconsistent.

## Proposal

1. Combine autosize text entry, validation, and undo snackbar for corrections.
2. Mock OTP verification with deterministic inputs and accessible feedback.
3. Capture happy path + correction flows in Storybook, plus documentation for adoption and metrics.

## Acceptance Checklist

- [ ] Keyboard-only walkthrough passes start to finish.
- [ ] OTP mock documented and exercised in Storybook.
- [ ] Accessibility checks green across each step.

## Status

- 2025-11-07 - Draft logged to govern light onboarding composition.

<!-- prettier-ignore -->
_Owner: @lane-b
