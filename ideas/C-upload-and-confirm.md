# C-upload-and-confirm

Lane: B (Narrative & Enablement)
Status: Draft

## Lane

- **Primary Lane:** B (Narrative & Enablement)
- **Partners:** Lane A (Foundations & Tooling) for unit delivery, Lane D (Program Operations) for adoption playbook.
- **Labels:** composition, upload, accessibility

## Metric Hypothesis

Reduce failed upload retries by 25% through a guided drag/drop → preview → confirm flow with clear retry affordances.

## Units In Scope

- `U-dropzone` — manage file selection, validation, and previews.
- `U-snackbar-undo` — present retry/undo messaging after confirm.

## Purpose

Provide a reference upload experience that handles validation, preview curation, and confirmation messaging with polished documentation assets.

## Problem

Upload confirmations are inconsistent, making it hard to explain to stakeholders and testers. Oversized rejection flows vary, and retry affordances are easy to miss, hurting adoption.

## Proposal

1. Compose dropzone previews with per-item retry/remove and summary totals.
2. Drive confirmation state using snackbar undo to surface recovery paths.
3. Capture Storybook demos (happy path, rejection, retry) and publish GIF assets for Playbook.

## Acceptance Checklist

- [ ] Oversized files rejected with clear messaging.
- [ ] Retry path visible and usable after failure.
- [ ] GIF recorded demonstrating end-to-end flow.

## Status

- 2025-11-07 - Draft opened to track upload/confirm composition.

<!-- prettier-ignore -->
_Owner: @lane-b
