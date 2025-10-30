# ARCH-autodocs-readme-handshake

Lane: A (Foundations & Docs Automation)
Issue: (pending)

## Lane

- **Primary Lane:** A (Foundations & Docs Automation)
- **Partners:** Lane B for narrative copy review, Lane C for guardrail signals.

## Purpose

Ensure component Autodocs and interaction tests remain the canonical “view”
experience after `/guides` deprecation by wiring template-owned READMEs into the
documentation tooling.

## Problem

Guides previously hosted the developer walkthroughs that Autodocs and Storybook
examples linked against. With `/guides` archived, there is no guarantee that:

- Autodocs pages reference the new README entry points.
- Interaction tests cover the executable flows described in each README.
- Template version references (`scaffold_ref`) stay in sync with the docs build.

Without alignment, developers will land on stale Autodocs content or failing
interaction tests that still expect the guide-era flows.

## Proposal

1. Audit each Storybook Autodocs page to replace guide links with owning template
   README links.
2. Update interaction tests to exercise the README “Scaffold” + “Test” steps so
   CI catches drift immediately.
3. Extend the Autodocs MDX loader to surface the template `scaffold_ref`
   alongside component metadata.
4. Add contract tests ensuring every component with Autodocs has a matching
   README owner line and template reference.

## Acceptance Checklist

- [ ] All Autodocs MDX files reference `/templates/<name>/README.md` instead of
      `/guides/*`.
- [ ] Interaction tests cover the steps listed in README “Scaffold” and “Test”
      sections for affected components.
- [ ] Autodocs metadata surfaces the template `scaffold_ref` and owner handle.
- [ ] Contract test fails if a component Autodocs entry lacks a README link or
      owner.
- [ ] Handoff note posted to Lane B confirming doc navigation updates.
