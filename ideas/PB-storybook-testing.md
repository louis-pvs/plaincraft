# PB-storybook-testing

Lane: B (Narrative & Enablement)
Status: Draft

## Lane

- **Primary Lane:** B (Narrative & Enablement)
- **Partners:** Lane A (Foundations & Tooling) for component scaffolding, Lane C (DevOps & Automation) for test harness enforcement.
- **Labels:** documentation, storybook, testing

## Purpose

Document Storybook testing patterns—`play()` scripts, deterministic events, and flake mitigations—so demos and guardrails stay reliable.

## Problem

Teams author `play()` stories inconsistently, causing flaky tests, nondeterministic recordings, and unclear guidance for new contributors.

## Proposal

1. Capture best practices for `play()` authoring, including fixture setup and async handling.
2. Document deterministic event helpers, global delay usage, and flake killers.
3. Provide do/don’t tables with code samples and link to supporting scripts.

## Acceptance Checklist

- [ ] Code samples included showing deterministic `play()` usage.
- [ ] Do/don’t table highlights common pitfalls.
- [ ] Flake mitigation strategies documented with references.

## Status

- 2025-11-07 - Draft recorded for Storybook testing playbook page.

<!-- prettier-ignore -->
_Owner: @lane-b
