---
id: "ref-contracts"
owner: "@lane-d"
lane: "D"
version: "1.0.0"
created: "2025-11-02"
ttl_days: 90
last_verified: "2025-11-02"
prev: /reference/project-schema
next: /reference/coverage-map
---

# Contracts Manifest

> Canonical source for public workflow and governance contracts referenced in `ARCH-one-artifact-e2e-orch.md`.

## Purpose

Provide a single auditable list of active contracts (identity, lifecycle, schema, frontmatter, template, governance) with owners, versioning, and review cadence so automation and guardrails can reconcile drift.

## Contract List

| ID             | Name                          | Summary                                              | Owner           | Source                              | Review (days) | Status |
| -------------- | ----------------------------- | ---------------------------------------------------- | --------------- | ----------------------------------- | ------------- | ------ |
| identity       | Identity Contract             | Naming formats for IDs, branches, commits, PR titles | Lane D (policy) | ADR `adr-2025-11-one-artifact-e2e`  | 180           | Active |
| lifecycle      | Lifecycle Contract            | Allowed states and single-step transitions           | Lane D          | ADR `adr-2025-11-one-artifact-e2e`  | 180           | Active |
| project-schema | Project Schema Contract       | Required Project fields and types                    | Lane D          | `/docs/reference/project-schema.md` | 180           | Active |
| frontmatter    | ADR/Idea Frontmatter Contract | Parsable keys needed for orchestration               | Lane D          | ADR `adr-2025-11-one-artifact-e2e`  | 180           | Active |
| template       | Template Contract             | Versioned templates with manifest & coverage         | Lane D          | ADR `adr-2025-11-one-artifact-e2e`  | 90            | Active |
| governance     | Governance / RACI             | Ownership & stop rules for enforcement               | Lane D          | ADR `adr-2025-11-one-artifact-e2e`  | 90            | Active |
| freshness      | TTL & Freshness               | Review cadence & stale marking rules                 | Lane D          | ADR `adr-2025-11-one-artifact-e2e`  | 90            | Active |

> Add new rows when new explicit contracts are adopted. Use consistent lower-kebab IDs for automation keys.

## Change Log

| Date       | Contract       | Change                                        | Reason                  | Approved By |
| ---------- | -------------- | --------------------------------------------- | ----------------------- | ----------- |
| 2025-11-02 | frontmatter    | Standardized owner format to quoted "@handle" | VitePress compatibility | Lane D      |
| 2025-11-01 | identity       | Initial manifest entry                        | ADR accepted            | Lane D      |
| 2025-11-01 | lifecycle      | Initial manifest entry                        | ADR accepted            | Lane D      |
| 2025-11-01 | project-schema | Initial manifest entry                        | ADR accepted            | Lane D      |
| 2025-11-01 | frontmatter    | Initial manifest entry                        | ADR accepted            | Lane D      |
| 2025-11-01 | template       | Initial manifest entry                        | ADR accepted            | Lane D      |
| 2025-11-01 | governance     | Initial manifest entry                        | ADR accepted            | Lane D      |
| 2025-11-01 | freshness      | Initial manifest entry                        | ADR accepted            | Lane D      |

## Guardrails

- Each contract must list: ID, owner, source doc, review interval, status.
- Contracts without an owner or overdue review become `Stale` and should block merges touching related areas after grace period.

## Frontmatter Standard

**Owner Field Format:** The `owner` field in YAML frontmatter must be quoted when the value starts with `@`:

```yaml
owner: "@lane-d"    # ✅ Correct - quoted
owner: @lane-d      # ❌ Wrong - YAML parse error
owner: lane-d       # ⚠️  Allowed but not standard
```

This is required for VitePress/YAML compatibility, as `@` is a reserved character in YAML.

- Automation may generate a coverage report linking contracts to tests and docs.

## Next Steps

1. Implement coverage linking (contracts → ADRs → tests/templates).
2. Add stale detection script updating this file.
3. Integrate with `guardrails` scope for enforcement.
