# U-range-picker

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-quick-range-analytics`
- **Contracts**:
  - Emit ISO date pairs for presets and manual selections with timezone safety.
  - Guard invalid ranges and communicate errors without trapping users.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, date-range, accessibility

## Contracts

- Emit canonical ISO ranges for presets/manual selections while respecting timezone settings.
- Provide validation + messaging ensuring users can correct invalid inputs quickly.

## Props + Shape

- `value: { start: string; end: string }`
- `presets: Array<{ id: string; label: string; range: { start: string; end: string } }>`
- `timezone: string`
- `onChange(range: { start: string; end: string }): void`
- `onPresetSelect(id: string): void`
- `minDate?: string`
- `maxDate?: string`

## Behaviors

- Selecting a preset fires `onChange` with canonical ISO strings and highlights selection.
- Manual edits validate ranges, snapping end >= start; errors surface inline.
- Supports keyboard navigation across calendar grids and input fields.

## Status

- 2025-11-07 - Draft created for range picker unit.

## Accessibility

- Calendar grid exposes `aria-selected`, `aria-disabled`, and instructions for keyboard use.
- Announces preset selections and manual errors via polite live region.

## Acceptance Checklist

- [ ] Preset coverage verified with tests ensuring emitted ranges are correct.
- [ ] Manual editing guards documented and accessible.
- [ ] Storybook stories showcase presets, manual overrides, and error handling; GIF recorded.
- [ ] Integration sample with analytics export added to template README.
- [ ] Guardrail watcher ensures timezone changes do not break emission contract.

## Status Log

- 2025-11-07 - Draft logged for upcoming sprint sizing.
