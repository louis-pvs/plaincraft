# U-range-picker

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for docs + demos, Lane C (DevOps & Automation) for date validation tooling.
- **Labels:** unit, date-range, accessibility

## Purpose

Provide a date range picker unit with quick presets, ISO-safe outputs, and robust accessibility to back analytics and scheduling flows.

## Problem

Date range widgets across the app produce inconsistent formats, lack quick preset support, and struggle with manual edits versus preset snaps. This causes analytics bugs and confusing UX.

## Proposal

1. Define props covering value, presets, time zone handling, and callbacks.
2. Implement preset shortcuts emitting ISO ranges, manual entry validation, and guardrails for invalid spans.
3. Deliver keyboard/a11y coverage, Storybook `play()` demos, and a recordable flow for Playbook usage.

## Acceptance Checklist

- [ ] Quick presets emit correct ISO date ranges.
- [ ] Manual edits guard against invalid spans with feedback.
- [ ] Accessibility coverage verified (labels, focus order, SR announcements).

## Status

- 2025-11-07 - Draft opened to standardize range picker unit.

<!-- prettier-ignore -->
_Owner: @lane-a
