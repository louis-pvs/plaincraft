# C-quick-range-analytics

Lane: B (Narrative & Enablement)
Status: Draft

## Lane

- **Primary Lane:** B (Narrative & Enablement)
- **Partners:** Lane A (Foundations & Tooling) for unit upkeep, Lane C (DevOps & Automation) for data pipeline hooks.
- **Labels:** composition, analytics, responsive

## Metric Hypothesis

Accelerate analytics exploration by enabling users to answer common questions within 30 seconds using preset ranges and responsive data views.

## Units In Scope

- `U-range-picker` — drive preset + manual range selection.
- `U-responsive-table` — show metrics in table/card format that adapts to screen size.

## Purpose

Demonstrate a quick analytics slice with preset date ranges, responsive layout, and export guidance suitable for customer demos and training.

## Problem

Analytics dashboards currently require manual date entry and struggle to adapt on smaller screens, leading to support tickets and poor adoption.

## Proposal

1. Pair range presets with manual overrides, verifying ISO output for downstream queries.
2. Render responsive analytics table with export CTA and fallback messaging.
3. Publish Storybook demos (desktop, mobile) and GIF assets capturing range interactions.

## Acceptance Checklist

- [ ] Preset ranges emit correct ISO values for analytics queries.
- [ ] Table collapses into cards at the documented breakpoint.

## Status

- 2025-11-07 - Draft noted to steer quick range analytics composition.

<!-- prettier-ignore -->
_Owner: @lane-b
