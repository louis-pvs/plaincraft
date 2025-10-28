---
id: guide-user-story
owner: @louis-pvs
lane: D
artifact_id: ARCH-user-story-workflow
scaffold_ref: /templates/user-story-template.md@v0.1
version: 0.1.0
created: 2025-10-28
ttl_days: 90
last_verified: 2025-10-28
---

# When to use

- Translating an approved idea into a backlog-ready ticket
- Syncing acceptance criteria across Issues, PRs, and changelog
- Planning a Unit (`U-*`) or Composition (`C-*`) for development

# When not to use

- Creating idea files (use guide-ideas.md instead)
- Writing narrative documentation
- Speccing architecture without concrete deliverables

# Steps (all executable)

1. **Copy user story template:**

   ```bash
   cp templates/user-story-template.md <destination>
   ```

2. **Fill required sections:**
   - Title: `[U-slug]` or `[C-slug]` + outcome statement
   - Persona & Need: As a... I want... So that...
   - Context: Link to `ideas/<slug>.md` and roadmap card
   - Scope: In/out of scope with Unit/Composition links
   - Acceptance Criteria: Checklist matching idea file
   - Metrics: Signal change and measurement plan
   - Rollout Plan: Feature flags, integration, communication
   - Dependencies: Tickets, analytics, docs, ops tasks

3. **Sync to GitHub Issue:**

   ```bash
   # Ensure idea file exists first
   node scripts/ideas-to-issues.mjs <slug>.md
   ```

4. **Create PR from Issue:**
   ```bash
   node scripts/create-worktree-pr.mjs <issue-number>
   ```

# Rollback

- Close Issue and delete branch
- Remove worktree: `git worktree remove <path>`

# Requirements

- Must reference existing idea file in `/ideas`
- Ticket ID prefix matches idea filename: `[U-*]`, `[C-*]`, etc.
- Acceptance criteria copy-pasteable to Issue template
- Every story links to roadmap Lane (A/B/C/D)
- Metrics defined for Compositions (optional for Units)

# Links

- Template: `/templates/user-story-template.md`
- Ideas guide: `/guides/guide-ideas.md`
- Issue creator: `/scripts/ideas-to-issues.mjs`
- Worktree script: `/scripts/create-worktree-pr.mjs`
