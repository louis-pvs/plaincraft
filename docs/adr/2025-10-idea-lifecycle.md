---
id: adr-2025-10-idea-lifecycle
owner: "@lane-d"
status: Accepted
version: 1.0.0
created: 2025-10-28
amended_by: [adr-2025-11-registry-driven-docs]
---

# ADR: Idea Lifecycle, Sources of Truth, and Enforcement Split

## Decision

Content source of truth is the idea Issue or idea file. Status source of truth is GitHub Projects. The canonical workflow lives in /docs/workflows/idea-lifecycle.md. Enforcement is handled by CI and commit/PR rules referenced from policy docs.
