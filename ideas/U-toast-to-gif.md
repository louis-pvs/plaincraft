# U-toast-to-gif

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-notifications`
- **Contracts**:
  - Provide deterministic toast timing that respects global recording delay knobs.
  - Expose tags/metadata to mark stories for GIF capture.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, recording, toast

## Contracts

- Ensure toast timing and callbacks stay deterministic for recording scripts.
- Provide tagging/metadata utilities so narrative assets can locate canonical stories.

## Props + Shape

- `message: string`
- `delayMs: number`
- `durationMs: number`
- `onShow?: () => void`
- `onHide?: () => void`
- `recordingId: string`

## Behaviors

- Waits for `delayMs` before showing toast, then hides after `durationMs`.
- Emits callbacks on show/hide so recording scripts stay in sync.
- Accepts global overrides via context to coordinate mass captures.

## Status

- 2025-11-07 - Draft created for toast recording anchor unit.

## Accessibility

- Announces toast message via polite live region, including countdown metadata when recording.
- Provides manual close button with clear label.

## Acceptance Checklist

- [ ] Timing verified with unit tests to ensure deterministic show/hide windows.
- [ ] Integrates with recording script exposing `tags:["record"]` metadata.
- [ ] Storybook story demonstrates standard vs extended delay; GIF captured.
- [ ] a11y audit covers toast announcement and focus handling.
- [ ] Lane D playbook references integration instructions.

## Status Log

- 2025-11-07 - Draft submitted for lane sync.
