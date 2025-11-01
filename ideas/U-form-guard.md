# U-form-guard

- **Lane**: A (Foundations & Tooling)
- **Linked Composition**: `C-onboarding-light`
- **Contracts**:
  - Block navigation when forms are dirty and surface inline banner + beforeunload confirmation.
  - Release guard once save succeeds, ensuring status is reflected across router + window hooks.

## Lane

Lane: A (Foundations & Tooling)

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement), Lane C (DevOps & Automation)
- **Labels:** unit, form, accessibility

## Contracts

- Provide a unified guard for SPA + beforeunload flows so teams stop rolling bespoke solutions.
- Ensure banners, dialogs, and listeners stay synchronized as dirty state changes.

## Props + Shape

- `isDirty: boolean`
- `onConfirmNavigate(): void`
- `onStay(): void`
- `banner?: React.ReactNode`
- `beforeUnloadMessage?: string`

## Behaviors

- Registers/unregisters `beforeunload` listener when `isDirty` toggles.
- Presents inline banner with "Leave" vs "Stay" actions; selecting leave triggers `onConfirmNavigate`.
- Exposes imperative API for routers to ask guard permission programmatically.

## Status

- 2025-11-07 - Draft opened for form guard unit.

## Accessibility

- Inline banner uses `role="alert"` and focus management so messages are read immediately.
- Buttons include descriptive labels for confirm vs stay actions.

## Acceptance Checklist

- [ ] beforeunload + SPA routing guard scenarios covered by tests.
- [ ] Banner copy/CTA standardized and documented in Storybook.
- [ ] a11y audit confirms announcements and focus order.
- [ ] Recorded GIF shows dirty state, guard modal, and release after save.
- [ ] Guardrail ensures `isDirty` toggling updates listeners exactly once.

## Status Log

- 2025-11-07 - Draft queued for refinement.
