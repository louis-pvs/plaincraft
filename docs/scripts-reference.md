# Scripts Reference

Single-page index for automation scripts.  
Authoring guardrails live in `guides/guide-scripts.md`.  
Template scaffolds: `/templates/script/`.

## Runbook

```bash
# Guardrails bundle
pnpm scripts:guardrails

# Individual checks
pnpm scripts:lint     # policy + headers
pnpm scripts:smoke    # --help / --dry-run probes
pnpm scripts:size     # LOC budget
pnpm scripts:test     # unit tests
```

All scripts honour the shared CLI contract:

`--dry-run` (default true for ops) · `--yes` to execute · `--output json|text` · `--log-level trace|debug|info|warn|error` · `--cwd <path>` · zero interactive prompts.

## Script Catalog

| Path                                           | Purpose                                                        | When to run                                                 |
| ---------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| `scripts/ops/create-worktree-pr.mjs`           | Spin up worktree + PR from Issue, hydrate body from idea file  | Kick off implementation after the idea passes validation    |
| `scripts/ops/archive-idea-for-issue.mjs`       | Move finished ideas to archive and close the feedback loop     | After shipping the corresponding PR                         |
| `scripts/ops/consolidate-changelog.mjs`        | Merge `_tmp` release notes into `CHANGELOG.md` with guardrails | Before publishing a new release                             |
| `scripts/ops/create-issues-from-changelog.mjs` | Raise follow-up issues for each changelog section              | Immediately after changelog consolidation                   |
| `scripts/ops/setup-project.mjs`                | Provision the roadmap GitHub Project + required fields         | First-time project bootstrap or when cloning to another org |
| `scripts/checks/lint-guides.mjs`               | Validate guide frontmatter, TTL, executable commands           | Any documentation PR touching `/guides/**`                  |
| `scripts/checks/dedupe-guides.mjs`             | Similarity guardrail for guides                                | Pair with `lint-guides` in CI or local preflight            |
| `scripts/checks/validate-ideas.mjs`            | Structural validation for idea files                           | Before calling `ideas-to-issues` or merging idea PRs        |
| `scripts/checks/pr-requirements.mjs`           | Ensures PR metadata + checklist compliance                     | Pre-merge or as part of `scripts:guardrails`                |
| `scripts/checks/template-coverage.mjs`         | Enforces template-to-guide ratio                               | When adding new templates/guides                            |

## Idea Workflow Helpers

| Command                                                 | Snapshot                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| `node scripts/ops/ideas-to-issues.mjs <idea>`           | Converts idea cards to GitHub Issues, applies labels, links source |
| `node scripts/ops/sync-ideas-checklists.mjs`            | Mirrors checklist state between idea files and live issues         |
| `node scripts/ops/merge-subissue-to-parent.mjs <issue>` | Merges sub-issue branches back into the parent lane                |
| `node scripts/ops/sync-issue-to-card.mjs <issue>`       | Pulls updated Issue content back into the originating idea file    |

Or use the pnpm shortcuts:

```bash
pnpm ideas:create <idea>    # ideas-to-issues
pnpm ideas:sync             # sync-ideas-checklists
pnpm ideas:validate         # validate-ideas
```

## Supporting Libraries

- `_lib/core.mjs` — logging, CLI parsing, repo discovery, safe I/O.
- `_lib/git.mjs` — worktree + branch helpers.
- `_lib/validation.mjs` — shared schema checks.
- `_lib/allowlist.json` — network and file-system allowlist enforced by guardrails.

Keep new automation inside these seams: pure helpers live in `_lib/`, orchestrators in `ops/`, validators in `checks/`, one-offs in `migration/`, and any expiring scripts in `DEPRECATED/` (90-day TTL).
