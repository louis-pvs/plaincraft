# U-field-error

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-billing-method`
- **Contracts**:
  - Surface asynchronous validation errors with delayed messaging to avoid flicker.
  - Provide retry clearing logic so successful validations remove stale errors.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, field, validation

## Contracts

- Normalize async validation flows with consistent pending/error/success states.
- Ensure retries clear stale errors and update messaging predictably.

## Props + Shape

- `value: string`
- `label: string`
- `description?: string`
- `validate(value: string): Promise<{ ok: boolean; message?: string }>`
- `onChange(next: string): void`
- `status: "idle" | "validating" | "error" | "success"`

## Behaviors

- Debounces validation calls, displaying spinner while pending.
- On validation failure, shows inline error and announces message; success clears.
- Offers `retry()` method to re-run validation after external fix.

## Status

- 2025-11-07 - Draft logged for field error unit.

## Accessibility

- Links error text to input via `aria-describedby`.
- Announces validation state changes via live region.

## Acceptance Checklist

- [ ] Async validation tests cover delayed error + retry flows.
- [ ] Error messaging templates documented and localized.
- [ ] Storybook stories demonstrate success, failure, and retry; GIF captured.
- [ ] Guardrail ensures validation promises handle race conditions (latest result wins).
- [ ] a11y smoke verifies announcements and focus persistence.

## Status Log

- 2025-11-07 - Draft staged for backlog sizing.
