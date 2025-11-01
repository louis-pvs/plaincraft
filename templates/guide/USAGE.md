# Using the Guide Template

> ⚠️ Guides have been sunset. Use GitHub Pages, Storybook, and Playbook for new documentation. This usage guide is retained only for historical context.

## Purpose

Legacy instructions for the pre-migration guide workflow. Follow the migration checklist below when encountering an old guide.

## Migration Steps

1. **Identify canonical home** — Move runnable steps to the owning template README or `/docs/runbooks/`. Publish narrative context to the Playbook.
2. **Link Storybook** — Ensure Storybook governance docs point at the new Playbook/README content.
3. **Archive the guide** — Relocate the legacy file under `guides/_archive/` and update references to the GitHub Pages site.
4. **Update templates** — Regenerate any catalogues (`pnpm templates:catalog --yes`) so links point at GitHub Pages instead of `/guides`.

## Historical Reference

If you must inspect an old guide, the original flow was:

```bash
cp templates/guide/guide-template.md guides/guide-your-topic.md
wc -w guides/guide-your-topic.md  # verify < 600 words
pnpm guides:lint                  # legacy guardrail (rarely needed now)
```

### 3. Fill Frontmatter

```yaml
---
id: guide-your-topic           # Match filename
owner: @your-github-handle     # Your handle
lane: D                        # Usually D for meta/docs
artifact_id: ARCH-your-ticket  # Reference ticket
scaffold_ref: /templates/your-template@v0.1  # Template path + version
version: 0.1.0                 # Start at 0.1.0
created: 2025-10-28            # Today's date
ttl_days: 90                   # Standard 90 days
last_verified: 2025-10-28      # Today's date
---
```

### 4. Write "When to use" Section

List 3-5 specific scenarios:

```markdown
# When to use

- Setting up a new feature branch workflow
- Need to validate commit message format
- Automating changelog consolidation
```

### 5. Write "When not to use" Section

List 3-5 anti-patterns:

```markdown
# When not to use

- One-off manual changes
- Untracked experimental work
- Changes without corresponding tickets
```

### 6. Write Executable Steps (Historical)

Each step needed:

1. Bold title with colon
2. Executable command in bash code block
3. Brief context if needed

````markdown
# Steps (all executable)

1. **Create idea file:**
   ```bash
   cp templates/ideas/idea-unit-template.md ideas/U-your-feature.md
   ```
````

2. **Validate structure:**

   ```bash
   pnpm run ideas:validate
   ```

3. **Create GitHub Issue:**
   ```bash
   node scripts/ideas-to-issues.mjs U-your-feature.md
   ```

````

### 7. Add Rollback Section

```markdown
# Rollback

- Delete idea file: `rm ideas/U-your-feature.md`
- Close GitHub Issue manually
- Remove worktree: `git worktree remove <path>`
````

### 8. List Requirements

```markdown
# Requirements

- Idea file must exist before creating Issue
- File naming: `U-<slug>.md`, `C-<slug>.md`, etc.
- Required sections: Purpose, Problem, Proposal, Acceptance Checklist
- Lane metadata (A/B/C/D) specified
```

### 9. Add Links Section

````markdown
# Links (Current)

- Documentation hub: [https://louis-pvs.github.io/plaincraft/](https://louis-pvs.github.io/plaincraft/)
- Runbooks & policies: [/docs/](/docs/)
- Archived guides: [/guides/\_archive/](../../guides/_archive/)

### 10. Validate (Historical flow)

```bash
# Legacy word-count check (< 600 words)
wc -w guides/guide-your-topic.md

# Legacy README maintenance
# Add entry to /guides/README.md Active Guides list
```
````

## Word Count Tips

Target: 200-400 words (max 600)

**Reduce by:**

- Using bullet points instead of paragraphs
- Removing narrative, keeping commands
- Referencing templates instead of explaining them
- Using code blocks for examples

**Don't sacrifice:**

- Frontmatter (required, not counted strictly)
- Executable commands
- Critical context

## Common Mistakes

### ❌ Duplicating template content

```markdown
# Steps

1. Create file with these fields:
   - Purpose: ...
   - Problem: ...
     (50 lines of template content)
```

### ✅ Referencing template

````markdown
# Steps

1. **Copy template:**
   ```bash
   cp templates/ideas/idea-unit-template.md ideas/U-feature.md
   ```
````

````

### ❌ Narrative instructions
```markdown
First, you'll want to think about what the feature does,
then consider the user needs, and after that...
````

### ✅ Executable instructions

````markdown
1. **Validate structure:**
   ```bash
   pnpm run ideas:validate
   ```
````

```

## TTL and Archiving

Guides expire after `ttl_days` from `last_verified`:
- Automatic archiving to `_archive/YYYY/`
- CI breaks links with stale banner
- Update `last_verified` when reviewing

## Related

- GitHub Pages portal: [https://louis-pvs.github.io/plaincraft/](https://louis-pvs.github.io/plaincraft/)
- Playbook patterns: [https://louis-pvs.github.io/plaincraft/playbook/](https://louis-pvs.github.io/plaincraft/playbook/)
- Historical guides: `/guides/_archive/**`
- Templates directory: `/templates/`
```
