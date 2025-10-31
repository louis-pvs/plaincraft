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

Lane D triages `ARCH-scripts-first-automation-suite` and records one dry-run transcript per command:

1. `pnpm ops:idea-intake --file ideas/ARCH-scripts-first-automation-suite.md --yes` — synchronises Project fields (`Lane`, `Type`, `Priority`, `Owner`) and moves the card to Ticketed.
2. `pnpm ops:create-branch -- --id ARCH-123 --slug scripts-first-automation --yes` — creates `feat/ARCH-123-scripts-first-automation`, switches local worktree, and moves the Project status to Branched.
3. `pnpm ops:reconcile-status -- --id ARCH-123 --yes` — rewrites the idea `Status:` line from the Project card and confirms the board is tracking the same target lane before review starts.
4. `pnpm ops:open-or-update-pr -- --id ARCH-123 --yes` — opens or refreshes the draft PR title/body (Purpose, Problem, Proposal + checklist), adds lifecycle labels, and transitions the Project status to PR Open.
5. `pnpm ops:closeout -- --id ARCH-123 --yes` — after merge, archives the idea (unless skipped), appends the changelog entry, and bumps the Project status to Merged.

Before pushing, the developer runs `pnpm commit:guard -- --range origin/main..HEAD` to confirm headers are boring and `pnpm drift:check` so the idea still maps to canonical statuses. If anything drifts, the dry-run output points straight at the fix.

## Constraints to Honour

- Keep idea frontmatter (`Lane`, `Owner`, `Priority`, `Issue`, `Status`) current; automation copies these fields into Projects and PR metadata.
- Treat dry-run output as part of the review artifact. Attach it to project updates before running with `--yes`.
- Avoid manual Project status edits. If a correction is required, re-run the command so the scripted reconciliation writes the truth.
- Store `_tmp/` changelog entries and idea archives in source control so closeout remains reproducible.
- Fail any work-in-progress branch until `pnpm guardrails` reports `ok: true`; each lane owns fixing its scope before requesting review.
- Guardrails never skip: `pnpm guardrails` (or the CI job) now calls `commit:guard`, `drift:check`, and `scripts:lifecycle-smoke`. Fix violations locally before retrying the promotion.
- Nightly execute jobs must run `pnpm scripts:lifecycle-smoke --execute --sandbox <path>` so write-mode checks hit a disposable clone. Keep the sandbox repository clean and authenticated with a bot token that can mutate PRs/Projects.

## Recovery Paths

- **Script failed?** Re-run with `--dry-run --output json` to capture the diff plan, fix the underlying issue, then re-run with `--yes`.
- **Commit headers rejected?** Run `pnpm commit:guard -- --range origin/main..HEAD --output json` to see the offending commit and amend it before pushing.
- **Idea status drift?** Run `pnpm drift:check --output json` to list files missing canonical statuses or lanes, adjust the idea frontmatter, then re-run.
- **CI smoke red?** `pnpm scripts:lifecycle-smoke --yes` reproduces the job locally (idea validation, branch/PR dry-run, baseline refresh) so you can repair the flow without waiting for another pipeline run.

## Links

- Template README: [`templates/ideas/README.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/ideas/README.md)
- Template USAGE: [`templates/script/USAGE.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/script/USAGE.md)
- Storybook Views: [Intake](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-intake--docs), [Branch](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-branch--docs), [PR Refresh](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-pr-refresh--docs), [Closeout](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-closeout--docs)
- Lifecycle Overview View: [`Governance / Lifecycle Overview`](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-overview--docs)
