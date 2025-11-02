---
id: pattern-scripts-first-lifecycle-rollback
type: workflow
owner: "@lane-d"
lane: D
version: 1.0.0
created: 2025-11-02
ttl_days: 180
last_verified: 2025-11-02
prev: /patterns/scripts-first-lifecycle-rollout
next: /patterns/script-automation-guardrails
---

# Scripts-First Lifecycle Rollback

- **Audience:** Lane C implementers and Lane D release captains responding to failed rollouts
- **Decision Anchor:** [ARCH-scripts-first-project-governance](https://github.com/louis-pvs/plaincraft/blob/main/ideas/ARCH-scripts-first-project-governance.md)
- **Owner:** @lane.b
- **TTL:** Review by 2026-06-30
- **Future Metric:** < 1 hour from rollback trigger to restored Ticketed status with attached transcripts
- **Recorded Media:** Record later

## Why it Matters

Rollback procedures must walk the lifecycle backward without losing audit trails. When a branch needs to be abandoned or a PR reverted, automation should unwind each state change so Projects, Playbook notes, and changelog entries stay coherent.

## Worked Example

`pnpm pr:verify` flags an unmet acceptance item after review. To rollback:

1. `node scripts/ops/remove-worktree.mjs 91 --yes --keep-remote` cleans the bootstrap worktree while leaving the remote branch for inspection.
2. `pnpm gh:worktree 91 --dry-run` confirms the idea frontmatter still reflects `Status: in-progress`. If it drifted, rerun with `--yes` to reapply the scripted metadata.
3. `pnpm pr:generate --yes` rewrites the draft PR body so unchecked tasks surface again and reviewers see the reset context.
4. Post in the ADR thread with the dry-run transcripts and attach the Playbook rollback note so stakeholders know the current state.

The GitHub Project item falls back to `Branched` or `Ticketed` automatically based on the script output, keeping the reporting board honest.

## Constraints to Honour

- Run `remove-worktree.mjs` before editing the idea file. Manual edits risk diverging from the status SoT.
- Always capture new dry-run logs in the status note; rollback without evidence is treated as manual intervention.
- Use the same commands that moved the lifecycle forward to reverse it—never edit the Project card directly.
- If release notes already shipped, append a new `_tmp/` entry that references the rollback and rerun `pnpm changelog` so the history records the change.
- Re-run `pnpm guardrails` after each corrective commit; merging with failing scopes is not permitted even during rollback.

## Links

- Template README: [`templates/script/README.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/script/README.md)
- Template USAGE: [`templates/script/USAGE.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/script/USAGE.md)
- Rollback Script: [`scripts/ops/remove-worktree.mjs`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/ops/remove-worktree.mjs)
- Branch Bootstrap: [`scripts/ops/create-worktree-pr.mjs`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/ops/create-worktree-pr.mjs)
- PR Refresh: [`scripts/ops/generate-pr-content.mjs`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/ops/generate-pr-content.mjs)
- Storybook Views: [Lifecycle Overview](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-overview--docs), [Branch](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-branch--docs)
