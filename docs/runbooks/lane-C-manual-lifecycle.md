---
id: runbook-lane-c-manual-lifecycle
owner: "@lane-c"
lane: C
version: 1.0.0
created: 2025-11-02
ttl_days: 60
last_verified: 2025-11-02
scaffold_ref: /templates/runbook-lifecycle@1.0.0
---

# Lane C Manual Lifecycle Runbook

## Overview

This runbook documents the current manual steps required to advance a work item (Idea/ARCH ticket) through the lifecycle when automation covers ~85% of the workflow. It is a temporary bridge until event-driven orchestration (see `ideas/ARCH-one-artifact-e2e-orch.md`) reaches production. All manual actions MUST preserve single-source-of-truth invariants:

- Status lives in the Project item first; idea file `status:` frontmatter is updated only after Project move.
- One branch + one PR per ID (`feat|fix|docs|chore|ci/<ID>-slug`).
- Transitions occur exactly one state at a time: Draft → Ticketed → Branched → PR Open → In Review → Merged → Archived.

## Lifecycle State Responsibilities

| State     | Trigger                             | Manual Action Required                                                | Automation Present        | Notes                                               |
| --------- | ----------------------------------- | --------------------------------------------------------------------- | ------------------------- | --------------------------------------------------- |
| Draft     | Idea/ADR created                    | Ensure frontmatter complete                                           | ❌                        | Missing required fields blocks orchestration        |
| Ticketed  | Issue exists + Project item created | Run `ideas-to-issues` (or create Issue) then confirm Project auto-add | ✅ (issue auto-add)       | If auto-add fails, add via web UI and refresh cache |
| Branched  | Branch created                      | Push branch after `create-branch` dry-run; rerun with `--yes`         | ✅ (status update)        | Verify branch name pattern before push              |
| PR Open   | Draft PR created                    | Push commits if branch newly created, then run PR script              | ✅ (status update)        | Ensure PR body matches acceptance/checklist         |
| In Review | Review requested                    | Click "Ready for review" if draft; request reviewers                  | ❌                        | Future auto transition planned                      |
| Merged    | PR merged                           | Merge via GitHub UI after approvals                                   | ❌ (status update manual) | After merge run closeout script                     |
| Archived  | Artifact closed out                 | Run `closeout` script then move idea to `_archive/` if applicable     | ❌                        | Status → Archived manual until workflow added       |

## Manual Commands

All commands must be executed from repository root. Use `--dry-run` first.

```bash
# 1. Create issues from ideas (Ticketed)
node scripts/ops/ideas-to-issues.mjs --yes

# 2. Create branch (Branched)
node scripts/ops/create-branch.mjs --id ARCH-e2e-automation-gaps --slug project-board-wave-3 --yes

# 3. Open or update PR (PR Open)
node scripts/ops/open-or-update-pr.mjs --id ARCH-e2e-automation-gaps --yes

# 4. Closeout after merge (Merged → Archived)
node scripts/ops/closeout.mjs --id ARCH-e2e-automation-gaps --yes
```

### Validation / Preflight

```bash
# Refresh project cache before status-sensitive operations
node scripts/ops/refresh-project-cache.mjs

# Verify token scopes
gh auth status | grep -E "read:project|project" || gh auth refresh -s read:project -s project

# Guardrails suite
pnpm guardrails:scripts
```

## Remediation Scenarios

| Symptom                                 | Cause                                    | Fix                                                           |
| --------------------------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| Project status not updated              | Missing option or item not found         | Update options in UI → refresh cache → rerun command          |
| Branch validation warning (ID mismatch) | Reused branch from different ticket      | Create new branch with correct ID; do not force update        |
| Issue not added to project              | Cache stale or token scopes missing      | Refresh cache; verify scopes; add manually and rerun closeout |
| PR body missing sections                | Idea file lacks Purpose/Problem/Proposal | Update idea file, rerun PR script with `--yes`                |
| Closeout skipped                        | PR not merged                            | Merge PR first; then rerun closeout                           |

## End-to-End Checklist (One Work Item)

1. Idea frontmatter complete (id, title, lane, type, priority, acceptance).\*
2. Run `ideas-to-issues` (captures Ticketed) — confirm issue number & project item.
3. Run `create-branch` dry-run then with `--yes` — confirm status Branched.
4. Push branch commits.
5. Run `open-or-update-pr` — confirm PR body & status PR Open.
6. Mark PR ready for review (if draft) — request reviewers.
7. Merge PR after approvals.
8. Run `closeout` — changelog + status Merged.
9. Manually set Project status to Archived (until automated) if applicable.
10. Update idea file `status:` frontmatter to Archived & move to `_archive/` if retired.

\*If acceptance changed mid-PR, update idea first; PR body regeneration is optional.

## Success Criteria

- Zero skipped states; linear transitions logged in commit / PR activity.
- No duplicate branches or PRs sharing an ID.
- Project status matches idea frontmatter within one manual action (<5 min drift).
- All scripts run with `--dry-run` first for safety (auditable).
- No unaddressed warnings in script output at the time of merge.

## References

- Project integration guide: `docs/workflows/project-board-integration.md`
- Orchestration vision: `ideas/ARCH-one-artifact-e2e-orch.md`
- Gap tracking: `ideas/ARCH-e2e-automation-gaps.md`
- Guardrails policy: `docs/SCRIPTS-REFERENCE.md`

## Future Automation Hooks (Planned)

| Hook                 | Target State | Replacement Action        |
| -------------------- | ------------ | ------------------------- |
| First push workflow  | PR Open      | Auto-create draft PR      |
| Review request event | In Review    | Auto status transition    |
| Merge webhook        | Merged       | Auto closeout + changelog |
| Archive move script  | Archived     | Auto Project transition   |

Until these land, follow this runbook every time.
