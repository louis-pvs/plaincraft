# Roadmap Project Onboarding

- **Audience:** Lane D project stewards aligning with Lane B stakeholders
- **Decision Anchor:** [Template-first READMEs, Lane B narrative shift](../../templates/ideas/decision.md)
- **Owner:** @lane.b
- **TTL:** Review by 2026-04-30
- **Future Metric:** Roadmap automation succeeds on first run in 95% of new environments
- **Recorded Media:** Record later

## Why it Matters

The Plaincraft roadmap is where ticket flow becomes visible: WIP caps, lane balance, and release readiness all surface here. A consistent onboarding pattern keeps automation confident, preserves stakeholder trust, and lets Lane B tell the story without chasing IDs.

## Worked Example

During the README migration, Lane D cloned the roadmap template and ran the setup scripts to rebuild the project from scratch. Because the template codifies columns, fields, and automation, the roadmap instantly reflected Lane B migrations under the correct view filters while CI picked up the new project ID without manual edits.

## Constraints to Honour

- Respect the template’s naming (`Plaincraft Roadmap`), lane views, and WIP limits.
- Sync `.github/pipeline-config.json` with the new project ID immediately after setup.
- Run label and project setup scripts with `--dry-run` first when auditing an existing board.
- Refresh GitHub CLI tokens with `project` scope before executing setup commands.

## Links

- Template README: [`templates/roadmap-project/README.md`](../../templates/roadmap-project/README.md)
- Template USAGE: [`templates/roadmap-project/USAGE.md`](../../templates/roadmap-project/USAGE.md)
- Storybook View: [`storybook/docs/roadmap-onboarding.mdx`](../../storybook/docs/roadmap-onboarding.mdx)
- Setup Scripts: [`scripts/ops/setup-project.mjs`](../../scripts/ops/setup-project.mjs), [`scripts/ops/setup-labels.mjs`](../../scripts/ops/setup-labels.mjs)
- Decision Record: [`ideas/PB-readme-narrative-migration.md`](../../ideas/PB-readme-narrative-migration.md)
