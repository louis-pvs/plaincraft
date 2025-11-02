---
id: ref-pattern-frontmatter-schema
owner: "@lane-d"
lane: D
version: 1.0.0
created: 2025-11-02
ttl_days: 180
last_verified: 2025-11-02
---

# Pattern Frontmatter Schema

## Purpose

Defines the required frontmatter fields for playbook patterns to enable automatic sidebar categorization and navigation generation per the Registry-Driven Docs ADR.

## Required Fields

### Core Identity

| Field           | Type   | Description                                      | Example                           |
| --------------- | ------ | ------------------------------------------------ | --------------------------------- |
| `id`            | string | Unique pattern identifier                        | `pattern-inline-edit-label`       |
| `type`          | enum   | Pattern category (see Types below)               | `ui-component`                    |
| `owner`         | string | Lane responsible for maintenance (quoted handle) | `"@lane-a"`                       |
| `lane`          | string | Lane letter (A, B, C, or D)                      | `A`                               |
| `version`       | semver | Pattern version                                  | `1.0.0`                           |
| `created`       | date   | Creation date (YYYY-MM-DD)                       | `2025-11-02`                      |
| `ttl_days`      | number | Review interval in days                          | `180`                             |
| `last_verified` | date   | Last verification date                           | `2025-11-02`                      |
| `prev`          | string | Previous page in sequence                        | `/patterns/`                      |
| `next`          | string | Next page in sequence (optional on last)         | `/patterns/ideas-source-of-truth` |

### Optional Fields

| Field            | Type   | Description                                  | Example                                |
| ---------------- | ------ | -------------------------------------------- | -------------------------------------- |
| `storybook_path` | string | Path to Storybook story (UI components only) | `/docs/snippets-inlineeditlabel--docs` |
| `depends_on`     | array  | Contract/artifact dependencies               | `["adr-2025-11-one-artifact-e2e"]`     |
| `relates_to`     | array  | Related patterns/docs                        | `["pattern-ideas-source-of-truth"]`    |

## Pattern Types

Patterns are automatically grouped in the sidebar based on the `type` field:

### `ui-component`

**Sidebar Group:** "UI Component Patterns"  
**Description:** Interactive UI components with Storybook stories  
**Owner:** Typically Lane A  
**Examples:** Inline Edit Label, Form Controls, Data Tables  
**Required Extra Fields:** `storybook_path`

### `workflow`

**Sidebar Group:** "Workflow Patterns"  
**Description:** Process and lifecycle patterns  
**Owner:** Typically Lane D  
**Examples:** Ideas Source of Truth, Scripts-First Lifecycle patterns  
**Related To:** `/docs/workflows/` canonical docs

### `automation`

**Sidebar Group:** "Automation & Governance"  
**Description:** Scripts, CI/CD, and guardrail patterns  
**Owner:** Typically Lane C or B (narrative)  
**Examples:** Script Automation Guardrails, Release Changelog Automation, Project Onboarding  
**Related To:** Script templates and enforcement policies

## Automatic Sidebar Generation

The VitePress config will be generated from pattern frontmatter:

```typescript
// Example auto-generated structure
sidebar: [
  {
    text: "UI Component Patterns",
    items: patterns
      .filter((p) => p.type === "ui-component")
      .map((p) => ({ text: p.title, link: p.path })),
  },
  {
    text: "Workflow Patterns",
    items: patterns
      .filter((p) => p.type === "workflow")
      .map((p) => ({ text: p.title, link: p.path })),
  },
  {
    text: "Automation & Governance",
    items: patterns
      .filter((p) => p.type === "automation")
      .map((p) => ({ text: p.title, link: p.path })),
  },
];
```

## Validation Rules

1. **Type must be valid:** One of `ui-component`, `workflow`, or `automation`
2. **Owner format:** Must be quoted GitHub handle: `"@lane-x"`
3. **Lane must match owner:** Lane letter should correspond to owner
4. **ID format:** Must follow `pattern-{kebab-case}` convention
5. **Navigation chain:** `prev` and `next` must form complete chain within type group
6. **Storybook path required:** UI components must have `storybook_path`
7. **TTL enforced:** Pages past `last_verified + ttl_days` marked stale

## Adding New Patterns

1. Create pattern file in `/playbook/patterns/`
2. Add complete frontmatter with correct `type`
3. Set `prev` to last pattern in same type group
4. Update previous pattern's `next` to point to new pattern
5. Sidebar will automatically categorize based on `type`

## Migration Notes

- Existing patterns updated with `type` field
- UI components get `storybook_path`
- Navigation chains maintained within each type group
- Future: Script will auto-generate sidebar from frontmatter

## References

- Registry-Driven Docs ADR: `/docs/adr/2025-11-registry-driven-docs.md`
- VitePress Frontmatter: https://vitepress.dev/reference/frontmatter-config
- Playbook Config: `/playbook/.vitepress/config.ts`
