# Migration Guide: From Ideas Workflow to Standard GitHub Workflow

**Audience:** Contributors who previously used the ideas workflow  
**Effective Date:** 2025-11-03  
**Document Owner:** Lane B (Narrative & Enablement)

## Overview

The ideas workflow (markdown files in `/ideas/` with GitHub Projects integration) has been deprecated. This guide helps you transition to standard GitHub workflows for feature planning and tracking.

## Quick Reference

| Old Workflow                                    | New Workflow                                |
| ----------------------------------------------- | ------------------------------------------- |
| Create idea file                                | Create GitHub Issue directly                |
| Run `ops/idea-intake.mjs`                       | Use GitHub CLI or web UI                    |
| Edit idea frontmatter                           | Update issue description/labels             |
| Run `validate-ideas.mjs`                        | Not needed                                  |
| Sync checklist with `sync-ideas-checklists.mjs` | Edit issue directly                         |
| Check project board                             | View Issues tab / Project Boards (optional) |
| Archive closed ideas                            | GitHub auto-closes issues                   |

## Detailed Migration

### 1. Creating New Work Items

#### Old Way (Deprecated)

```bash
# Copy template
cp templates/ideas/idea-unit-template.md ideas/U-my-feature.md

# Edit frontmatter and content
vim ideas/U-my-feature.md

# Run intake
pnpm ops:idea-intake --file ideas/U-my-feature.md --lane A
```

#### New Way

```bash
# Create issue via GitHub CLI
gh issue create \
  --title "[U-my-feature] Add feature" \
  --body "$(cat issue-template.md)" \
  --label "lane:A" \
  --label "type:unit"

# Or use the GitHub web UI
# 1. Go to Issues tab
# 2. Click "New Issue"
# 3. Fill in title, description, labels
# 4. Click "Submit new issue"
```

**Benefits:**

- Direct - no intermediate files
- Native GitHub tooling
- No custom scripts to maintain

### 2. Tracking Progress

#### Old Way (Deprecated)

- Idea frontmatter had `status: draft|ready|in-progress|delivered`
- GitHub Projects v2 synced via reconciliation scripts
- Manual `status:` field updates in markdown

#### New Way

- Use GitHub Issue status (Open/Closed)
- Use labels for custom states: `status:in-progress`, `status:blocked`
- Optional: Use GitHub Projects v2 directly (without automation overhead)
- PR status indicates implementation progress

**Benefits:**

- Standard GitHub conventions
- No sync issues between files and boards
- Native filtering and reporting

### 3. Managing Checklists

#### Old Way (Deprecated)

```markdown
## Acceptance Checklist

- [ ] Unit tested
- [ ] Storybook stories
- [ ] README updated
```

Synced via `scripts/ops/sync-ideas-checklists.mjs`

#### New Way

Use GitHub task lists directly in issue descriptions:

```markdown
## Acceptance

- [ ] Unit tested
- [ ] Storybook stories
- [ ] README updated
```

Edit issue → Update checklist → Save

**Benefits:**

- Native GitHub checkbox rendering
- Real-time updates, no sync needed
- Progress tracking built into GitHub

### 4. Finding Historical Context

#### Need Old Idea Content?

All 86 idea files are preserved in:

```
/_archive/ideas-2025-11-03-deprecated/
```

**To browse:**

```bash
# List all archived ideas
ls _archive/ideas-2025-11-03-deprecated/

# Search for specific idea
grep -r "specific-term" _archive/ideas-2025-11-03-deprecated/

# View specific idea
cat _archive/ideas-2025-11-03-deprecated/U-my-old-feature.md
```

**Via GitHub:**

- Navigate to `_archive/ideas-2025-11-03-deprecated/` in the repo
- Use GitHub search with path filter: `path:_archive/ideas-2025-11-03-deprecated/`

### 5. Documentation & Templates

#### Old Way (Deprecated)

- Copied idea templates from `templates/ideas/`
- Referenced idea structure in guides

#### New Way

- Use GitHub issue templates (`.github/ISSUE_TEMPLATE/`)
- Reference templates in `/templates/` for code scaffolds
- Consult GitHub Pages, Storybook, and Playbook for documentation

**Template Locations:**

- **Script templates:** `/templates/script/`
- **Component snippets:** `/templates/snippet-inline-edit-label/`
- **GitHub issue templates:** `.github/ISSUE_TEMPLATE/` (if configured)

### 6. Lane-Specific Guidance

#### Lane A (Foundations & Tooling)

- **Old:** Created `U-*` idea files for units
- **New:** Create issues with `type:unit` label
- **Tracking:** Use labels `lane:A`, `type:unit`, `status:in-progress`

#### Lane B (Narrative & Enablement)

- **Old:** Created `PB-*` idea files for playbook entries
- **New:** Create issues with `type:playbook` label
- **Tracking:** Use labels `lane:B`, `type:playbook`
- **Documentation:** Still lives in `/playbook/` and GitHub Pages

#### Lane C (DevOps & Automation)

- **Old:** Created `C-*` or `ARCH-*` idea files
- **New:** Create issues with appropriate type label
- **Tracking:** Use labels `lane:C`, `type:architecture`

#### Lane D (Program Operations)

- **Old:** Managed lifecycle governance, ran intake/audit scripts
- **New:** Scope redefined - see `docs/lane-d-scope-2025-11-03.md`
- **Coordination:** Use standard GitHub issues for tracking

## Common Questions

### Q: Where do I document feature rationale?

**A:** In the GitHub issue description. Structure it like:

```markdown
## Problem

[What problem does this solve?]

## Proposal

[How will we solve it?]

## Acceptance

- [ ] Checklist items
```

### Q: How do I track sub-tasks?

**A:** Use:

1. GitHub task lists in issue description
2. Separate issues linked with "Parent: #123"
3. GitHub Projects for visual board management (optional)

### Q: What about the project schema (ID, Type, Lane, Status)?

**A:** Use GitHub labels:

- **Type:** `type:unit`, `type:composition`, `type:architecture`, `type:playbook`
- **Lane:** `lane:A`, `lane:B`, `lane:C`, `lane:D`
- **Status:** `status:in-progress`, `status:blocked`, `status:review`

### Q: Can I still use GitHub Projects v2?

**A:** Yes! But without automated sync. Manually add issues to projects and update status fields as needed. The automation overhead has been removed, not the Projects feature itself.

### Q: What if I have an unmerged PR that references an idea file?

**A:**

1. Your PR can still reference the archived idea: `_archive/ideas-2025-11-03-deprecated/IDEA-NAME.md`
2. Consider adding context directly to the PR description for future reference
3. Update PR description to remove broken `/ideas/` links

### Q: I'm new - should I learn the old ideas workflow?

**A:** No. The ideas workflow is fully deprecated. Learn standard GitHub workflows:

- Create issues via CLI or web
- Use labels for categorization
- Use task lists for checklists
- Reference documentation on GitHub Pages

## Transition Timeline

| Date       | Action                                    |
| ---------- | ----------------------------------------- |
| 2025-11-03 | Ideas workflow deprecated                 |
| 2025-11-03 | Deprecated scripts exit with error        |
| 2025-12-03 | 30-day checkpoint (verify transition)     |
| 2026-02-01 | Consider removing deprecated script stubs |

## Resources

### Documentation

- **ADR:** `docs/adr/2025-11-03-ideas-workflow-deprecation.md`
- **Lane D Scope:** `docs/lane-d-scope-2025-11-03.md`
- **Lane C Report:** `_archive/LANE-C-REPORT-IDEAS-SUNSET-2025-11-03.md`

### Archives

- **Archived Ideas:** `_archive/ideas-2025-11-03-deprecated/`
- **Deprecation Summary:** `_archive/IDEAS-DEPRECATION-2025-11-03.md`

### Active Documentation

- **GitHub Pages:** https://louis-pvs.github.io/plaincraft/
- **Storybook:** https://louis-pvs.github.io/plaincraft/storybook/
- **Playbook:** https://louis-pvs.github.io/plaincraft/playbook/

## Need Help?

1. **Check this migration guide** - Most common scenarios covered above
2. **Review archived ideas** - See how things were structured historically
3. **Consult GitHub docs** - Standard issue/PR workflows
4. **Ask your lane lead** - Lane-specific questions

---

**Document Status:** Active  
**Created:** 2025-11-03  
**Owner:** Lane B (Narrative & Enablement)  
**Next Review:** 2025-12-03
