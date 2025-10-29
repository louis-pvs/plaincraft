# Ideas Playbook

The `/ideas` directory is Plaincraft’s source of truth for delivery work. Idea
cards seed GitHub Issues, pull requests, and release notes through automation—
if the card is correct, the downstream artifacts stay correct.

This guide explains how to structure idea files, how the sub-issue pipeline
behaves, and which scripts keep everything in sync.

## Folder Structure

```
ideas/
  <initiative>.md            # Brief: Problem / Signal / Hunch
  U-<slug>.md                # Unit ticket
  C-<slug>.md                # Composition ticket
  ARCH-<slug>.md             # Architecture work
  PB-<slug>.md               # Playbook updates
  B-<slug>.md                # Bug reports
```

- **Briefs** use `templates/ideas/idea-brief-template.md`.
- **Unit** cards mirror `templates/ideas/idea-unit-template.md`.
- **Composition** cards mirror `templates/ideas/idea-composition-template.md`.
- **Architecture** cards include Purpose, Problem, Proposal, Acceptance
  Checklist by default.

Each idea card **must exist before** the GitHub Issue or PR. The automation
copies content forward and keeps GitHub entities in sync with the card.

## Naming & Metadata

- Prefix with ticket family: `U-`, `C-`, `ARCH-`, `PB-`, `B-`.
- Titles follow the same slug that appears in Issues, PRs, and commits.
- Add `Lane: A|B|C|D` at the top of the file.
- After running `ideas-to-issues`, add `Issue: #<number>` (automation will
  inject this for you if you sync Issue → card).
- For child ideas, include `Parent: #<number> (ARCH-parent-slug)`.

## Automation Workflow

1. **Draft the idea card**
   - Fill in Purpose, Problem, Proposal, Acceptance Checklist.
   - Include a `## Sub-Issues` section for large architecture work (see below).

2. **Create the Issue**

   ```bash
   node scripts/ops/ideas-to-issues.mjs ARCH-subissue-pipeline-repair.md --yes
   ```

   - Generates the Issue with Purpose / Problem / Proposal / Acceptance
     Checklist.
   - Adds `## Sub-Issues` checklist to the parent Issue with a single,
     deduplicated section. Re-running the script replaces the section, it never
     appends duplicates.
   - Creates child Issues from matching idea files and links them back to the
     parent automatically.

3. **Spin up worktree & PR**

   ```bash
   node scripts/ops/create-worktree-pr.mjs <issue-number> --yes
   ```

   - Creates a dedicated worktree/branch.
   - Hydrates the PR body from the idea file.
   - For sub-issues, the PR body now starts with `Part of #<parent>` so reviewers
     see the hierarchy immediately.

4. **Merge sub-issues back to parent**

   ```bash
   node scripts/ops/merge-subissue-to-parent.mjs <child-issue-number> --yes
   ```

   - Merges the child branch into the parent branch.
   - Marks the parent Issue checklist entry as complete (checkbox flip to `[x]`).
   - Refreshes the parent PR body with a `## Sub-Issues Progress` section,
     including a numeric completion summary.
   - Removes the need for manual parent Issue/PR edits post-merge.

5. **Archive closed ideas**
   - Individual Issues: handled by `scripts/ops/archive-idea-for-issue.mjs`.
   - Retrofit cleanup (e.g., backlog of closed Issues): run
     `node scripts/ops/archive-closed-ideas.mjs --yes`.

6. **Keep cards in sync**
   - `node scripts/ops/sync-issue-to-card.mjs <issue>` pulls Issue content back
     into the card.
   - `node scripts/ops/sync-ideas-checklists.mjs` pushes Acceptance Checklist
     updates from cards to Issues.

## Sub-Issues Format

```markdown
## Sub-Issues

1. **ARCH-subissue-fix-duplicate-sections** - Prevent duplicate `## Sub-Issues` blocks
2. **ARCH-subissue-fix-pr-context** - Add parent context to sub-issue PRs
3. **ARCH-subissue-fix-parent-pr-update** - Auto-refresh parent PR after merges
```

Rules:

- Use numbered or bulleted list; the automation tolerates either.
- Child idea IDs must match filenames in `/ideas`.
- After running `ideas-to-issues`, the parent Issue converts entries to GitHub
  checkboxes (`- [ ] #123 Title`). Re-running the script preserves the existing
  checked/unchecked state.
- Child idea files inherit `Parent: #<parent-issue>` metadata automatically.

## Lifecycle Recap

```
Idea Card → ideas-to-issues → create-worktree-pr → merge-subissue-to-parent
    ↑             ↓                    ↓                     ↓
  Source     GitHub Issue          Child PR             Parent PR / Issue
```

- Cards stay authoritative until the Issue closes.
- Automation now manages Sub-Issue checklists and parent PR progress—no more
  manual edits after merging a child branch.
- Archive the card once the Issue is closed so `/ideas` only contains active
  work. Use `archive-closed-ideas.mjs` for batch cleanup.

## Quick Checklist

- [ ] Idea card exists (with metadata) before creating the Issue.
- [ ] Acceptance Checklist is actionable and at least 3 items.
- [ ] `## Sub-Issues` section uses automation-friendly format.
- [ ] Child PR body shows `Part of #<parent>` banner.
- [ ] After merging a child, run `merge-subissue-to-parent.mjs` to trigger the
      checklist + PR refresh.
- [ ] Closed cards move to `/ideas/_archive/<year>/`.

When in doubt, run the scripts in `--dry-run` mode first—they log the actions
they would take without mutating anything. For edge cases, escalate to Pair C
so we can adjust the automation rather than papering over inconsistency.
