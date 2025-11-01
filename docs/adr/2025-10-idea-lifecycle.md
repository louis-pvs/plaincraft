# ADR 2025-10 Idea Lifecycle, Sources of Truth, and Enforcement Split

## Status

Accepted — 2025-10-28

## Context

Guides bloat and process drift made status untrustworthy. We needed one canonical workflow, one status source, and automated enforcement.

## Decision

- **Content SoT:** Issues/idea files.
- **Status SoT:** GitHub Projects (custom fields).
- **Docs split:** Canonical in `/docs/workflows`, unit steps in READMEs, Storybook for behavior, Playbook for narrative.
- **Enforcement:** Lane C via commit/PR checks and dashboards.

## Consequences

- Clear ownership (D/B/A/C).
- Faster onboarding and smaller docs.
- Policy changes require D approval; C cannot silently alter rules.

## Review

Revisit in 6 months or if >3 exceptions are granted in a quarter.
