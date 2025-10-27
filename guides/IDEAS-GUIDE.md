# Ideas Playbook

The `/ideas` folder is the **single source of truth** for all work items in Plaincraft.
Idea files automatically populate GitHub Issues, PRs, and changelog entries through
automation, ensuring consistency across the entire development lifecycle.

This guide explains how to structure idea files to leverage the automated workflow.

## Folder Structure

```
ideas/
  <initiative>.md            # High-level brief (problem / signal / hunch)
  U-<slug>.md                # Unit-level details
  C-<slug>.md                # Composition-level details
  ...
```

- **Initiative briefs** use the free-form template in
  `templates/ideas/idea-brief-template.md`.
- **Unit files** mirror the data we expect in a Unit Issue template
  (`templates/ideas/idea-unit-template.md`).
- **Composition files** mirror the Composition Issue template
  (`templates/ideas/idea-composition-template.md`).

Each idea document should live in the repo before creating the corresponding
Issues, so the acceptance checklist and contracts can be copied forward.

## Naming Conventions

- Top-level briefs use a descriptive slug like `creator-onboarding-bridge.md`.
- **Unit files** prefixed with `U-`, e.g. `U-bridge-intro-card.md`.
- **Composition files** prefixed with `C-`, e.g. `C-creator-onboarding-bridge.md`.
- **Architecture files** prefixed with `ARCH-`, e.g. `ARCH-source-of-truth.md`.
- **Playbook files** prefixed with `PB-`, e.g. `PB-recording-standard.md`.
- **Bug files** prefixed with `B-`, e.g. `B-form-validation.md`.
- Slugs should match the final GitHub Issue titles and commit tags.

## Required Sections

| File type   | Required sections                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Brief       | Problem, Signal, Hunch, Notes, Tickets (links to Unit/Composition IDs)                             |
| Unit        | Lane, Linked Composition, Contracts, Props + Shape, Behaviors, Accessibility, Acceptance Checklist |
| Composition | Lane, Metric Hypothesis, Invariants, Units In Scope, Acceptance Checklist                          |

See `templates/ideas/` for copy-ready skeletons.

## Automated Workflow

Idea files are the master source - automation handles the rest:

1. **Draft** idea file under `/ideas` with all metadata (Purpose, Problem, Proposal, Acceptance Checklist).
2. **Create Issue** automatically:

   ```bash
   node scripts/ideas-to-issues.mjs <filename>
   ```

   - Extracts all sections from idea file
   - Populates Issue body with Purpose, Problem, Proposal, Acceptance Checklist
   - Adds source file link footer
   - Processes Sub-Issues if defined (creates child Issues with Parent: #N reference)

3. **Create worktree & PR** automatically:

   ```bash
   node scripts/create-worktree-pr.mjs <issue-number>
   ```

   - Creates dedicated worktree for parallel development
   - Generates PR body from idea file content
   - Links PR to Issue automatically

4. **Changelog generated** automatically on PR merge from idea file metadata
5. **Idea archived** automatically when Issue closes (moved to `/ideas/_archive/<year>/`)

### Manual Workflow (Legacy)

If automation is unavailable, manually:

- Copy sections from idea file to Issue template
- Reference idea file in Issue/PR descriptions
- Create changelog entry in `_tmp/*.md`
- Archive idea file after closure

## Sub-Issues Section

For large architectural work, define sub-issues in the parent idea file:

```markdown
## Sub-Issues

1. **ARCH-ideas-issue-sync** - Enhance ideas-to-issues script to populate full metadata
2. **ARCH-ideas-pr-integration** - Update PR generation to source from idea files
3. **ARCH-ideas-changelog-sync** - Generate changelog from idea files instead of \_tmp/
```

When creating the parent Issue, automation will:

- Create child Issues from corresponding idea files in `/ideas`
- Add `Parent: #N` reference to each child Issue
- Update parent Issue with task list: `- [ ] #N Child issue title`

### Sub-Issue Branching Strategy

- Parent worktree: `feat/parent-issue-branch`
- Child worktrees: `feat/child-issue-branch`
- Child branches merge to parent branch (not directly to main)
- Parent branch merges to main when all children complete

Use `scripts/merge-subissue-to-parent.mjs <child-issue-number>` to merge completed sub-issues.

## Relationship to Roadmap & PRs

- Idea files are the single source of truth - Issues and PRs derive from them
- Ticket IDs in idea files automatically flow to Issues, PR titles, and commit prefixes
- Purpose, Problem, Proposal, and Acceptance Checklist auto-populate Issues/PRs
- Keep idea files current - they remain the authoritative source until Issue closes
- After Issue closes, idea file is automatically archived to `/ideas/_archive/<year>/`

## Idea Lifecycle

```
Draft → Create Issue → Worktree/PR → Development → Merge → Archive
  ↓         ↓             ↓            ↓           ↓         ↓
/ideas    GitHub      Parallel     Git commits   Main    _archive/
          Issue       worktree                    branch
```

**Key Points:**

- Idea file created first (before Issue)
- Automation populates Issue/PR from idea file
- Idea file is the source of truth throughout development
- On Issue close, idea file automatically archived
- Git history preserves all versions

## Maintenance Checklist

- [ ] Every work item has an idea file before creating Issue
- [ ] Idea files include Purpose, Problem, Proposal, Acceptance Checklist sections
- [ ] Large architectural work defines Sub-Issues section
- [ ] Ticket IDs in `/ideas` match GitHub Issues and commits
- [ ] Idea files kept current during active development
- [ ] Automation scripts (ideas-to-issues, create-worktree-pr) working correctly
- [ ] Archived ideas moved to `/ideas/_archive/<year>/` after closure

Use `guides/IDEAS-COMPLIANCE.md` to audit existing idea files.
