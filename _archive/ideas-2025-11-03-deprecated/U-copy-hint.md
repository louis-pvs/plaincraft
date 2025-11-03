# U-copy-hint

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-billing-method`
- **Contracts**:
  - Provide a resilient clipboard helper that degrades gracefully without the Async Clipboard API.
  - Surface countdown hinting and live-region messaging so users know copy completion status.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, clipboard, accessibility

## Contracts

- Offer a consistent clipboard abstraction with first-class fallback when permissions or API support fail.
- Communicate countdown hinting and status updates through accessible messaging for UI + SR users.

## Props + Shape

- `value: string` — text to copy.
- `countdownMs: number` — duration of the visible hint timer.
- `onCopy?: (result: { success: boolean }) => void` — telemetry callback after copy attempt.
- `label: string` — accessible label for the button/control.
- `fallbackText?: string` — optional text for textarea fallback.

## Behaviors

- Keyboard activation (Enter/Space) copies the value and starts the countdown hint.
- When the Clipboard API rejects, fall back to a hidden textarea selection and notify via live region.
- Resets countdown and hint content on blur or after the countdown completes.

## Status

- 2025-11-07 - Logged in `Draft` by Lane A to scope clipboard hint unit.

## Accessibility

- Announces success/failure and remaining countdown via `aria-live` updates.
- Maintains focus on the trigger control after copy completes.

## Acceptance Checklist

- [ ] Async clipboard and fallback textarea flows validated with automated tests.
- [ ] Countdown hint renders consistently and clears after completion.
- [ ] Live-region messaging documented and verified with screen reader smoke.
- [ ] Storybook `play()` story exercises keyboard + pointer paths; recorded asset published.
- [ ] Error state gracefully surfaces when clipboard permissions are denied.

## Status Log

- 2025-11-07 - Draft captured for backlog intake.
