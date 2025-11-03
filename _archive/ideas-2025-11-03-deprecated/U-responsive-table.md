# U-responsive-table

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-search-refine`
- **Contracts**:
  - Preserve table semantics while collapsing to cards under configurable breakpoints.
  - Provide utilities for mapping headers to card labels so context is never lost.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, table, responsive

## Contracts

- Maintain semantic table structure above breakpoint and card mappings below breakpoint.
- Supply helpers for header → label mapping so downstream teams avoid duplicating logic.

## Props + Shape

- `columns: Array<{ id: string; header: string; render(row): React.ReactNode }>`
- `rows: Array<{ id: string; [key: string]: unknown }>`
- `breakpoint: number` — width in px triggering card mode.
- `getCardSections(row): Array<{ label: string; value: React.ReactNode }>`
- `emptyState?: React.ReactNode`

## Behaviors

- Renders semantic `<table>` above breakpoint with thead/tbody structure.
- Below breakpoint, swaps to cards with header/value pairs generated via `getCardSections`.
- Emits resize events for analytics once per layout change.

## Status

- 2025-11-07 - Draft added to govern responsive table unit.

## Accessibility

- Table mode preserves `<th scope="col">`; card mode uses `aria-labelledby` to map headers.
- Announces layout changes via live region when breakpoint crosses.

## Acceptance Checklist

- [ ] Layout swap covered with integration test simulating resize events.
- [ ] Empty state visible in both table and card modes.
- [ ] Storybook demos include desktop, tablet, and mobile breakpoints; GIF recorded.
- [ ] a11y audit confirms header relationships retained.
- [ ] Guardrail ensures header labels provided whenever card mode active.

## Status Log

- 2025-11-07 - Draft enqueued for refinement.
