# Release Changelog Automation

- **Audience:** Lane D release leads who own Playbook status notes
- **Decision Anchor:** [Template-first READMEs, Lane B narrative shift](../../templates/ideas/decision.md)
- **Owner:** @lane.b
- **TTL:** Review by 2026-04-30
- **Future Metric:** Keep `_tmp/` backlog under 3 pending summaries per release
- **Recorded Media:** Record later

## Why it Matters

Deprecating legacy guides means release storytelling must live where work happens. The changelog template and consolidation script give Lane D a predictable release note handshake without bloating unit READMEs. This pattern keeps the “what changed” narrative close to automation while Lane B surfaces the business outcome in the Playbook.

## Worked Example

> Decision: Ship a post-merge changelog within 24 hours for PB-readme-narrative-migration.

Lane D captured the release headline inside `_tmp/102-readme-migration.md`, referencing `[PB-readme-narrative-migration]` and noting which templates moved. Running `pnpm changelog -- --yes` invoked [`scripts/ops/consolidate-changelog.mjs`](../../scripts/ops/consolidate-changelog.mjs), which promoted the entry into `CHANGELOG.md`, stamped the version/date, and wiped the processed temp files. The resulting highlight was quoted in the Playbook status note with a deep link to the new changelog section, so stakeholders could scan the exact wording without rereading README history.

The template keeps the narrative constrained to business outcomes while the unit script enforces formatting, deduplication, and cleanup.

## Constraints to Honour

- `_tmp/` entries must point at a ticket or idea ID; otherwise the script exits with `validation_error`.
- Release versions come from `package.json`. Override via `--version` only if the release tag already exists.
- Skip the `--yes` flag during dry runs so the script emits the diff without mutating `CHANGELOG.md`.
- Keep `_tmp/` under source control so CI catches stale backlog.

## Links

- Template README: [`templates/changelog/README.md`](../../templates/changelog/README.md)
- Template USAGE: [`templates/changelog/USAGE.md`](../../templates/changelog/USAGE.md)
- Unit README: [`scripts/ops/README.md`](../../scripts/ops/README.md) _(includes consolidate-changelog reference)_
- Unit Script: [`scripts/ops/consolidate-changelog.mjs`](../../scripts/ops/consolidate-changelog.mjs)
- Decision Record: [`ideas/PB-readme-narrative-migration.md`](../../ideas/PB-readme-narrative-migration.md)
