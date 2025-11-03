Closes #<tag-filter-issue-number>

## Why this matters

Adds fast Tag-based filtering to speed large workspace navigation (>50 recordings) and reduce scroll fatigue.

## Summary of Changes

- TagFilter component with controlled selection state
- Integrated filtering logic in RecordingList controller
- Added unit tests for filtering reducer
- Updated docs to cover tagging workflow

## Acceptance Alignment

- [x] Tag multi-select renders above list
- [x] Filtering updates list instantly
- [x] Empty selection shows all items
- [x] Docs updated

## CI / Quality

- [x] Lint passes
- [x] Unit tests pass
- [x] Storybook interaction test added

## Checklist

- [x] Issue link present (Closes #123)
- [x] Rationale summarized
- [x] No unrelated changes

<!-- Guidance: Keep Summary of Changes high-level; Acceptance Alignment mirrors issue criteria. -->
