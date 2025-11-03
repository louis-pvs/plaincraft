# U-snackbar-undo

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-onboarding-light`
- **Contracts**:
  - Snackbar exposes deterministic timeout + progress bar with undo affordance.
  - Focus order stays predictable before/during/after snackbar lifetime.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, snackbar, accessibility

## Contracts

- Provide consistent undo-capable snackbars that share timing + focus rules across apps.
- Surface countdown state visually and programmatically for automation + docs.

## Props + Shape

- `message: string`
- `timeoutMs: number`
- `onUndo(): void`
- `onTimeout(): void`
- `progress?: boolean` — toggles progress indicator.
- `actionLabel?: string` — custom label for undo button.

## Behaviors

- Starts countdown on show; invoking undo cancels timeout and emits callback.
- Keyboard focus returns to originating element after snackbar dismissal.
- Supports stacking guard to ensure one snackbar visible at a time.

## Status

- 2025-11-07 - Draft recorded for undo snackbar unit.

## Accessibility

- Announces message and timeout updates via polite live region.
- Undo action rendered as button with clear label and focus outline.

## Acceptance Checklist

- [ ] Timeout dismissal + undo callback covered by unit/integration tests.
- [ ] Progress indicator visually and programmatically reflects remaining time.
- [ ] Focus order validated with keyboard-only walkthrough in Storybook `play()`.
- [ ] Recorded GIF demonstrates timeout and undo paths.
- [ ] Guardrail scenario ensures only one snackbar instance mounts at a time.

## Status Log

- 2025-11-07 - Draft captured for sprint planning.
