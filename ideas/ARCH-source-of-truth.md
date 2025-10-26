# ARCH-source-of-truth

Lane: C
Purpose: Make `/ideas` cards the single source of truth for Issues/PRs/changelog entries and automate lifecycle management.

Issue: #26

## Problem

Information about scope, acceptance criteria, and linked work drifts between idea files, Issues, PR bodies, and the changelog. Engineers must manually keep them in sync, leading to mismatched checklists, missing changelog lines, and dangling idea cards after Issues close.

## Proposal

1. Enhance the ideas → issues workflow to push metadata (acceptance criteria, linked IDs) into Issues, PRs, and changelog stubs from the idea file.
2. Allow cards to define sub-issues; automation should create/link child tickets when the idea indicates the work is large.
3. When an Issue closes, remove or archive the corresponding idea file automatically.
4. Update `scripts/create-worktree-pr.mjs`, changelog automation, and PR generators to source their content from the idea file rather than duplicating text.
5. Update guides/compliance docs to reflect the master-source behavior.

## Sub-Issues

3. **ARCH-ideas-changelog-sync** - Update changelog automation to pull entries from idea files
4. **ARCH-ideas-subissues** - Add support for Subissues section in idea files with auto-creation/linking
5. **ARCH-ideas-lifecycle** - Implement idea cleanup automation when Issues close (delete/archive with audit)
6. **ARCH-ideas-docs** - Update all guides to document the new source-of-truth workflow

## Acceptance Checklist

- [ ] PR generator and worktree script reference idea metadata (scope, acceptance checklist, linked Issue IDs).
- [ ] Changelog automation sources entries from idea files, **deprecating the `_tmp/` folder workflow**.
- [ ] Idea cards remain the single source of truth throughout issue lifecycle (creation → PR → merge → archive).
- [ ] Guides (`IDEAS-GUIDE.md`, `IDEAS-COMPLIANCE.md`, `SCRIPTS-REFERENCE.md`, `CI-STRATEGY.md`) updated to explain the new source-of-truth flow and `_tmp/` deprecation.
- [ ] Regression tests or dry-run outputs validate the end-to-end lifecycle.
