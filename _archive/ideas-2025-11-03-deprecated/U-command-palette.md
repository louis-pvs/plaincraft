# U-command-palette

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-notifications`
- **Contracts**:
  - Offer deterministic command palette with keyboard shortcut, search, and execution hooks.
  - Provide pluggable command list with analytics metadata for downstream tracking.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, command-palette, accessibility

## Contracts

- Deliver a consistent palette experience with built-in keyboard shortcut wiring and focus management.
- Expose extensibility hooks for analytics metadata and command grouping without bespoke implementations.

## Props + Shape

- `isOpen: boolean`
- `commands: Array<{ id: string; group?: string; label: string; run(): void }>`
- `onClose(): void`
- `onOpen(): void`
- `filterPlaceholder?: string`
- `shortcut?: string` — display + register (e.g., `Mod+K`).

## Behaviors

- Opening traps focus inside palette, closing restores focus to trigger.
- Up/Down arrow navigates results; Enter runs selected command, Escape closes.
- Filters commands live as user types, resets when palette closes.

## Status

- 2025-11-07 - Draft recorded for command palette unit.

## Accessibility

- Uses `role="dialog"` with `aria-modal="true"` and labelled regions.
- Announces command execution success/failure via live region when provided.

## Acceptance Checklist

- [ ] Shortcut and trigger flows covered in Storybook `play()` with keyboard-only walkthrough.
- [ ] Command filtering and execution tested, including error handling.
- [ ] Focus trapping validated for screen reader + keyboard users.
- [ ] Recorded GIF demonstrates open, search, execute, and close sequences.
- [ ] Analytics hooks documented for Lane D reporting.

## Status Log

- 2025-11-07 - Draft captured for planning.
