# Guides Governance

**Single source of truth for guide authoring and maintenance.**

---

## Core Principle

**Templates carry the truth. Guides carry the map.**

If a guide starts describing the terrain in 1,500 words, throw it out and ship a compass.

---

## Guardrails

### 1. Single Source of Truth Map

- Code and config truths live in `/templates` (or `/scaffolds`) and snippet READMEs
- Guides may only reference or import
- No duplicating steps or API details

### 2. Page Budget and WIP Limits

- **Max 12 guides total**
- **Max 3 in progress**
- New guide requires archiving or merging an old one
- **Hard word cap: 600 words per guide**
- Prefer checklists, not essays

### 3. Mandatory Frontmatter

Each guide must start with:

```yaml
---
id: guide-<slug>
owner: @handle
lane: A|B|C|D
artifact_id: U-* or C-* or ARCH-*
scaffold_ref: /templates/<name>@vX.Y
version: 0.1.0
created: 2025-10-26
ttl_days: 90
last_verified: 2025-10-26
---
```

**Missing any key fails CI.**

### 4. TTL and Auto-Archiving

- If `last_verified + ttl_days` is in the past, CI moves file to `/guides/_archive/YYYY/`
- Breaks links at build time with clear "stale" banner
- No zombie docs

### 5. Template-First Gate

- New process requires a scaffold or script PR first
- A guide alone is rejected
- CI check: `scaffold_ref` must resolve to real path and version tag

### 6. DRY-Lint for Duplication

- `guides:dedupe` flags similarity >30% across guides
- If hit, merge or delete
- One place per concept
- The loser gets archived with link to winner

### 7. Coupling to Artifacts

- Every guide must reference an `artifact_id` (Unit, Composition, or ARCH ticket)
- CI ensures referenced artifact exists in repo history or tracker

### 8. Linkable Steps Only

- Steps must call executable things:
  - `pnpm new:snippet`
  - `node scripts/...`
  - `gh workflow run ...`
- Pure narrative steps limited to **5 lines total**
- Show commands or delete

### 9. Scope Fence

- Guides serve choices and checklists
- Specs and API facts live in READMEs and Storybook autodocs
- If guide includes API tables, block PR and move rows to README

### 10. One Owner, One Date

- Exactly one `owner`
- Guides with shared ownership become ownerless in practice
- If owner changes teams, guide is archived unless new owner takes it in same PR

---

## Invariants

- **One truth per concept:** templates or READMEs. Guides only point.
- **One owner and current TTL,** or file is archived.
- **One artifact link per guide.** If artifact dies, guide dies.
- **CI must run every command** shown in any guide on clean clone within 10 minutes.
- **Guides never block merges.** Scaffolds and tests do.

---

## Folder Contracts

```
/templates/                # Canonical, versioned
  <name>/
    template.config.json   # Minimal schema for CI checks
    USAGE.md               # Machine-friendly, imported by guides
    CHANGELOG.md           # Version history

/guides/
  guide-<slug>.md          # Thin pages, frontmatter required
  INDEX.json               # Auto-generated index
  _archive/YYYY/...        # Expired guides
```

---

## Guide Skeleton

Copy this:

```markdown
---
id: guide-inline-edit
owner: @louis
lane: A
artifact_id: U-inline-edit
scaffold_ref: /templates/inline-edit@v0.2
version: 0.1.0
created: 2025-10-26
ttl_days: 90
last_verified: 2025-10-26
---

# When to use

- Inline confirmation needed, low-risk edit, immediate feedback.

# When not to use

- Multi-step validation, irreversible actions, legal text edits.

# Steps (all executable)

1. Scaffold: `pnpm new:snippet InlineEditLabel`
2. Wire story: add to `demo/src/App.tsx` and `*.stories.tsx`
3. Test: `pnpm storybook:test`
4. Commit and tag: `pnpm run release:unit U-inline-edit@v0.2`

# Rollback

- `git switch -c revert/U-inline-edit && git revert <sha-range>`

# Links

- USAGE: `/templates/inline-edit/USAGE.md`
- Storybook: `/storybook/?path=/story/snippets-inlineeditlabel--interaction`
- README: `/snippets/InlineEditLabel/README.md`
```

---

## CI Enforcement

### Commands

```bash
# Lint guides (frontmatter, word count, executable blocks, links)
pnpm guides:lint

# Detect duplicates (>30% similarity)
pnpm guides:dedupe

# Archive expired guides
pnpm guides:ttl

# Generate index from frontmatter
pnpm guides:index

# Run all checks
pnpm guides:check
```

### What Each Check Does

**`guides:lint`**

- Frontmatter keys present
- Word count cap enforced
- Executable code blocks exist
- Links resolve
- scaffold_ref paths exist
- artifact_id format valid
- TTL not expired

**`guides:dedupe`**

- Rolling hash similarity detection
- Blocks near-duplicates
- Reports pairs >30% similar

**`guides:ttl`**

- Archives expired guides
- Moves to `_archive/YYYY/`
- Fails build if live guide expired

**`guides:index`**

- Rebuilds `INDEX.json` from frontmatter
- Surfaces orphans (missing scaffold_ref or artifact_id)
- Groups by lane and owner
- Lists expired guides

---

## KPI and Tripwires

| Metric                  | Target  | Action if Breached                       |
| ----------------------- | ------- | ---------------------------------------- |
| Templates:guides ratio  | ≥3:1    | Freeze new guides until add scaffolds    |
| Median clean-clone time | ≤10 min | Guide became novella, split or delete    |
| Guide count             | ≤12     | Need 13th? Archive one. No negotiations. |

---

## Rollout Phases

### Phase 1: Add Enforcement (Complete)

- [x] Frontmatter linter
- [x] TTL archiver
- [x] Dedupe check
- [x] Index generator

### Phase 2: Clean Existing Guides

- [ ] Move duplicated content to READMEs
- [ ] Slash word count in verbose guides
- [ ] Add missing frontmatter
- [ ] Update scaffold_ref to point to templates

### Phase 3: Require scaffold_ref

- [ ] Block new guides without working scaffold_ref
- [ ] Enforce in PR template
- [ ] CI fails if scaffold_ref doesn't resolve

---

## Creating a New Guide

### Prerequisites

1. **Template must exist first**

   ```bash
   # Create template structure
   mkdir templates/my-feature
   # Add template.config.json, USAGE.md, template files
   ```

2. **Artifact must exist**
   - Create GitHub Issue or idea file with matching ID

### Steps

1. **Copy skeleton:**

   ```bash
   cp guides/_skeleton.md guides/guide-my-feature.md
   ```

2. **Fill frontmatter:**
   - Unique `id`
   - Your GitHub handle as `owner`
   - Correct `lane` (A/B/C/D)
   - Valid `artifact_id`
   - Existing `scaffold_ref`
   - Current date for `created` and `last_verified`

3. **Write executable steps only:**
   - Commands that work on clean clone
   - Max 5 lines of pure narrative
   - Link to USAGE.md for details

4. **Validate:**

   ```bash
   pnpm guides:lint
   pnpm guides:dedupe
   ```

5. **Check word count:**

   ```bash
   wc -w guides/guide-my-feature.md
   # Must be <600 words
   ```

6. **Open PR:**
   - Guide + template changes in same PR
   - CI will validate all checks

---

## Maintaining a Guide

### When to Update

- `last_verified` date approaching TTL
- Scaffold command changes
- Links break
- Steps become obsolete

### How to Update

1. **Verify steps still work:**

   ```bash
   # Run every command on clean clone
   # Time yourself - must complete <10 min
   ```

2. **Update `last_verified` date:**

   ```yaml
   last_verified: 2025-11-15
   ```

3. **Bump `version` if content changes:**

   ```yaml
   version: 0.2.0
   ```

4. **Regenerate index:**
   ```bash
   pnpm guides:index --yes
   ```

---

## When to Archive a Guide

Archive when:

- TTL expired (automatic via `guides:ttl`)
- Referenced artifact closed/deleted
- Scaffold no longer exists
- Duplicate of another guide (>30% similar)
- Owner changed teams without reassignment
- Guide fails governance checks

### How to Archive Manually

```bash
# Move to archive
mv guides/guide-old.md guides/_archive/2025/

# Update links
# Find and replace references

# Regenerate index
pnpm guides:index --yes
```

---

## Anti-Patterns

### ❌ Don't Do This

**Long narrative explanations:**

```markdown
This section explains the theoretical foundations of our approach.
Over the years, we've learned that inline editing requires careful
consideration of user mental models. Research shows that users
expect immediate feedback...
```

**API documentation in guide:**

```markdown
## Props

| Prop  | Type   | Default | Description       |
| ----- | ------ | ------- | ----------------- |
| value | string | ""      | The current value |
```

**Copy-paste from README:**

```markdown
The InlineEditLabel component provides...
(duplicating README content)
```

### ✅ Do This Instead

**Executable checklist:**

```markdown
# Steps

1. Scaffold: `pnpm new:snippet InlineEditLabel`
2. Props: see `/snippets/InlineEditLabel/README.md#props`
3. Test: `pnpm storybook:test`
```

**Link to source:**

```markdown
# API Reference

See [README](/snippets/InlineEditLabel/README.md) for full API.
```

---

## FAQ

**Q: Can I have a guide without a template?**  
A: No. If it's not scaffoldable, it doesn't need a guide.

**Q: What if my guide needs to be longer than 600 words?**  
A: Split into multiple guides or move content to USAGE.md.

**Q: Who archives expired guides?**  
A: CI does it automatically. Run `pnpm guides:ttl --yes`.

**Q: Can I reference external docs?**  
A: Yes, but command links must work on clean clone.

**Q: What if I need to document a decision?**  
A: Create ARCH-\* issue and link guide to it.

**Q: How do I know if my guide is too similar to another?**  
A: Run `pnpm guides:dedupe`. >30% similarity fails.

---

## Quick Reference

| Command              | Purpose                |
| -------------------- | ---------------------- |
| `pnpm guides:lint`   | Validate all guides    |
| `pnpm guides:dedupe` | Check for duplicates   |
| `pnpm guides:ttl`    | Archive expired guides |
| `pnpm guides:index`  | Generate INDEX.json    |
| `pnpm guides:check`  | Run all checks         |

**Limits:**

- 12 guides max
- 600 words max per guide
- 90 days default TTL
- 30% similarity threshold
- 10 min clean-clone time

---

**Remember:** If you're writing more than commands and checklists, you're writing the wrong document. Move it to a README or USAGE.md.
