# U-responsive-table

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for responsive demos, Lane C (DevOps & Automation) for visual regression coverage.
- **Labels:** unit, table, responsive

## Purpose

Provide a responsive table unit that collapses gracefully into card layouts while preserving semantic headers and accessibility.

## Problem

Current tables collapse inconsistently across breakpoints, often losing header context or forcing manual duplication of markup. This undermines mobile UX and accessibility.

## Proposal

1. Define props for columns, rows, responsive breakpoint, and render overrides.
2. Implement breakpoint-based collapse that keeps header metadata accessible in card layouts.
3. Build Storybook scenarios with resizing tests and record a demo for Playbook handoffs.

## Acceptance Checklist

- [ ] Table preserves header relationships in both table and card modes.
- [ ] Card view labels remain audible/visible after collapse.
- [ ] Resize test validates layout switches at configured breakpoints.

## Status

- 2025-11-07 - Draft recorded to steward responsive table unit.

<!-- prettier-ignore -->
_Owner: @lane-a
