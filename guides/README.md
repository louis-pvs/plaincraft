# Plaincraft Guides

Template-first documentation for reproducible workflows. Guides are thin wrappers that point to templates and scripts, not replace them.

## Active Guides (4/12 limit)

- **[guide-changelog.md](./guide-changelog.md)** - Release notes and commit message conventions
- **[guide-roadmap-setup.md](./guide-roadmap-setup.md)** - Bootstrapping Plaincraft Roadmap project
- **[guide-scripts.md](./guide-scripts.md)** - Script guardrails and CI enforcement
- **[guide-user-story.md](./guide-user-story.md)** - Translating ideas to backlog-ready tickets
- **[guide-scripts.md](./guide-scripts.md)** - Script guardrails and CI enforcement
- **[guide-workflow.md](./guide-workflow.md)** - Idea to Issue to PR workflow

## Governance Rules

### 1. Template Before Guide

If a process can be scaffolded, it ships as a template/script FIRST. Guides only point to it.

### 2. Page Budget

- Max 12 guides total
- Max 3 in progress
- Hard cap: 600 words per guide

### 3. Required Frontmatter

Every guide must have:

```yaml
---
id: guide-<slug>
owner: @handle
lane: A|B|C|D
artifact_id: U-* or C-* or ARCH-*
scaffold_ref: /templates/<name>@vX.Y
version: 0.1.0
created: YYYY-MM-DD
ttl_days: 90
last_verified: YYYY-MM-DD
---
```

### 4. TTL and Auto-Archiving

Guides expire after `ttl_days`. CI moves them to `_archive/YYYY/` and breaks links with a stale banner.

### 5. Executable Steps Only

Every step must call an executable thing:

- `pnpm <script>`
- `node scripts/...`
- `gh workflow run ...`

Pure narrative limited to 5 lines max.

### 6. Single Source of Truth

- Templates/READMEs hold the canonical truth
- Guides only reference, never duplicate
- DRY-lint enforced: >30% similarity triggers merge or archive

### 7. One Owner, One Artifact

- Exactly one `owner` per guide
- Must reference an `artifact_id` (ticket) that exists
- If artifact dies, guide dies

### 8. Clean-Clone Success < 10 Minutes

Every command shown must work on a clean clone within 10 minutes.

## CI Enforcement

Planned lint checks:

- `pnpm docs:lint` - frontmatter, word count, executable blocks, link resolution
- `pnpm docs:dedupe` - similarity detection, blocks near-duplicates
- `pnpm docs:ttl` - archives expired guides, fails build if live guide expired
- `pnpm docs:index` - rebuilds index from frontmatter, surfaces orphans

## KPI Tripwires

- Templates:guides ratio ≥ 3:1
- Median clean-clone-to-success ≤ 10 minutes
- Guide count caps at 12

If you need a 13th guide, archive one. No negotiations.

## Archive

Stale guides moved to `_archive/YYYY/` when:

- `last_verified + ttl_days` passes
- Referenced artifact no longer exists
- Owner changes teams without reassignment
- Guide fails to meet governance rules

## Creating a New Guide

1. Ensure template/scaffold exists first
2. Copy skeleton from governance doc
3. Keep under 600 words
4. Reference templates, never duplicate them
5. Test all commands on clean clone
6. Add to this README's active list
7. Archive an old guide if at 12/12 limit

## Philosophy

Templates carry the truth. Guides carry the map. If a map starts describing terrain in 1,500 words, throw it out and ship a compass.
