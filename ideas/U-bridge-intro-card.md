# U-bridge-intro-card

Lane: D
Linked Composition: `C-creator-onboarding-bridge`

## Lane

- **Primary Lane:** D (Experience & Narrative)
- **Handoff:** Coordinate with Composition `C-creator-onboarding-bridge` for copy and analytics.

## Contracts

- Surface the three onboarding steps and route to each Unit.
- Maintain a single source of truth for checklist completion state.
- Emit analytics events whenever the CTA is displayed or triggered.

## Props + Shape

- `headline` (string, required) — sets the primary contract statement.
- `steps` (array of `{ id: U-*, label: string, done: boolean }`, required) — drives checklist state.
- `ctaLabel` (string, optional, default `Start building`) — primary action copy.
- `onStart` (function, required) — called when the CTA is activated; must be idempotent.

## Behaviors

- Render the steps in the order passed without re-sorting.
- Disable the CTA until at least one Unit reports readiness via `steps[].done`.
- Emit `onStart` once per activation and gate duplicate submissions.

## Accessibility

- Places focus on the first incomplete checklist item when rendered.
- Provides `aria-describedby` links for each step’s help text.
- Supports keyboard navigation through steps with Arrow keys and toggles completion with Space.

## Acceptance Checklist

- [ ] Storybook story documents default, partial, and complete states.
- [ ] Unit README captures contracts for `steps` data shape and analytics events.
- [ ] a11y review confirms focus order and keyboard support.
- [ ] Rollout plan added to project with fallback variant ready.
