# U-snackbar-undo

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for recorded demos, Lane C (DevOps & Automation) for interaction guardrails.
- **Labels:** unit, snackbar, accessibility

## Purpose

Create a reusable snackbar unit that supports undo actions, progress timing, and predictable focus management for rollback flows.

## Problem

Rollback messaging varies across products: timers drift, undo actions vanish after focus loss, and assistive tech rarely hears updates. Without a standardized unit, compositions cannot guarantee reliable recovery.

## Proposal

1. Define props for message, timeout, undo callback, and optional progress display.
2. Implement timer-driven dismissal, undo activation, and focus trapping that respects surrounding UI expectations.
3. Validate with tests, deterministic Storybook stories, and record a demo showing undo + timeout behaviors.

## Acceptance Checklist

- [ ] Snackbar auto-dismisses on timeout with progress indicator.
- [ ] Undo callback executes and confirms completion.
- [ ] Focus order remains sane before, during, and after snackbar lifecycle.

## Status

- 2025-11-07 - Draft filed to standardize snackbar undo flows.

<!-- prettier-ignore -->
_Owner: @lane-a
