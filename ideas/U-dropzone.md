# U-dropzone

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-upload-and-confirm`
- **Contracts**:
  - Provide unified drag/drop + file input flow with validation and preview hooks.
  - Reject disallowed files with actionable messaging and analytics telemetry.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, upload, accessibility

## Contracts

- Unify file validation and preview generation across drag/drop and input selection.
- Ensure rejection messaging and instrumentation integrate with downstream reporting.

## Props + Shape

- `accept: string[]` — allowed MIME types/extensions.
- `maxSizeMb: number`
- `multiple?: boolean`
- `files: Array<{ id: string; name: string; size: number; previewUrl?: string }>`
- `onDrop(files: FileList): void`
- `onRemove(id: string): void`
- `onRetry?(id: string): void`

## Behaviors

- Dragging highlights dropzone and announces instructions to screen readers.
- Drop/choose flows share the same validation pipeline for size/type rules.
- Generates preview slots and exposes hooks for retry/remove actions.

## Status

- 2025-11-07 - Draft noted for dropzone unit backlog.

## Accessibility

- Input element remains focusable with descriptive instructions.
- Rejection reasons announced via live region and visually inline.

## Acceptance Checklist

- [ ] Validation tests cover oversize, disallowed mime, and success paths.
- [ ] Preview gallery documented with Storybook examples; remove/retry flows captured.
- [ ] Keyboard path mirrors drag/drop behavior.
- [ ] Recorded GIF shows accepted vs rejected file flows.
- [ ] Error telemetry hook wired so Lane D reporting can track rejects.

## Status Log

- 2025-11-07 - Draft submitted for lane review.
