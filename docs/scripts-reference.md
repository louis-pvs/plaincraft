# Scripts Reference

Single-page index for automation scripts.  
Authoring guardrails live in `guides/guide-scripts.md`.  
Template scaffolds: `/templates/script/`.

## Runbook

```bash
# Guardrails bundle (build + lint + typecheck + test + guardrails)
pnpm guardrails

# Individual checks
pnpm scripts:lint     # policy + headers
pnpm scripts:smoke    # --help / --dry-run probes
pnpm scripts:size     # LOC budget
pnpm scripts:test     # unit tests
pnpm yaml:lint        # validate YAML workflows/configs parse
```

`pnpm guardrails` now drives build, lint, typecheck, and test alongside the script/doc guardrails, fanning out up to three jobs at a time to stay inside the +90s budget. Watch the `[progress]` bar for dot updates, pass `--concurrency <n>` to tune throughput, or `--sequential` to match the legacy single-file order during incident response.

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
| `vitepress dev docs`                           | Serve the GitHub Pages docs site locally                       | Preview sidebar/nav changes (`pnpm docs:dev`)               |
| `vitepress build docs`                         | Build static docs output                                       | Before publishing to GitHub Pages (`pnpm docs:build`)       |
| `scripts/checks/lint-guides.mjs`               | Legacy guide lint (archive only)                               | Rarely — when editing files under `guides/_archive/**`      |
| `scripts/checks/dedupe-guides.mjs`             | Legacy guide similarity guard                                  | Same as above (historical maintenance only)                 |
| `scripts/checks/validate-ideas.mjs`            | Structural validation for idea files                           | Before calling `ideas-to-issues` or merging idea PRs        |
| `scripts/checks/pr-requirements.mjs`           | Ensures PR metadata + checklist compliance                     | Pre-merge or as part of `pnpm guardrails`                   |
| `scripts/checks/pr-template-lint.mjs`          | Confirms PR template placeholders match pipeline config        | Whenever `.github/pull_request_template.md` changes         |
| `scripts/checks/template-coverage.mjs`         | Ensures templates ship README/USAGE/config                     | When adding or updating templates                           |
| `scripts/checks/playbook-link-guard.mjs`       | Verifies Playbook pattern links point to canonical docs        | Any change under `playbook/patterns/**`                     |
| `scripts/checks/guardrails.mjs`                | Runs the full guardrail suite with JSON/text summary output    | `pnpm guardrails` locally or in CI                          |

## Idea Workflow Helpers

| Command                                                 | Snapshot                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `node scripts/ops/ideas-to-issues.mjs <idea>`           | Converts idea cards to GitHub Issues, replaces/maintains the Sub-Issues section |
| `node scripts/ops/sync-ideas-checklists.mjs`            | Mirrors checklist state between idea files and live issues                      |
| `node scripts/ops/merge-subissue-to-parent.mjs <issue>` | Merges sub-issue branch, marks parent checklist, refreshes parent PR progress   |
| `node scripts/ops/sync-issue-to-card.mjs <issue>`       | Pulls updated Issue content back into the originating idea file                 |
| `node scripts/ops/archive-closed-ideas.mjs`             | Batch-archives idea cards whose Issues are already closed                       |

Or use the pnpm shortcuts:

```bash
pnpm ideas:create <idea>    # ideas-to-issues
pnpm ideas:sync             # sync-ideas-checklists
pnpm ideas:validate         # validate-ideas
```

### `create-worktree-pr.mjs` notes

- Accepts `--base <branch>` to specify the base branch for worktree creation (defaults to `main`)
- The script runs git commands from the repository root, eliminating `spawn git ENOENT` errors in sandboxed environments
- Terminal output includes a confirmation log showing the resolved base branch for debugging

### `validate-ideas.mjs` quick reference

- Supports Unit (`U-`), Composition (`C-`), Architecture (`ARCH-`), Playbook (`PB-`), Bug (`B-`), and brief (lowercase) idea cards.
- Enforces section requirements per type (e.g., Purpose/Problem/Proposal/Acceptance Checklist for ARCH).
- Warns on thin acceptance checklists and titles missing ticket prefixes to help guardrail compliance.
- Run with `--filter <prefix>` for focused audits (e.g., `node scripts/checks/validate-ideas.mjs --filter ARCH-`).

### Sub-issue pipeline helpers

- `ideas-to-issues.mjs` replaces (rather than appends) the `## Sub-Issues` section in parent Issues and preserves existing checkbox state when re-run.
- `create-worktree-pr.mjs` automatically adds `Part of #<parent>` context to child PRs when `Parent: #N` metadata exists on the idea card.
- `merge-subissue-to-parent.mjs` merges the branch, flips the matching parent Issue checklist item to `[x]`, and injects/updates a `## Sub-Issues Progress` section in the parent PR body.
- `archive-closed-ideas.mjs` performs one-off cleanups to move lingering idea cards for closed Issues into `/ideas/_archive/<year>/`.

## Supporting Libraries

- `_lib/core.mjs` — logging, CLI parsing, repo discovery, safe I/O.
- `_lib/git.mjs` — worktree + branch helpers.
- `_lib/validation.mjs` — shared schema checks.
- `_lib/allowlist.json` — network and file-system allowlist enforced by guardrails.

Keep new automation inside these seams: pure helpers live in `_lib/`, orchestrators in `ops/`, validators in `checks/`, one-offs in `migration/`, and any expiring scripts in `DEPRECATED/` (90-day TTL).

### GitHub automation preference

- Prefer `gh` CLI commands for repository operations (`gh issue list`, `gh pr view`, `gh run view`) to leverage authentication and pagination.
- Fall back to existing scripts in `/scripts/ops` or `/scripts/checks` when a higher-level workflow already exists.
- Use raw `curl` only when GitHub CLI and local scripts do not expose the required endpoint.
