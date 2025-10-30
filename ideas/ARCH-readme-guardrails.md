# ARCH-readme-guardrails

Lane: C (DevOps & Automation)
Issue: 77

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** docs-governance, ci

## Purpose

Replace the legacy `/guides` governance checks with README- and template-first
guardrails so CI enforces the new documentation shape defined by the decision.

## Problem

Guides were previously linted for TTL, ratio, and duplication. After archiving
that surface:

- CI no longer verifies that every template-backed folder ships a README with
  the required headings and `scaffold_ref`.
- Nothing ensures Storybook docs and Playbook pages avoid duplicating README
  steps.
- Missing README coverage can slip by until developers get runtime errors.

## Proposal

1. Ship `scripts/checks/readme-lint.mjs` to validate headings, word count, owner
   tags, and `scaffold_ref` references.
2. Update `scripts/checks/template-coverage.mjs` to require README/USAGE/config
   per template and detect `// no-readme` exemptions.
3. Add `scripts/checks/view-dedupe.mjs` to compare README step blocks against
   Storybook docs and Playbook pages.
4. Wire new commands into `docs-governance.yml` and package scripts (`docs:lint`,
   `docs:views`) with warning-level enforcement for missing READMEs.
5. Document the guardrail expectations inside the decision ADR snippet.

## Acceptance Checklist

- [ ] `readme-lint.mjs` validates headings, word count, executable blocks, owner
      metadata, and `scaffold_ref`.
- [ ] `template-coverage.mjs` enforces README/USAGE/config presence and `// no-readme`
      exemptions.
- [ ] `view-dedupe.mjs` fails when Storybook or Playbook duplicates README step
      content.
- [ ] `docs-governance.yml` runs on template, README, Storybook, and Playbook
      changes using the new scripts.
- [ ] `package.json` exposes `docs:lint` and `docs:views` chaining the new checks.
