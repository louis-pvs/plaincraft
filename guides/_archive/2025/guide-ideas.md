---
id: guide-ideas
owner: @louis-pvs
lane: D
artifact_id: ARCH-ideas-folder-pipeline
scaffold_ref: /templates/ideas@v0.1
version: 0.1.0
created: 2025-10-28
ttl_days: 90
last_verified: 2025-10-28
---

# When to use

- Planning a new Unit, Composition, or Architecture ticket
- Need to scaffold idea files that auto-populate GitHub Issues
- Ensuring idea documents meet CI validation requirements

# When not to use

- Creating standalone documentation without corresponding GitHub Issue
- Ad-hoc experimentation without formal ticket tracking
- Writing narrative briefs that won't become actionable work items

# Steps (all executable)

1. **Create idea file from template:**

   ```bash
   # Copy appropriate template
   cp templates/ideas/idea-unit-template.md ideas/U-your-slug.md
   # or
   cp templates/ideas/idea-composition-template.md ideas/C-your-slug.md
   # or
   cp templates/ideas/idea-brief-template.md ideas/initiative-name.md
   ```

2. **Validate idea structure:**

   ```bash
   pnpm run ideas:validate
   ```

3. **Create GitHub Issue from idea:**

   ```bash
   node scripts/ideas-to-issues.mjs U-your-slug.md
   # Dry-run preview:
   node scripts/ideas-to-issues.mjs --dry-run
   ```

4. **Create worktree and PR:**

   ```bash
   node scripts/create-worktree-pr.mjs <issue-number>
   ```

5. **Sync checklists (if modified):**
   ```bash
   node scripts/sync-ideas-checklists.mjs
   ```

# Rollback

- Delete idea file and close corresponding Issue
- Remove worktree: `git worktree remove <path> && git branch -D <branch>`

# Requirements

- Idea files must exist BEFORE creating Issues
- Naming: `U-<slug>.md`, `C-<slug>.md`, `ARCH-<slug>.md`, `PB-<slug>.md`, `B-<slug>.md`
- Required sections: Purpose, Problem, Proposal, Acceptance Checklist
- Lane metadata (A/B/C/D) specified
- Sub-issues use format: `1. **ARCH-tag** - Description`

# Links

- Templates: `/templates/ideas/`
- Validator: `/scripts/validate-ideas.mjs`
- Issue creator: `/scripts/ideas-to-issues.mjs`
- Worktree script: `/scripts/create-worktree-pr.mjs`
- Sync script: `/scripts/sync-ideas-checklists.mjs`
- Compliance checklist: `/guides/IDEAS-COMPLIANCE.md` (archived)
