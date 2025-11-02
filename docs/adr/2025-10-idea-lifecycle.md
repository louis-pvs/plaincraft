---
id: adr-2025-10-idea-lifecycle
owner: @lane-d
status: Accepted
version: 1.0.0
created: 2025-10-28
amended_by: [adr-2025-11-registry-driven-docs]
---

# ADR: Idea Lifecycle, Sources of Truth, and Enforcement Split

## Context

We experienced drift between Issues, Project status, and documentation. A single canonical workflow and clear sources of truth are required.

## Decision

Content source of truth is the idea Issue or idea file. Status source of truth is GitHub Projects. The canonical workflow lives in /docs/workflows/idea-lifecycle.md and defines states, transitions, and RACI. Enforcement is handled by CI and commit/PR rules referenced from policy docs.

## Consequences

One place for policy, one place for status, and reduced ambiguity in ownership. Policy changes happen here; implementation details can evolve elsewhere without reopening this ADR.

## Review

Revisit in 6 months or upon significant process change.
