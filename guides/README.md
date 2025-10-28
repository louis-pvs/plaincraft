# Plaincraft Guides

Template-first documentation for reproducible workflows. Every guide is a thin wrapper: it tells you **when** to use a scaffold, never **how** to rebuild it from scratch.

## Active Guides (4 / 12 cap)

- `guide-changelog.md` — Release notes + commit message workflow. `scaffold_ref: /templates/guide@v0.1`
- `guide-roadmap-setup.md` — Roadmap project bootstrap + automation hooks.
- `guide-scripts.md` — Script guardrails, linting commands, and CI enforcement.
- `guide-workflow.md` — Idea → Issue → Worktree delivery loop.

Archived playbooks sit in [`_archive/`](./_archive/) once TTL passes or ownership lapses.

## Collation Folders

- `components/README.md` — Reusable UI snippet guidance and links to props/a11y templates.
- `workflows/README.md` — Step-by-step flows spanning ideas, issues, worktrees, and CI.
- `templates/README.md` — Source-of-truth catalog for every scaffold and metadata schema.
- `_archive/` — Auto-managed by `pnpm guides:ttl` when TTL or artifact links go stale.

Use these folders as jumping-off points. Authoring happens in `guide-*.md` files at the repo root so automation scripts can lint without recursion.

## Governance Snapshot

- Hard limits: ≤12 active guides, ≤600 words each, ≤3 marked in-progress.
- Required frontmatter keys: `id`, `owner`, `lane`, `artifact_id`, `scaffold_ref`, `version`, `created`, `ttl_days`, `last_verified`.
- Commands must be runnable from a clean clone in under ten minutes.
- Duplicate content (>30% similarity) is blocked — link across guides instead.
- If a template or artifact goes away, archive the guide in the same PR.

Run `pnpm guides:lint`, `pnpm guides:dedupe`, `pnpm guides:ttl --yes`, and `pnpm guides:index --yes` locally before opening a PR.

## Creating or Updating a Guide

1. Ship or update the scaffold/script first. Guides never lead.
2. Copy `/guides/_skeleton.md` and trim to ≤600 words.
3. Populate frontmatter, especially `artifact_id` and `scaffold_ref`.
4. Verify every command on a clean clone.
5. Update the relevant collation README (components/workflows/templates) with the new link.
6. If we hit the 12-guide ceiling, archive one in the same PR.

Templates carry the truth; guides carry the map. If a map becomes an essay, archive it and point people back to the scaffold.
