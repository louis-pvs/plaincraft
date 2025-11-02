---
id: adr-2025-11-registry-driven-docs
owner: "@lane-d"
status: Accepted
version: 1.1.0
created: 2025-11-02
review_after_days: 180
relates_to: adr-2025-10-idea-lifecycle
depends_on: adr-2025-10-idea-lifecycle
---

# ADR: Registry-Driven Docs — Single Source, Generated Surfaces

## Context

Playbook pages, Storybook docs, and lane runbooks drifted when edited by hand. We need a single editable registry and generated projections that stay in sync with components and contracts as architecture evolves.

## Decision

1. Establish a Doc Registry at /docs/\_registry.yaml as the only editable source for cross-surface facts: IDs, owners, dependencies, templates, navigation, TTL, and verification.
2. Treat Storybook docs, Playbook pages, lane runbooks, navigation, and sitemap as generated projections of the registry plus unit READMEs (snippets only).
3. Keep policy and workflow canonical in /docs/workflows/idea-lifecycle.md. Projections link to it; they do not embed policy diagrams.
4. Enforce with gates: projections carry a header “Generated from /docs/\_registry.yaml • Do not edit by hand.” Direct edits fail CI; authors must update the registry instead.

## Scope

In scope: Storybook docs, Playbook pages, runbooks, sidebar navigation, sitemap, stale badges, doc status (Verified/Stale/Waived). Out of scope: changing the canonical workflow policy, editing unit code, or authoring templates themselves.

## Contracts

Identity: every artifact has a stable id (PATTERN-_, RUNBOOK-_, WORKFLOW-_, CONTRACT-_). IDs never change; titles may.
Referencing: cross-links use IDs resolved by the generator, not hardcoded paths.
Template-first: instructional pages declare a versioned template_ref. Major template bumps mark dependents Stale.
Dependencies: components, stories, and contracts list what a doc depends on. Name or hash changes mark dependents Needs re-verify.
Freshness: ttl_days and last_verified drive badges and warnings; past TTL shows Stale until re-verified or waived.
Navigation: nav.section and nav.order in the registry are canonical for every surface.

## Consequences

Authors update the registry and unit READMEs; projections rebuild automatically. Architecture or story changes flip mapped pages to Stale. Merges that impact mapped surfaces must include a doc-impact answer. Direct edits to projections are rejected; ownership lives in the registry and unit sources.

## Gates (build and PR)

Fail if projections are edited by hand, an ID is missing/duplicated, a Playbook page lacks template_ref or assets.alt, nav items do not match registry, or dependents are Stale without a dated waiver.
Warn when GIF size exceeds 2 MB, narrative body exceeds caps, or verification is within 7 days of TTL.

## Rollout

Seed the registry with one workflow entry, one pattern, one runbook, and referenced contracts. Protect generated paths via CODEOWNERS and gates. Pilot with Inline Edit end-to-end, then batch-migrate.

## Risks & Mitigations

Stale registry mitigated by TTL and required re-verification on mapped-surface PRs.
ID collisions mitigated by failing builds on duplicates.
Manual projection edits mitigated by CI gates and CODEOWNERS.
Over-strict gates mitigated by time-boxed waivers from Lane D (≤14 days) recorded in the registry.

## References

Canonical workflow: /docs/workflows/idea-lifecycle.md
Enforcement policy: /docs/policy/workflow-enforcement.md
Project schema: /docs/reference/project-schema.md

## Acceptance Criteria

Registry is the only source for cross-surface facts; projections generate cleanly.
Contract/story/template changes mark dependents Stale; waivers are explicit and dated.
PRs that touch mapped surfaces include a completed doc-impact section.
The canonical diagram remains single-sourced and linked by every projection.

# Automation vs Manual — per Surface and per Lane

Rule: edit once in the registry or unit README; everything else is generated.

Storybook Docs (MDX)
• Automated: page metadata, links by ID, nav, badges, dependency chips, embedded unit README snippet, a11y/interaction summaries (if artifacts exist).
• Manual: Lane A maintains unit README snippet; Lane B may edit a short rationale in the registry body (≤200 words).
• Lanes: A updates snippets; B edits rationale; C enforces gates; D approves TTL and structure changes.

Playbook Pages (MD)
• Automated: shell from registry; links by ID; nav; badges; asset embeds (gif/thumb/alt); stale banners.
• Manual: Lane B writes the 200-word narrative and 2-line caption. Lane A re-records assets when stories change.
• Lanes: B owns narrative/captions; A delivers assets; C enforces caps and stale rules; D approves waivers and mappings.

Lane Runbooks (MD)
• Automated: checklists, owners, linked policies, TTL badges from registry; nav and sitemap entries.
• Manual: each runbook has a single Notes section (≤120 words) for lane-specific nuance.
• Lanes: D owns model and TTLs; C enforces read-only zones; A/B keep Notes tidy.

Canonical Workflow Doc
• Automated: none; policy lives here by design.
• Manual: Lane D edits and versions the workflow and diagram.

Enforcement Policy
• Automated: gates may append compliance metrics into the policy appendix.
• Manual: Lane C updates rules (subject to D approval) and dashboard links.

Navigation & Sitemap
• Automated: entirely generated from registry nav fields and artifact presence.
• Manual: none; change registry nav entries instead.

Project Schema Reference
• Automated: none (stable reference).
• Manual: Lane D updates when fields or states change; projections link.
