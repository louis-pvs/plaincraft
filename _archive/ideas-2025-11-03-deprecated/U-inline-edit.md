# U-inline-edit

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-comment-edit`
- **Contracts**:
  - Inline label edits always use optimistic state with guaranteed rollback on failure.
  - Deterministic recording hook (`tags:["record"]`) exposes the primary edit flow for docs.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, inline-edit, accessibility

## Contracts

- Guarantee Enter/Esc/blur flows map to optimistic save/cancel logic without manual branching.
- Expose deterministic recording metadata so documentation stays in sync with the component.

## Props + Shape

- `value: string` — current label text sourced from the backing model.
- `status: "idle" | "saving" | "error"` — drives optimistic UI and messaging.
- `onCommit(next: string): Promise<void>` — resolves once save succeeds; reject to trigger rollback.
- `onCancel(): void` — restores the last persisted value and exits edit mode.
- `label: string` — accessible label announced when focus enters edit mode.

## Behaviors

- Enter commits edits and transitions to `saving`; Esc cancels and restores the original value.
- Blur commits using the same optimistic path as Enter, including rollback on rejection.
- Exposes `data-record-id` so the recording harness can capture deterministic GIFs.

## Status

- 2025-11-07 - Logged in `Draft` to scope the inline edit unit and acceptance.

## Accessibility

- Announces save/rollback outcomes via `aria-live="polite"` region.
- Preserves focus on the editable element after optimistic commits complete.

## Acceptance Checklist

- [ ] Props, behaviors, and accessibility contract documented in Storybook (`docs` tab) and template README.
- [ ] Automated tests cover Enter, Esc, and blur flows with optimistic rollback.
- [ ] Deterministic `play()` story plus recorded GIF published for Lane B.
- [ ] a11y audit verifies announcements and focus order.
- [ ] Guardrail scenario added so future changes keep Enter/Esc semantics intact.

## Status Log

- 2025-11-07 - Draft captured by Lane A foundations.
