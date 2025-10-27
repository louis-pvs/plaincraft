# Ideas Folder Compliance Checklist

Run this checklist whenever you add or revise idea documents. It keeps `/ideas`
aligned with the source-of-truth workflow, automation, and Issue/PR/changelog
requirements.

## Pre-Issue Requirements

- [ ] **Idea file must exist before creating Issue** - no Issues without corresponding idea files
- [ ] Idea file includes all required sections: Purpose, Problem, Proposal, Acceptance Checklist
- [ ] Lane specified in idea file metadata (A, B, C, or D)
- [ ] File naming follows prefix conventions (`U-`, `C-`, `B-`, `ARCH-`, `PB-`)

## Structure

- [ ] Every initiative has a base brief (`ideas/<slug>.md`) using the Problem /
      Signal / Hunch / Notes / Tickets format.
- [ ] Each Unit idea lives in `ideas/U-<slug>.md` and follows the Unit template.
- [ ] Each Composition idea lives in `ideas/C-<slug>.md` and follows the
      Composition template.
- [ ] Architecture ideas in `ideas/ARCH-<slug>.md` with full problem/proposal sections
- [ ] No stray files in `/ideas` (all entries mapped to tickets or archived).

## Content Requirements

- [ ] Ticket IDs in the idea files match expected commit/PR prefixes
      (`[U-…]`, `[C-…]`, `[B-…]`, `[ARCH-…]`, `[PB-…]`).
- [ ] **Purpose** field clearly states the goal of the work
- [ ] **Problem** section explains what needs solving and why
- [ ] **Proposal** section outlines the solution approach
- [ ] Acceptance checklists are actionable and testable
- [ ] Unit docs include: Lane, Linked Composition, Contracts, Props + Shape,
      Behaviors, Accessibility, Acceptance Checklist.
- [ ] Composition docs include: Lane, Metric Hypothesis, Invariants, Units In
      Scope, Acceptance Checklist.
- [ ] Briefs list the associated Unit/Composition ticket IDs under **Tickets**.

## Sub-Issues Section (for large architectural work)

- [ ] Parent idea file includes `## Sub-Issues` section if work needs breakdown
- [ ] Sub-issues listed in format: `1. **ARCH-tag** - Description`
- [ ] Each sub-issue tag has corresponding idea file in `/ideas`
- [ ] Parent idea file includes `Parent: #N` metadata in child idea files
- [ ] Sub-issue acceptance criteria are focused and specific

## Cross-linking & Source of Truth

- [ ] **Idea file is the source of truth** - Issues/PRs derive content from it
- [ ] `Issue: #N` metadata added to idea file after Issue creation
- [ ] Issues automatically populated using `scripts/ideas-to-issues.mjs`
- [ ] PRs automatically generated using `scripts/create-worktree-pr.mjs`
- [ ] Idea file kept current throughout development lifecycle
- [ ] No manual duplication of content between idea file and Issue/PR
- [ ] Plaincraft Roadmap entries reference the same ticket IDs and lane labels.
- [ ] Changelog entries use the same tags as the idea / ticket (for later
      release notes).

## Templates & Guides

- [ ] `templates/ideas/*.md` reflects the latest Issue template sections.
- [ ] `guides/IDEAS-GUIDE.md` mirrors the current process and naming rules.
- [ ] `protocol.md` references the Ideas guide for Pair D ownership.

## Automation Compatibility

- [ ] Idea files parseable by `scripts/ideas-to-issues.mjs` (consistent heading structure)
- [ ] Idea files parseable by `scripts/create-worktree-pr.mjs` for PR body generation
- [ ] Sub-Issues section follows format: `## Sub-Issues` with numbered list
- [ ] Parent: #N metadata format consistent across child idea files
- [ ] Idea files work with `scripts/consolidate-changelog.mjs` for changelog generation
- [ ] `.github/pipeline-config.json` doesn't require updates when new idea types
      are added (if it does, update the config first).

## Lifecycle Compliance

- [ ] Idea file exists before Issue creation (no Issues without idea files)
- [ ] Idea file archived to `/ideas/_archive/<year>/` after Issue closes
- [ ] Git history preserves all idea file versions
- [ ] `Issue: #N` metadata tracks GitHub Issue linkage

Document any deviations and raise them with Pair D before merging.
