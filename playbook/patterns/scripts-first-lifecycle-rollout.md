---
id: pattern-scripts-first-lifecycle-rollout
type: workflow
owner: "@lane-d"
lane: D
version: 1.0.0
created: 2025-11-02
ttl_days: 180
last_verified: 2025-11-02
prev: /patterns/scripts-first-lifecycle-overview
next: /patterns/scripts-first-lifecycle-rollback
---

# Scripts-First Lifecycle Rollout

- **Audience:** Lane C engineers bootstrapping work from validated ideas
- **Decision Anchor:** [Scripts-First Lifecycle v3](https://github.com/louis-pvs/plaincraft/blob/main/ideas/scripts-firstlifecycle-v3.md)
- **Owner:** @lane.b
- **TTL:** Review by 2026-06-30
- **Future Metric:** >=90% of Ticketed ideas show `Issue: #` + `Status: in-progress` within 1 hour of branch creation
- **Recorded Media:** Record later

## Why it Matters

Scripts-first only works when the first touch after Ticketed sets every system to the same story. The `gh:worktree` bridge updates the idea frontmatter, spawns a branch, and opens a draft PR without waiting on manual edits. Lane B keeps the narrative credible because the metadata is stamped by code, while Lane D can watch Projects for motion instead of slacking the team for "did anyone start this?" updates.

## Worked Example

> Decision: Move PB-scripts-first-lifecycle-rollout from Ticketed to Branched without touching the idea file by hand.

Lane C validates the idea, then calls `pnpm gh:worktree 91 --yes`. The script locates `ideas/PB-scripts-first-lifecycle-rollout.md`, rewrites the frontmatter to include `Issue: #91` and `Status: in-progress`, and records the change in a bootstrap commit so the branch exists before code lands. It names the branch `chore/pb-scripts-first-lifecycle-rollout`, opens a draft PR with the acceptance checklist imported from the idea, and the earlier dry-run transcript shows the diff that automation expected. Stakeholders now see the lifecycle move in GitHub without everyone editing Markdown manually, and the Playbook story can link straight to the draft PR for early review.

## Constraints to Honour

- Keep idea titles prefixed with their ID (`[PB-scripts-first-lifecycle-rollout]`) so `create-worktree-pr.mjs` can discover the source file and hydrate the PR body.
- Leave `Issue:` and `Status:` lines in idea frontmatter; the script mutates them on bootstrap and expects a blank line following the status field.
- Treat `--dry-run` output as the contract review; no writes happen until `--yes`, and the diff preview is what Lane B references in status notes.
- Let the bootstrap commit stand until real work replaces it; deleting it before pushing a real commit stalls PR creation and breaks the automated branch check.
- Avoid hand-crafted branches for lifecycle work. Skipping `pnpm gh:worktree` bypasses the metadata update and forces manual sync between the idea file, branch, and PR.
- Run `pnpm guardrails` before requesting review so lane owners can see the automation scopes succeed alongside the new branch.

## Links

- Template README: [`templates/script/README.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/script/README.md)
- Template USAGE: [`templates/script/USAGE.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/script/USAGE.md)
- Storybook View: [Governance / Script Automation](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-script-automation--docs)
- Unit README: [`scripts/ops/README.md`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/ops/README.md)
- Unit Script: [`scripts/ops/create-worktree-pr.mjs`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/ops/create-worktree-pr.mjs)
- Decision Record: [`ideas/PB-scripts-first-lifecycle-rollout.md`](https://github.com/louis-pvs/plaincraft/blob/main/ideas/PB-scripts-first-lifecycle-rollout.md)
