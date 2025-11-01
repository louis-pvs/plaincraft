---
Title: One-Artifact E2E Orchestration (ADR/Idea → Project, Issues, Branch, PR)
ID: adr-2025-11-one-artifact-e2e
Owner: @lane-d
Lane: D
Version: 1.0.0
Created: 2025-11-01
Status: Draft
TTL (days): 180
Last verified: 2025-11-01
---

## Decision:

Adopt a contracts-driven orchestration where a single ADR or Idea is enough to create or sync: 1) a Project item with required fields, 2) optional sub-issues, 3) a work branch, and 4) a draft PR linked to the ticket, while enforcing naming/compliance and preserving single sources of truth.

## Context:

Process drift and duplicated status across Issues/PRs slow delivery and make docs lie during refactors. We need one initiating artifact (ADR or Idea) that seeds downstream objects and keeps status authoritative in Projects.

## Scope:

All lanes (A, B, C, D) and types (Unit, Composition, Bug, Arch, Playbook). Defines minimal contracts (IDs, state machine, schema, templates) and governance (RACI, stop rules, TTL). Out of scope: org-wide taxonomy changes and vendor migrations.

## Contracts:

1. Identity Contract
   Ticket IDs follow ARCH-#, U-#, C-#, B-#, PB-#.
   Branch format is feat|fix|chore|docs|ci/ID-slug.
   Commit header format is “[ID] type(scope): subject” with no slugs in the header.
   PR title starts “[ID] slug — short subject.”
   Invariant: one open branch and one open PR per ID.

2. Lifecycle Contract
   States are Draft → Ticketed → Branched → PR Open → In Review → Merged → Archived.
   Rule: move one step per transition, no skipping.

3. Project Schema Contract
   Required fields: ID, Type (Unit|Composition|Bug|Arch|Playbook), Lane (A|B|C|D), Status (as above), Owner, Priority (P1–P4).
   Optional: Release, TTL.

4. ADR/Idea Frontmatter Contract (parsable keys)
   id (optional for ADR), title, lane, type, owner, priority, acceptance (must_have[]; wont_have[]; evidence[]), subtasks[] (optional), ttl_days, last_verified, status (ADR only).

5. Template Contract
   Any doc with steps must reference a versioned template using scaffold_ref = /templates/<name>@<semver>.
   Each template includes README.md, USAGE.md, and template.config.json with id, name, version, category, entrypoint.

6. Contracts and Coverage Map
   Architecture Manifest lists public contracts or invariants with IDs, owners, and change log.
   Coverage Map links each contract to units/stories and Playbook pages.
   Effect: contract diff, story change, or template major bump marks linked docs as Stale until re-verified.

## Governance:

### Sources of Truth

- Content lives in ADR/Idea text and code.
- Status lives in the Project item and wins on conflict; reconcile writes status back to the idea frontmatter.

## RACI

- Lane D is accountable for policy, Project schema, canonical workflow, contracts manifest, coverage map.
- Lane C is responsible for enforcement and automation, and publishes dashboards.
- Lane A is responsible for unit READMEs and Storybook truth.
- Lane B is responsible for Playbook accuracy and media.

## Stop Rules

- No ID means no orchestration.
- No scaffold_ref means no merge for README or guide changes.
- If a contract changes and mapped docs aren’t updated or explicitly marked Stale with an expiry, block the merge.
- Wide refactor PRs must include one pilot path (unit + README + Storybook + Playbook) or they don’t merge.

## TTL and Freshness

- Canonical and Enforcement docs review every 90 days.
- Project schema reviews every 180 days.
- Runbooks 60 days.
- Unit READMEs 90 days.
- Playbook pages show Stale if last_verified predates the latest linked change.

Orchestration from one ADR or Idea:

**Trigger A** — Create ADR/Idea

- Parse frontmatter; extract or assign ID.
- Create or sync the Project item with ID, Type, Lane, Owner, Priority, Status set to Ticketed.
- Generate sub-issues from subtasks if present.
- Comment back with the Project link and ID.

**Trigger B** — Move to work

- Transition to Branched creates branch type/ID-slug derived from the title.
- Post the branch name to the ADR/Idea and set Project status to Branched.

**Trigger C** — First push

- Open a draft PR titled “[ID] slug — draft,” link ADR/Idea, copy acceptance bullets into the PR body.
- Set Project status to PR Open.

**Trigger D** — Compliance and Drift

- Enforce commit, PR, and branch contracts; block duplicate branches or PRs by ID.
- If a mapped contract, template, or story changes, mark linked docs Stale and surface that on the PR.

**Trigger E** — Merge and Closeout

- On merge, delete branch, set Project status to Merged, append changelog line from PR title, close or update ADR/Idea, archive if applicable.
- If any linked doc is Stale, open follow-up tasks with owners and a 14-day expiry.

## Invariants

- One ID to one branch to one PR.
- Project moves one state per transition.
- Every actionable doc references a versioned template.
- A clean clone can run any README “Scaffold + Test” in ten minutes or less.
- Stale items older than 14 days stay at three or fewer, or we freeze new contracts until the backlog is cleared.

## Rollout Plan

- Pilot one contract and one end-to-end pattern (unit + README + Storybook + Playbook). Stale marking runs in warn-only.
- Adopt 5–8 contracts; enable blocking after week two.
- Stabilize dashboards for compliance, freshness, and coverage, and enforce CODEOWNERS for contracts, Playbook, and enforcement docs.

## Risks and Mitigations

- Over-flagging leads to alert fatigue: start warn-only, limit to pilot contracts, time-box Stale with expiry.
- Ownership ambiguity: manifest requires a named owner per contract.
- Tooling drift: cache Project field IDs; make reconcilers idempotent with dry-run default.

## Acceptance Criteria

Creating one ADR or Idea with valid fields results in:

- Project item created or updated with Status set to Ticketed.
- Sub-issues created from subtasks if present.
- On transition to work, a correctly named branch is created.
- First push opens a draft PR with the right title and acceptance copied.
- Commit and PR compliance enforced at or above 95 percent.
- Contract, template, or story changes flip linked docs to Stale within one PR cycle.
- Merge deletes the branch, updates changelog, sets Project to Merged, and closes or updates the ADR/Idea.

## References

Canonical workflow: /docs/workflows/idea-lifecycle.md
Enforcement contract: /docs/policy/workflow-enforcement.md
Project schema: /docs/reference/project-schema.md
Architecture manifest: /docs/reference/contracts.md
Coverage map: /docs/reference/coverage-map.md
