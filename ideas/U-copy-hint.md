# U-copy-hint

Lane: A (Foundations & Tooling)
Status: Draft

## Lane

- **Primary Lane:** A (Foundations & Tooling)
- **Partners:** Lane B (Narrative & Enablement) for Storybook narrative + GIF, Lane C (DevOps & Automation) for clipboard guardrails.
- **Labels:** unit, clipboard, accessibility

## Purpose

Ship a reusable copy-to-clipboard unit that surfaces countdown hints, resilient fallbacks, and a deterministic recording path for documentation.

## Problem

Copy interactions are inconsistent across the product: some lack keyboard triggers, others miss fallbacks when the Clipboard API fails, and announcements rarely reach assistive tech. This fragmentation blocks Playbook demos and tests.

## Proposal

1. Define props for target value, countdown duration, and callbacks for success/error.
2. Implement keyboard + pointer triggers with countdown hinting, auto-dismiss, and fallback textarea copy when the Clipboard API is unavailable.
3. Provide Storybook stories with live region messaging, plus `play()` and recordable flow for Lane B assets.

## Acceptance Checklist

- [ ] Clipboard fallback path handles unsupported browsers gracefully.
- [ ] Keyboard-only path (Enter/Space) copies and announces success.
- [ ] Live region updates surface countdown + success/failure messaging.
- [ ] Storybook record story captured for Playbook usage.

## Status

- 2025-11-07 - Draft logged to standardize copy hint unit coverage.

<!-- prettier-ignore -->
_Owner: @lane-a
