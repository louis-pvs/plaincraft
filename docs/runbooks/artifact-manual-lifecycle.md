---
id: runbook-artifact-manual-lifecycle
owner: "@lane-d"
lane: D
version: 1.0.0
created: 2025-11-02
ttl_days: 60
last_verified: 2025-11-02
scaffold_ref: /templates/runbook-lifecycle@1.0.0
prev: /runbooks/operator-registry-sop
---

# Artifact Lifecycle Manual Runbook

**Related:** [Lane A](/runbooks/lane-A) · [Lane B](/runbooks/lane-B) · [Lane C](/runbooks/lane-C) · [Lane D](/runbooks/lane-D) · [Observer](/runbooks/observer) · [Operator SOP](/runbooks/operator-registry-sop)

## Scope

Covers the manual actions still required to advance ANY artifact (Idea, ADR, Component spec, Playbook entry) through the lifecycle states: Draft → Ticketed → Branched → PR Open → In Review → Merged → Archived, while automation is script-driven (not event-driven).

Applies to all lanes (A, B, C, D, PB, U). Replace per-artifact runbooks (lane-specific) with this unified guide until orchestration from a single source (see `ideas/ARCH-one-artifact-e2e-orch.md`) is implemented.

## Core Principles

1. Single Source of Truth: Status authoritative in Project item; idea/ADR frontmatter mirrors it AFTER a transition.
2. One ID → One branch → One PR: No duplicates or parallel branches per ID.
3. Linear Transitions: Move exactly one state per action (no skipping).
4. Idempotent Scripts: Always dry-run before write; reruns converge without side effects.
5. Fast Feedback: Warnings must be remediated before next state.

## States & Manual Actions

| State     | Entry Condition                        | Manual Action(s)                                                                             | Script(s)                                           | Automation Coverage            | Exit Condition                          |
| --------- | -------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------ | --------------------------------------- |
| Draft     | Artifact created with frontmatter stub | Fill required metadata fields (id, title, lane, type, owner, priority, acceptance)           | n/a                                                 | 0%                             | Metadata complete                       |
| Ticketed  | Issue exists + Project item created    | Run `ideas-to-issues` OR create issue manually; ensure issue added to Project; refresh cache | `ideas-to-issues.mjs`, `refresh-project-cache.mjs`  | ~70% (auto-add, labels)        | Project item has ID + Status=Ticketed   |
| Branched  | Ticketed + Ready to start work         | Dry-run then create branch; push branch; verify naming; reconcile status if needed           | `create-branch.mjs`, `reconcile-status.mjs`         | ~85% (status update)           | Branch exists; Project Status=Branched  |
| PR Open   | Branched + initial commits present     | Dry-run PR open; write PR; verify body and labels; reconcile status if needed                | `open-or-update-pr.mjs`, `reconcile-status.mjs`     | ~85% (status update, body gen) | Draft PR open; Status=PR Open           |
| In Review | PR Open + marked ready                 | Manually click "Ready for review"; request reviewers; reconcile status                       | `reconcile-status.mjs`                              | ~30% (status sync)             | Reviewer(s) requested; Status=In Review |
| Merged    | In Review + approvals                  | Merge PR via UI; confirm changelog entry or run changelog script; reconcile status           | `consolidate-changelog.mjs`, `reconcile-status.mjs` | ~50% (changelog assist)        | PR merged; Status= Merged               |
| Archived  | Merged + artifact no longer active     | Run closeout; reconcile status; move idea/ADR to `_archive/` if retired                      | `closeout.mjs`, `reconcile-status.mjs`              | ~50% (closeout + status sync)  | Artifact archived; Status=Archived      |

## Required Frontmatter Keys

```
id, title, lane, type, owner, priority, ttl_days, last_verified, acceptance.must_have[], acceptance.wont_have[], acceptance.evidence[]
```

Missing keys block progression to Ticketed.

## Command Cookbook

### Initial Setup & Validation

```bash
# Verify GitHub CLI token has required scopes (FIRST TIME SETUP)
gh auth status | grep -E "read:project|project"

# If missing scopes, refresh with:
gh auth refresh -s read:project -s project

# Refresh project cache (run after manual Project board edits or if cache >1 hour old)
node scripts/ops/refresh-project-cache.mjs
```

### Draft → Ticketed (issues from ideas)

```bash
# Create issues from idea files and add to Project board
node scripts/ops/ideas-to-issues.mjs --dry-run
node scripts/ops/ideas-to-issues.mjs --yes

# After bulk creation, refresh cache
node scripts/ops/refresh-project-cache.mjs
```

### Ticketed → Branched

```bash
# Create lifecycle-compliant branch
node scripts/ops/create-branch.mjs --id ARCH-123 --slug implement-project-board --dry-run
node scripts/ops/create-branch.mjs --id ARCH-123 --slug implement-project-board --yes

# Push branch to remote
git push origin feat/ARCH-123-implement-project-board

# Sync Project status to idea frontmatter (if needed)
node scripts/ops/reconcile-status.mjs --id ARCH-123 --dry-run
node scripts/ops/reconcile-status.mjs --id ARCH-123 --yes
```

### Branched → PR Open

```bash
# Create/update PR with auto-generated body
node scripts/ops/open-or-update-pr.mjs --id ARCH-123 --dry-run
node scripts/ops/open-or-update-pr.mjs --id ARCH-123 --yes

# Sync Project status to idea frontmatter (if needed)
node scripts/ops/reconcile-status.mjs --id ARCH-123 --dry-run
node scripts/ops/reconcile-status.mjs --id ARCH-123 --yes
```

### PR Open → In Review

```bash
# Mark PR ready for review (GitHub UI - no script)
# Then reconcile status from Project → idea frontmatter
node scripts/ops/reconcile-status.mjs --id ARCH-123 --status "In Review" --dry-run
node scripts/ops/reconcile-status.mjs --id ARCH-123 --status "In Review" --yes
```

### In Review → Merged

```bash
# Merge via GitHub UI after approvals

# Generate/update changelog
node scripts/ops/consolidate-changelog.mjs --dry-run
node scripts/ops/consolidate-changelog.mjs --yes

# Sync Project status to idea frontmatter
node scripts/ops/reconcile-status.mjs --id ARCH-123 --dry-run
node scripts/ops/reconcile-status.mjs --id ARCH-123 --yes
```

### Merged → Archived

```bash
# Run closeout to finalize artifact
node scripts/ops/closeout.mjs --id ARCH-123 --dry-run
node scripts/ops/closeout.mjs --id ARCH-123 --yes

# Sync final status
node scripts/ops/reconcile-status.mjs --id ARCH-123 --dry-run
node scripts/ops/reconcile-status.mjs --id ARCH-123 --yes
```

### Issue Sync (when GitHub Issue edited manually)

```bash
# Pull Issue updates back to idea file
node scripts/ops/sync-issue-to-card.mjs --issue-number 123 --dry-run
node scripts/ops/sync-issue-to-card.mjs --issue-number 123 --yes
```

## Manual Update Order

**PREFERRED**: Use `reconcile-status.mjs` to sync Project status → idea frontmatter automatically:

```bash
node scripts/ops/reconcile-status.mjs --id ARCH-123 --dry-run
node scripts/ops/reconcile-status.mjs --id ARCH-123 --yes
```

**MANUAL FALLBACK** (if script unavailable):

1. Transition Project item status via GitHub UI.
2. Update idea/ADR frontmatter `status:` field to match.
3. Commit frontmatter update with compliant header `[ARCH-123] docs(status): advance to <STATE>`.
4. Only then proceed to next script step.

**Note**: Project board is authoritative. Scripts flow status downward to files. Avoid manual frontmatter edits when possible.

## Remediation Matrix

| Symptom                   | Likely Cause                               | Resolution                                               |
| ------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Status option missing     | Project field options misconfigured        | Add option in UI → refresh cache                         |
| Project item not found    | Issue not added or cache stale             | Manually add item → refresh → rerun script               |
| Branch update skipped     | ID mismatch in branch name                 | Create correct branch; do NOT force script bypass        |
| PR body sparse            | Missing sections in artifact file          | Add Purpose/Problem/Proposal → rerun PR script           |
| Changelog duplicate lines | Multiple dry-run + yes misuse              | Ensure dry-run first; avoid editing temp output manually |
| Closeout skipped          | PR not merged / wrong ID                   | Confirm PR merged and ID matches artifact                |
| Status drift              | Project status ≠ idea frontmatter          | Run `reconcile-status.mjs --id ARCH-123 --yes`           |
| Token scope error         | Missing `read:project` or `project` scopes | Run `gh auth refresh -s read:project -s project`         |
| Stale project cache       | Cache older than 1 hour or manual edits    | Run `refresh-project-cache.mjs` before lifecycle scripts |
| Issue sync needed         | GitHub Issue edited manually               | Run `sync-issue-to-card.mjs --issue-number <NUM> --yes`  |

## E2E Checklist (Single Artifact)

1. Frontmatter complete (no TBD values).
2. GitHub token verified with `read:project` and `project` scopes.
3. Project cache refreshed if stale (>1 hour since last update).
4. Issue created; Project item added; Status=Ticketed.
5. Branch created with lifecycle pattern; Status=Branched; reconcile confirms sync.
6. PR opened with generated body; Status=PR Open; reconcile confirms sync.
7. Reviewers requested; Status manually set to In Review; reconcile syncs to frontmatter.
8. PR merged; changelog updated; Status= Merged; reconcile confirms sync.
9. Closeout run; status archived; reconcile finalizes; artifact moved if retired.
10. All warnings addressed; no skipped states; drift check passes.

## Drift Rules

- Idea/ADR status must be updated within 5 minutes of Project status change.
- > 1 stale status across artifacts triggers a review (Lane D).
- Branch older than 14 days at PR Open without merge → flag for reassessment.

## Future Event-Driven Replacements

| Manual Step                   | Future Hook              | Benefit                            |
| ----------------------------- | ------------------------ | ---------------------------------- |
| Issue add to project          | Issue creation workflow  | Eliminates manual confirmation     |
| Branch creation status update | Push-based Actions       | Removes branch script invocation   |
| PR Open status update         | First push workflow      | One command (git push) triggers PR |
| In Review manual status       | Review requested webhook | Accurate timing & metrics          |
| Merge closeout                | Merge webhook            | Guaranteed changelog + archive     |
| Archive movement              | Scheduled reconcilers    | Prevents drift & stale artifacts   |

## Success Metrics

- Mean manual time per lifecycle (<15 minutes excluding review wait).
- 0 invalid branch names per week.
- <2 status drift incidents per month.
- 100% scripts invoked with dry-run before yes.

## References

- Orchestration blueprint: `ideas/ARCH-one-artifact-e2e-orch.md`
- Gap remediation: `ideas/ARCH-e2e-automation-gaps.md`
- Project integration guide: `docs/workflows/project-board-integration.md`
- Guardrails policy: `docs/SCRIPTS-REFERENCE.md`

## Change Log

| Date       | Change                                   | Author  |
| ---------- | ---------------------------------------- | ------- |
| 2025-11-02 | Initial unified manual lifecycle runbook | @lane-d |
