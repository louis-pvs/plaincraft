---
id: guide-workflow
owner: @louis-pvs
lane: D
artifact_id: ARCH-ideas-workflow
scaffold_ref: /templates/ideas@v0.1
version: 0.1.0
created: 2025-10-28
ttl_days: 90
last_verified: 2025-10-28
---

# When to use

- Planning and executing a new Unit, Composition, or Architecture ticket
- Translating ideas into backlog-ready GitHub Issues
- Full workflow from concept to PR creation

# When not to use

- Ad-hoc changes without ticket tracking
- Standalone documentation without Issues
- Experimental work not ready for formal tracking

# Steps (all executable)

1. **Create idea file:**

   ```bash
   # Seed reusable templates (run once per clone)
   pnpm ideas:init --yes

   # Copy appropriate template
   cp templates/ideas/idea-unit-template.md ideas/U-your-slug.md
   # or
   cp templates/ideas/idea-composition-template.md ideas/C-your-slug.md
   ```

2. **Validate structure:**

   ```bash
   pnpm run ideas:validate
   ```

3. **Create GitHub Issue:**

   ```bash
   node scripts/ideas-to-issues.mjs U-your-slug.md
   ```

4. **Create worktree and PR:**

   ```bash
   node scripts/create-worktree-pr.mjs <issue-number>
   ```

   - Copies `node_modules` from the source checkout so `pnpm` works in sandboxed worktrees without network access.

5. **Sync checklists (if needed):**
   ```bash
   node scripts/sync-ideas-checklists.mjs
   ```

# GitHub CLI quick reference

- **List open issues:** `gh issue list --state open --json number,title,state` (filter with `--label lane:C`, etc.)
- **View current PR details:** `gh pr view --json title,body,labels` (append `--web` to open in browser)
- **Stream workflow/job logs:** `gh run view <run> --log` (handles pagination + auth)
- **Seed idea workspace templates:** `pnpm ideas:init` (use `--yes` to write files)
- **Convert idea to tracked issue:** `pnpm ideas:create <idea-file>` (wraps `scripts/ops/ideas-to-issues.mjs`)
- **Sync idea checklist with Issue:** `pnpm ideas:sync` (mirrors checklist state both directions)

# Rollback

- Delete idea file and close Issue
- Remove worktree: `git worktree remove <path> && git branch -D <branch>`

# Requirements

- Idea file must exist BEFORE creating Issue
- Seed `ideas/_templates/` via `pnpm ideas:init --yes` on fresh clones to avoid manual copying
- Naming: `U-<slug>.md`, `C-<slug>.md`, `ARCH-<slug>.md`, `PB-<slug>.md`
- Required sections: Purpose, Problem, Proposal, Acceptance Checklist
- Lane metadata (A/B/C/D) specified

# Links

- Templates: `/templates/ideas/`, `/templates/issue-unit/`, `/templates/issue-composition/`, `/templates/pull-request/`
- Validation + generation: `/scripts/validate-ideas.mjs`, `/scripts/ops/generate-pr-content.mjs`
- Issue + worktree automation: `/scripts/ideas-to-issues.mjs`, `/scripts/create-worktree-pr.mjs`
- Checklist sync: `/scripts/sync-ideas-checklists.mjs`
