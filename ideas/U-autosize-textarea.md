# U-autosize-textarea

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-onboarding-light`
- **Contracts**:
  - Autosize grows/shrinks within defined min/max rows while respecting content height.
  - Soft/hard length limits surface warnings and block input without layout jank.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, textarea, accessibility

## Contracts

- Manage textarea sizing within configured bounds without triggering reflow regressions.
- Communicate soft/hard limit states clearly while preventing input overflow.

## Props + Shape

- `value: string`
- `minRows: number`
- `maxRows: number`
- `softLimit: number`
- `hardLimit: number`
- `onChange(next: string): void`
- `onLimitHit?(type: "soft" | "hard"): void`

## Behaviors

- Expands fluidly until `maxRows` then introduces vertical scroll.
- Emits warning callbacks when `softLimit` reached and blocks keystrokes beyond `hardLimit`.
- Re-measures height on container resize to avoid stale scrollbars.

## Status

- 2025-11-07 - Draft captured to standardize autosizing textarea.

## Accessibility

- Announces soft/hard limit messaging via `aria-live` region with contextual copy.
- Associates counter status with textarea via `aria-describedby`.

## Acceptance Checklist

- [ ] Autosize verified with unit tests covering growth/shrink scenarios.
- [ ] Soft/hard limit messaging documented and accessible.
- [ ] Storybook demos show min/max rows, warning, and blocking behavior; GIF captured.
- [ ] Guardrail test prevents regressions in length enforcement.
- [ ] Fallback styles degrade gracefully when JavaScript disabled.

## Status Log

- 2025-11-07 - Draft logged for backlog triage.
