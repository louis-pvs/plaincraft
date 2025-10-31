# Scripts-First Lifecycle Overview

- **Audience:** Lane D program leads and Lane B storytellers coordinating rollouts
- **Decision Anchor:** [Scripts-First Lifecycle v3](https://github.com/louis-pvs/plaincraft/blob/main/ideas/scripts-firstlifecycle-v3.md)
- **Owner:** @lane.b
- **TTL:** Review by 2026-06-30
- **Future Metric:** 100% of lifecycle moves include attached dry-run transcripts within project status notes
- **Recorded Media:** Record later

## Why it Matters

The lifecycle only stays trustworthy when every transition runs through the sanctioned scripts. Intake, branch, PR refresh, and closeout each treat the idea file as the narrative source while Projects hold the live status. This pattern keeps both SoTs aligned and gives stakeholders a predictable audit trail at every step.

## Worked Example

Lane D triages PB-scripts-first-lifecycle-rollout and runs:

1. `pnpm ideas:create ideas/PB-scripts-first-lifecycle-rollout.md --yes` — validates the idea and opens Issue #91 with the Project card moved to Ticketed.
2. `pnpm gh:worktree 91 --yes` — bootstraps the branch, stamps `Issue`/`Status` on the idea, and opens a draft PR.
3. `pnpm pr:generate --yes` followed by `pnpm pr:verify` — refreshes the PR body from the idea and checks checklist compliance before re-requesting review.
4. `pnpm changelog -- --yes` then `node scripts/ops/archive-idea-for-issue.mjs 91 --yes` — publishes the release note and archives the idea once merged.

Every stage leaves behind a dry-run transcript that Lane B links inside the Playbook status update so observers can see what changed without parsing git diffs.

## Constraints to Honour

- Keep idea frontmatter (`Lane`, `Owner`, `Priority`, `Issue`, `Status`) current; automation copies these fields into Projects and PR metadata.
- Treat dry-run output as part of the review artifact. Attach it to project updates before running with `--yes`.
- Avoid manual Project status edits. If a correction is required, re-run the command so the scripted reconciliation writes the truth.
- Store `_tmp/` changelog entries and idea archives in source control so closeout remains reproducible.

## Links

- Template README: [`templates/ideas/README.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/ideas/README.md)
- Template USAGE: [`templates/script/USAGE.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/script/USAGE.md)
- Storybook Views: [Intake](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-intake--docs), [Branch](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-branch--docs), [PR Refresh](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-pr-refresh--docs), [Closeout](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-closeout--docs)
- Lifecycle Overview View: [`Governance / Lifecycle Overview`](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-overview--docs)
