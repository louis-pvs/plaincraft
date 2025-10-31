# C-<slug>

- **Lane**: <A/B/C/D> (note any handoffs)
- **Metric Hypothesis**: State the target metric change and measurement approach.
- **Invariants**: List non-negotiable contracts (analytics, accessibility, docs).

## Units In Scope

- `U-<slug>` — ownership + dependency notes.

## Status

- 2025-**-** - Created in `Draft`
- 2025-**-** - Branched after branch/PR guardrails transcript attached

## Acceptance Checklist

- [ ] All Units linked in Plaincraft Roadmap with lane labels.
- [ ] Metrics/analytics configured for launch.
- [ ] Rollout playbook drafted with fallback and support notes.
- [ ] `pnpm guardrails` passes locally (required before PR).
- [ ] `pnpm drift:check -- --paths ideas/C-<slug>.md` produces no violations.
