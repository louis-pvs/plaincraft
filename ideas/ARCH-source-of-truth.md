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

This work is broken down into the following focused tasks:

- [ ] #29 ARCH-ideas-issue-sync - Enhance ideas-to-issues to populate full metadata
- [x] #30 ARCH-ideas-pr-integration - Update PR generator and worktree script ✅
- [ ] #31 ARCH-ideas-changelog-sync - Update changelog automation, **deprecate `_tmp/` folder**
- [ ] #32 ARCH-ideas-subissues - Add support for Sub-Issues section
- [ ] #33 ARCH-ideas-lifecycle - Implement idea cleanup automation
- [ ] #34 ARCH-ideas-docs - Update all guides

## Acceptance Checklist

- [ ] PR generator and worktree script reference idea metadata (scope, acceptance checklist, linked Issue IDs).
- [ ] Changelog automation sources entries from idea files, **deprecating the `_tmp/` folder workflow**.
- [ ] Idea cards remain the single source of truth throughout issue lifecycle (creation → PR → merge → archive).
- [ ] Guides (`IDEAS-GUIDE.md`, `IDEAS-COMPLIANCE.md`, `SCRIPTS-REFERENCE.md`, `CI-STRATEGY.md`) updated to explain the new source-of-truth flow and `_tmp/` deprecation.
- [ ] Regression tests or dry-run outputs validate the end-to-end lifecycle.
