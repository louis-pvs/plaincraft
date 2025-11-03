# U-debounced-search

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-search-refine`
- **Contracts**:
  - Issue debounced query callbacks at most once per interval per unique term.
  - Manage filter chips and clear/reset states without reimplementing keyboard logic downstream.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, search, accessibility

## Contracts

- Provide a first-class debounced query emitter with chip management and reset semantics.
- Ensure keyboard-only workflows remain accessible while chips and queries synchronize.

## Props + Shape

- `value: string` — current query text.
- `debounceMs: number` — interval before triggering `onSearch`.
- `chips: Array<{ id: string; label: string }>` — active filters.
- `onSearch(term: string): void` — invoked after debounce interval.
- `onToggleChip(id: string): void` — toggles filter chips.
- `onClear(): void` — resets query and chips.

## Behaviors

- Typing queues debounced search, cancelling prior timers on each keystroke.
- Chip add/remove works with click or keyboard activation and replays search when filters change.
- Clear button resets state, fires `onSearch("")`, and announces the reset.

## Status

- 2025-11-07 - Logged in `Draft` to govern debounced search unit.

## Accessibility

- Associates input with accessible label and helper text for debounce hinting.
- Announces chip additions/removals and clear actions via live region.

## Acceptance Checklist

- [ ] Debounce tests cover rapid typing and terminal term submission.
- [ ] Chip interactions documented and verified for keyboard-only use.
- [ ] Clear/reset flow emits telemetry and a11y announcements.
- [ ] Storybook `play()` story exercises debounce, chip toggle, and clear flows; GIF recorded.
- [ ] Unit exported through codemod/template with guardrail lint coverage.

## Status Log

- 2025-11-07 - Draft captured for backlog review.
