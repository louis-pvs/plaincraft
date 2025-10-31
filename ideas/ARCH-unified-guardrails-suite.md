# ARCH-unified-guardrails-suite

Lane: C (DevOps & Automation)
Issue: (pending)

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Partners:** Lane B for documentation handoff, Lane D for backlog surfacing.

## Purpose

Provide a single entry-point command (and CI workflow) that runs every guardrail
lint and test Lane C owns—spanning scripts, docs, PR templates, recordings,
ideas—and publishes a consumable report so other lanes know what failed and why.

## Problem

We have many discrete lint/test commands (`readme-lint`, `template-coverage`,
`pr-template-lint`, `policy-lint`, `view-dedupe`, `validate-ideas`, recording
checks). Developers forget the full suite, guardrails drift out of sync, and CI
errors are scattered. Without a universal orchestrator:

- Contributors skip required checks or run only a subset.
- Lane B cannot document a reliable “one command before PR” flow.
- CI pipelines duplicate effort and miss failures when new checks land.

## Proposal

1. Create a top-level script (`scripts/checks/guardrails.mjs` or similar) that
   orchestrates all lint/test commands with structured output (JSON + text).
2. Expose `pnpm guardrails` (full suite) and `pnpm guardrails:docs|scripts|ci`
   subsets for faster local iteration.
3. Update CI (e.g., `.github/workflows/ci.yml`) to call the universal guardrail
   command and surface a single summary artifact.
4. Work with Lane B to document the new flow (Lane B owns developer-facing
   narrative; Lane C supplies command descriptions and machine-readable output).
5. Ensure failures map back to idea/decision IDs so backlog pilots can trace
   guardrail coverage.

## Acceptance Checklist

- [ ] Universal guardrail script orchestrates lint/tests across docs, scripts,
      PR templates, ideas, recording validations, etc., with consistent exit codes.
- [ ] `package.json` exposes `pnpm guardrails` (full) plus scoped variants.
- [ ] CI workflow updated to run the universal command and publish summary
      output/log artifacts.
- [ ] Lane B documentation updated with the new “one command before PR” flow,
      referencing the guardrail script (Lane C provides technical appendix).
- [ ] Report output includes identifiers (ticket/idea IDs) so backlog reviews can
      map failures to cards.
