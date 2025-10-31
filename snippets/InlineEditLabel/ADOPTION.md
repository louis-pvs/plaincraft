# Inline Editing Adoption Guide

Inline edits shrink the distance between noticing a typo and fixing it. The InlineEditLabel snippet carries most of the heavy lifting—focus management, optimistic saves, a11y, and transient messaging—so teams can wire their domain logic without rebuilding the experience.

## Current posture

- Default snippet already ships with optimistic-save UX, keyboard coverage, and minimal DOM footprint.
- Persistence lives behind the `onSave` seam; callers own domain validation and sanitisation.
- Tests: Vitest unit spec (`InlineEditLabel.spec.tsx`) and Storybook 9 interaction + docs smoke suite (`pnpm storybook:test`).

## Planned improvements

See `guides/contracts/inline-edit-label-plan.md` for the SOLID refactor roadmap. Key callouts:

- Controller logic will move into a headless `useInlineEditLabelController` hook.
- The default Tailwind view remains, but consumers can provide custom render props or slot components.
- Documentation will expand with headless examples and migration notes.

## Adoption checklist

1. **Inventory surfaces:** list every inline edit in your product, noting validation complexity and theming requirements.
2. **Choose integration mode:** decide between the default view (fastest path) or a custom view built on the headless controller.
3. **Wrap persistence:** implement `onSave` with domain validation and `maxLength` enforcement; surface user-facing copy in your team’s tone.
4. **Instrument errors:** log failed saves and track retries to catch regressions during rollout.
5. **Plan accessibility review:** screen reader and keyboard paths should be re-validated if you replace the default view.

## Rollout guardrails

- Ship behind a feature flag or rollout toggle.
- Run `pnpm storybook:test` to cover interaction flows and docs metadata checks in CI; the stories already import from `storybook/test`.
- Add a smoke test in your app (Playwright/Cypress) that hits the headless controller if you diverge from the default UI.
- Keep the 10-minute manual script handy for qualitative verification.

## Measuring success

- Time to first edit and completion rate per surface.
- Error rate (failed saves, validation blocks) before and after launch.
- Support tickets related to inline edits.
- Developer effort to theme/customise compared with the baseline component.
