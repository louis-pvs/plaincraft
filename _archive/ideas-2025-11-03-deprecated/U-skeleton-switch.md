# U-skeleton-switch

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-notifications`
- **Contracts**:
  - Toggle between skeleton and loaded content without leaking hidden markup to assistive tech.
  - Expose accessible switch state so loading vs ready is clear to all users.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, skeleton, accessibility

## Contracts

- Provide shared skeleton infrastructure that hides loading markup from assistive tech.
- Synchronize switch state and events across loading/loaded views for reuse.

## Props + Shape

- `loading: boolean`
- `label: string`
- `skeleton: React.ReactNode`
- `children: React.ReactNode`
- `onToggle?(next: boolean): void`

## Behaviors

- Renders skeleton content when `loading === true`, adding `aria-hidden="true"` to hide from SRs.
- Switch control updates `aria-checked` and invokes `onToggle` when present.
- Smoothly transitions between states to avoid layout jumpiness.

## Status

- 2025-11-07 - Draft captured for skeleton switch unit.

## Accessibility

- Associates switch with description clarifying what loads when toggled.
- Ensures skeleton markup is hidden from focus order and SR output.

## Acceptance Checklist

- [ ] Skeleton visibility toggled with proper `aria-hidden` attributes.
- [ ] Switch state reflected via `aria-checked` and text updates.
- [ ] Storybook stories capture loading vs ready flows; GIF recorded for docs.
- [ ] Guardrail ensures skeleton markup never leaks when loaded content visible.
- [ ] Unit tests cover accessibility attributes and toggle events.

## Status Log

- 2025-11-07 - Draft logged for lane planning.
