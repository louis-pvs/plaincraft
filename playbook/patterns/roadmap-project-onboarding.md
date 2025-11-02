---
id: pattern-roadmap-project-onboarding
type: automation
owner: "@lane-b"
lane: B
version: 1.0.0
created: 2025-11-02
ttl_days: 180
last_verified: 2025-11-02
prev: /patterns/release-changelog-automation
next: /patterns/backlog-pilot-scripts-first
---

# Roadmap Project Onboarding

- **Audience:** Lane D project stewards aligning with Lane B stakeholders
- **Decision Anchor:** [Template-first READMEs, Lane B narrative shift](https://github.com/louis-pvs/plaincraft/blob/main/templates/ideas/decision.md)
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

- Template README: [`templates/roadmap-project/README.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/roadmap-project/README.md)
- Template USAGE: [`templates/roadmap-project/USAGE.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/roadmap-project/USAGE.md)
- Storybook View: [Governance / Roadmap Onboarding](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-roadmap-onboarding--docs)
- Setup Scripts: [`scripts/ops/setup-project.mjs`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/ops/setup-project.mjs), [`scripts/ops/setup-labels.mjs`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/ops/setup-labels.mjs)
- Decision Record: [`ideas/PB-readme-narrative-migration.md`](https://github.com/louis-pvs/plaincraft/blob/main/ideas/PB-readme-narrative-migration.md)
