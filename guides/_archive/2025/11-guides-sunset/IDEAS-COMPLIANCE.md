# Ideas Folder Compliance Checklist

Use this checklist whenever you touch `/ideas`. It keeps idea cards aligned
with the automation that feeds GitHub Issues, PRs, and the changelog.

## Pre-Issue Requirements

- [ ] Idea card exists before creating the Issue.
- [ ] Purpose, Problem, Proposal, Acceptance Checklist populated.
- [ ] Lane metadata present (`Lane: A|B|C|D`).
- [ ] File prefix matches ticket type (`U-`, `C-`, `ARCH-`, `PB-`, `B-`).

## Structure

- [ ] Initiative briefs live at `ideas/<slug>.md` (Problem / Signal / Hunch / Notes / Tickets).
- [ ] Unit cards follow the Unit template (Contracts, Props + Shape, Behaviors, Accessibility).
- [ ] Composition cards follow the Composition template (Metric Hypothesis, Invariants, Units In Scope).
- [ ] Architecture cards contain full purpose/problem/proposal narrative.
- [ ] No orphan files in `/ideas`—every card maps to a live or archived Issue.

## Content & Linking

- [ ] Ticket IDs in the title match commit/PR prefixes (`[U-…]`, `[ARCH-…]`, etc.).
- [ ] `Issue: #<number>` present once the Issue is created (automation can backfill).
- [ ] Child cards include `Parent: #<number> (ARCH-parent-slug)` metadata.
- [ ] Acceptance Checklist items are testable and drive review gates.
- [ ] Sub-Issue descriptions reference the matching idea file slug.

## Sub-Issue Section

- [ ] Parent card includes `## Sub-Issues` when work requires breakdown.
- [ ] Entries use automation-friendly format (numbered or bulleted list with `ARCH-slug`).
- [ ] Matching child idea files exist in `/ideas`.
- [ ] After running `ideas-to-issues`, the parent Issue shows a single
      `## Sub-Issues` checklist—reruns replace the section instead of appending.
- [ ] Parent Issue checklist is managed by automation (no manual edits after merge).
- [ ] Parent PR body contains `## Sub-Issues Progress` with up-to-date status.

## Automation Guardrails

- [ ] `scripts/ops/ideas-to-issues.mjs` successfully parses the card (headings intact).
- [ ] `scripts/ops/create-worktree-pr.mjs` hydrates the PR body with parent context.
- [ ] `scripts/ops/merge-subissue-to-parent.mjs` runs after each child merge to:
  - mark the parent Issue checklist `[x]` for that child.
  - refresh the parent PR progress section.
- [ ] `scripts/ops/sync-ideas-checklists.mjs` used when Acceptance Checklist changes.
- [ ] Batch cleanup uses `scripts/ops/archive-closed-ideas.mjs` (or the per-issue variant) so `/ideas` only contains active work.

## Lifecycle

- [ ] Idea card kept current through delivery; GitHub Issue/PR remain derivatives.
- [ ] Upon closure, the card moves to `/ideas/_archive/<year>/`.
- [ ] Roadmap entries reference the same ticket IDs and lanes as the idea file.
- [ ] Changelog entries inherit the same slug/tag used in the idea file.

Document any deviations and sync with Pair C before merging—manual edits outside
these workflows risk desynchronising the automation.
