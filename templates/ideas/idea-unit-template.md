# U-<slug>

- **Lane**: <A/B/C/D>
- **Linked Composition**: `C-<slug>`
- **Contracts**: Describe the core responsibility for this Unit (what invariant it guards).

## Props + Shape

- `propName` (type, required/optional) — short rationale.

## Behaviors

- Bullet list of behavioral guarantees (state transitions, events, retries).

## Status

- 2025-**-** - Created in `Draft`
- 2025-**-** - Advanced to `<Status>` after guardrails dry-run transcript attached

## Accessibility

- Bullet list of focus order, keyboard support, aria expectations.

## Acceptance Checklist

- [ ] Observable validation item (storybook, tests, monitoring).
- [ ] Documentation/readme update.
- [ ] Rollout/playbook task.
- [ ] `pnpm guardrails` passes locally (required before PR).
- [ ] `pnpm drift:check -- --paths ideas/U-<slug>.md` produces no violations.
