# Script Automation Guardrails

- **Audience:** Lane C automation engineers pairing with Lane B storytellers
- **Decision Anchor:** [Template-first READMEs, Lane B narrative shift](https://github.com/louis-pvs/plaincraft/blob/main/templates/ideas/decision.md)
- **Owner:** @lane.b
- **TTL:** Review by 2026-04-30
- **Future Metric:** 100% of new scripts ship with `--dry-run` + `--yes` gates and smoke tests registered in CI
- **Recorded Media:** Record later

## Why it Matters

Repository scripts are the backbone of Plaincraft’s governance. They seed Issues, guard release notes, and keep documentation thin. When every script follows the template contract, engineers can trust dry runs, stakeholders get consistent logs, and Playbook narratives stay credible.

## Worked Example

`consolidate-changelog.mjs` showcases the play: start from the template, expose the standard flags, wire logging through `_lib/core.mjs`, and publish the narrative in Playbook so release leads know when to promote entries. The same guardrails protect `setup-project.mjs` and the idea automation scripts—any deviation is immediately obvious in CI.

## Constraints to Honour

- Include the template header (`@since`, `@version`, `Summary`) and exit-code semantics.
- Default to preview runs; require `--yes` for writes and surface JSON/text output.
- Keep scripts under 300 LOC with functions under 60 LOC. Share helpers via `_lib/`.
- Register smoke, size, and policy checks so CI failures flag missing guardrails.

## Links

- Template README: [`templates/script/README.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/script/README.md)
- Template USAGE: [`templates/script/USAGE.md`](https://github.com/louis-pvs/plaincraft/blob/main/templates/script/USAGE.md)
- Storybook View: [Governance / Script Automation](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/governance-script-automation--docs)
- Guardrail Scripts: [`scripts/checks/policy-lint.mjs`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/checks/policy-lint.mjs), [`scripts/checks/smoke.mjs`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/checks/smoke.mjs), [`scripts/checks/size-check.mjs`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/checks/size-check.mjs)
- Ops Examples: [`scripts/ops/consolidate-changelog.mjs`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/ops/consolidate-changelog.mjs), [`scripts/ops/setup-project.mjs`](https://github.com/louis-pvs/plaincraft/blob/main/scripts/ops/setup-project.mjs)
