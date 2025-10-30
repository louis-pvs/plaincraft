# Ideas Source of Truth

- **Audience:** Lane D backlog owners coordinating with Lane B storytellers
- **Decision Anchor:** [Template-first READMEs, Lane B narrative shift](../../templates/ideas/decision.md)
- **Owner:** @lane.b
- **TTL:** Review by 2026-04-30
- **Future Metric:** Fewer than 1% of active idea cards missing `Lane:` metadata during weekly audits
- **Recorded Media:** Record later

## Why it Matters

Plaincraft keeps work aligned by letting `/ideas` drive every downstream artifact. When cards stay accurate, automation can mint Issues, sync PR copy, feed roadmap views, and prime Playbook updates without manual rework. The folder is a contract between lanes: Lane D curates the backlog, Lane B tells the story, and Lane C automates the guardrails.

## Worked Example

`PB-readme-narrative-migration` started as a Playbook idea with a clear acceptance checklist. Lane D validated structure with the template, Lane C ran the idea automation to sync Issues and worktrees, and Lane B lifted the narrative into new Storybook/Playbook destinations once the documentation landed. Because each change looped through the idea card first, every dependent artifact updated in lock-step.

## Constraints to Honour

- **Pre-Issue hygiene:** Card exists before an Issue, includes Purpose/Problem/Proposal/Acceptance, and carries accurate lane metadata.
- **Structure:** Naming prefixes (`U-`, `C-`, `ARCH-`, `PB-`, `B-`) and `## Sub-Issues` sections stay in sync so automation can map parents and children.
- **Lifecycle:** Ticket IDs, roadmap cards, and changelog slugs reuse the same prefix; closed work moves to `/ideas/_archive/<year>/`.
- **Automation health:** Guardrail scripts (`ideas-to-issues`, `create-worktree-pr`, `merge-subissue-to-parent`, `sync-ideas-checklists`) run in dry-run mode first and are preferred over manual edits.

## Links

- Template README: [`templates/ideas/README.md`](../../templates/ideas/README.md)
- Template USAGE: [`templates/ideas/USAGE.md`](../../templates/ideas/USAGE.md)
- Storybook View: [`storybook/docs/ideas-pipeline.mdx`](../../storybook/docs/ideas-pipeline.mdx)
- Ops Scripts: [`scripts/ops/ideas-to-issues.mjs`](../../scripts/ops/ideas-to-issues.mjs), [`scripts/ops/create-worktree-pr.mjs`](../../scripts/ops/create-worktree-pr.mjs), [`scripts/ops/merge-subissue-to-parent.mjs`](../../scripts/ops/merge-subissue-to-parent.mjs), [`scripts/ops/sync-ideas-checklists.mjs`](../../scripts/ops/sync-ideas-checklists.mjs)
- Decision Record: [`ideas/PB-readme-narrative-migration.md`](../../ideas/PB-readme-narrative-migration.md)
