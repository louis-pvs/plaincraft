# C-comment-edit

Lane: B (Narrative & Enablement)
Status: Draft

## Lane

- **Primary Lane:** B (Narrative & Enablement)
- **Partners:** Lane A (Foundations & Tooling) for unit integration, Lane D (Program Operations) for rollout comms.
- **Labels:** composition, collaboration, accessibility

## Metric Hypothesis

Lower comment edit error rate by 40% by pairing optimistic updates with clear undo and keyboard affordances.

## Units In Scope

- `U-inline-edit` — manage optimistic editing experience.
- `U-snackbar-undo` — offer rollback feedback.

## Purpose

Provide a canonical comment edit journey demonstrating optimistic save with reliable rollback and accessible keyboard workflow.

## Problem

Comment edits today often fail silently or lose original text, forcing manual refreshes and damaging trust. Keyboard flows differ per surface.

## Proposal

1. Compose inline edit with optimistic preview and failure handling.
2. Surface snackbar undo when errors hit, restoring prior text deterministically.
3. Document Storybook demos (success, failure) with keyboard walkthrough and GIF assets.

## Acceptance Checklist

- [ ] Rollback restores original comment text on failure.
- [ ] Keyboard edit path documented and tested start-to-finish.

## Status

- 2025-11-07 - Draft opened for comment edit composition.

<!-- prettier-ignore -->
_Owner: @lane-b
