# U-step-timeline

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-comment-edit`
- **Contracts**:
  - Keep the current step in view with automatic scrolling/focus cues.
  - Paginate historical steps without losing semantic order or accessibility.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, timeline, accessibility

## Contracts

- Keep the active step visible with built-in focus and scrolling rules.
- Provide pagination helpers so long histories stay accessible without custom builds.

## Props + Shape

- `steps: Array<{ id: string; title: string; description: string; completed: boolean }>`
- `currentId: string`
- `onSelect?(id: string): void`
- `pageSize?: number`
- `onLoadMore?(): void`

## Behaviors

- Automatically scrolls to and highlights the current step when `currentId` changes.
- Provides "See more" pagination for prior steps with accessible summary.
- Allows keyboard navigation across steps with arrow keys/Enter.

## Status

- 2025-11-07 - Draft logged for step timeline unit.

## Accessibility

- Uses `aria-current="step"` and `role="list"` semantics.
- Announces pagination actions via polite live region.

## Acceptance Checklist

- [ ] Auto-scroll + focus behavior covered with integration tests.
- [ ] Pagination documented and accessible for keyboard + screen reader users.
- [ ] Storybook demos illustrate long timeline, pagination, and current-step highlight; GIF recorded.
- [ ] Guardrail ensures `aria-current` always assigned to exactly one step.
- [ ] Telemetry hook available for step change analytics.

## Status Log

- 2025-11-07 - Draft added for foundation review.
