# Scripts-First Lifecycle Training Packet

- **Audience:** Lane D release captains, program ops partners, ADR subscribers
- **Facilitator:** @lane.b
- **Duration:** 45 minutes (25 min walkthrough · 20 min hands-on)
- **Pre-reads:**
  - [`ideas/PB-scripts-first-lifecycle-rollout.md`](https://github.com/louis-pvs/plaincraft/blob/main/ideas/PB-scripts-first-lifecycle-rollout.md)
  - Storybook governance views: [Intake](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-intake--docs), [Branch](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-branch--docs), [PR Refresh](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-pr-refresh--docs), [Closeout](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-lifecycle-closeout--docs)

## Goals

1. Reinforce the two sources of truth (idea content, Project status) and how each command keeps them aligned.
2. Practice capturing dry-run transcripts and attaching them to status updates.
3. Walk through rollback expectations so escalations can unwind safely.

## Agenda

| Segment          | Time   | Focus                                                                                                |
| ---------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Kickoff          | 5 min  | Why scripts-first governs intake → closeout                                                          |
| Command tour     | 15 min | Live demo of `pnpm ideas:create`, `pnpm gh:worktree`, `pnpm pr:generate`, `pnpm changelog` + archive |
| Hands-on         | 15 min | Trainees run dry-runs on a sandbox idea and capture transcripts                                      |
| Rollback lab     | 10 min | Use `remove-worktree.mjs` + PR generator to reset a branch                                           |
| Q&A + next steps | 5 min  | Document follow-ups and assign owners                                                                |

## Materials

- Sample idea card: duplicate [`templates/ideas/idea-brief-template.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/ideas/idea-brief-template.md) into a sandbox branch before the session.
- Sandbox Project board with fake IDs (share link in session invite)
- Shared doc for collecting dry-run transcripts (link in ADR comment)

## Hands-on Checklist

- [ ] Run `pnpm ideas:create <demo-idea>` in dry-run mode and paste the output into the shared doc.
- [ ] Execute the same command with `--yes` once facilitator confirms.
- [ ] Run `pnpm gh:worktree <issue>` in dry-run mode; capture the planned branch and PR metadata.
- [ ] Use `pnpm pr:generate --yes` to refresh the PR body; verify there are no manual edits.
- [ ] After the simulated merge, run `pnpm changelog -- --yes` and `node scripts/ops/archive-idea-for-issue.mjs <issue> --yes` to finish closeout.
- [ ] Practice rollback with `node scripts/ops/remove-worktree.mjs <issue> --yes --keep-remote` and rerun the branch command in dry-run mode to confirm state.

## Communication Plan

- Drop a summary in the ADR comment thread (`ideas/scripts-firstlifecycle-v3.md`) with links to the recorded dry-runs and any open questions.
- Lane D posts a Playbook status update linking to the new lifecycle overview + rollback patterns.
- Lane B owns follow-up docs; Lane C ensures tooling updates include the new Storybook URLs.

## Follow-up Metrics

- Track `% of lifecycle moves with attached dry-run logs` in weekly ops review.
- Monitor `time from rollback trigger to updated Project status` and capture outliers.
- Ensure every new script touching lifecycle flows links back to the governance docs from its README.
