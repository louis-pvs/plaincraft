# Template Catalog

**Auto-generated:** 2025-11-01  
**Total Templates:** 13

> 📖 Canonical documentation now lives on GitHub Pages: https://louis-pvs.github.io/plaincraft/

---

## Quick Navigation

- **Workflow** (6)
  - [Bug Report](#bug-report)
  - [changelog](#changelog)
  - [ideas](#ideas)
  - [Issue (Composition)](#issue-composition)
  - [Issue (Unit)](#issue-unit)
  - [Pull Request](#pull-request)
- **Documentation** (1)
  - [guide](#guide)
- **Planning** (2)
  - [roadmap-project](#roadmap-project)
  - [user-story](#user-story)
- **Tooling** (2)
  - [script](#script)
  - [Snippet - Inline Edit Label](#snippet-inline-edit-label)
- **Testing** (2)
  - [Test (Integration)](#test-integration)
  - [Test (Unit)](#test-unit)

---

## Workflow Templates

### Bug Report

Structured bug report template for consistent issue reporting

**Version:** 0.1.0  
**Category:** workflow  
**Created:** 2025-01-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./bug-report/bug-report.md .
```

📁 [View in repo](./bug-report) | 📖 [README](./bug-report/README.md) | 🚀 [USAGE](./bug-report/USAGE.md)

---

### changelog

Changelog consolidation template with \_tmp/ workflow

**Version:** 0.1.0  
**Category:** workflow  
**Created:** 2025-10-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./changelog/CHANGELOG.md .
```

📁 [View in repo](./changelog) | 📖 [README](./changelog/README.md) | 🚀 [USAGE](./changelog/USAGE.md)

<details>
<summary>Schema Details</summary>

```json
{
  "files": {
    "CHANGELOG.md": {
      "required": true,
      "format": "markdown",
      "validation": {
        "mustStartWith": "# Changelog",
        "versionFormat": "## \\[\\d+\\.\\d+\\.\\d+\\] - \\d{4}-\\d{2}-\\d{2}"
      }
    },
    "_tmp/*.md": {
      "required": false,
      "format": "markdown",
      "validation": {
        "mustStartWith": "# ",
        "namingPattern": "^\\d{3}-[a-z0-9-]+\\.md$"
      }
    }
  },
  "sections": [
    "Highlights",
    "Added",
    "Changed",
    "Deprecated",
    "Removed",
    "Fixed",
    "Security",
    "Tooling & Commands",
    "Rollout Notes"
  ]
}
```

</details>

---

### ideas

**Version:** 0.1.0  
**Category:** workflow  
**Created:** 2025-10-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./ideas/idea-unit-template.md .
```

📁 [View in repo](./ideas) | 📖 [README](./ideas/README.md) | 🚀 [USAGE](./ideas/USAGE.md)

---

### Issue (Composition)

Multi-component issue template for complex features with sub-tasks

**Version:** 0.1.0  
**Category:** workflow  
**Created:** 2025-01-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./issue-composition/issue-composition.md .
```

📁 [View in repo](./issue-composition) | 📖 [README](./issue-composition/README.md) | 🚀 [USAGE](./issue-composition/USAGE.md)

---

### Issue (Unit)

Single-purpose issue template for bugs, small features, or focused tasks

**Version:** 0.1.0  
**Category:** workflow  
**Created:** 2025-01-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./issue-unit/issue-unit.md .
```

📁 [View in repo](./issue-unit) | 📖 [README](./issue-unit/README.md) | 🚀 [USAGE](./issue-unit/USAGE.md)

---

### Pull Request

Standard PR description template with context, changes, and verification checklist

**Version:** 0.1.0  
**Category:** workflow  
**Created:** 2025-01-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./pull-request/pull-request.md .
```

📁 [View in repo](./pull-request) | 📖 [README](./pull-request/README.md) | 🚀 [USAGE](./pull-request/USAGE.md)

---

## Documentation Templates

### guide

Template-first guide template with frontmatter and TTL tracking

**Version:** 0.1.0  
**Category:** documentation  
**Created:** 2025-10-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./guide/guide-template.md .
```

📁 [View in repo](./guide) | 📖 [README](./guide/README.md) | 🚀 [USAGE](./guide/USAGE.md)

<details>
<summary>Schema Details</summary>

```json
{
  "frontmatter": {
    "required": [
      "id",
      "owner",
      "lane",
      "artifact_id",
      "scaffold_ref",
      "version",
      "created",
      "ttl_days",
      "last_verified"
    ],
    "format": "YAML between --- delimiters"
  },
  "sections": {
    "required": [
      "When to use",
      "When not to use",
      "Steps (all executable)",
      "Rollback",
      "Requirements",
      "Links"
    ]
  },
  "constraints": {
    "maxWords": 600,
    "maxGuides": 12,
    "maxInProgress": 3,
    "ttlDays": 90
  }
}
```

</details>

---

## Planning Templates

### roadmap-project

GitHub Projects V2 template for roadmap and sprint tracking

**Version:** 0.1.0  
**Category:** planning  
**Created:** 2025-10-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./roadmap-project/roadmap-project-template.json .
```

📁 [View in repo](./roadmap-project) | 📖 [README](./roadmap-project/README.md) | 🚀 [USAGE](./roadmap-project/USAGE.md)

<details>
<summary>Schema Details</summary>

```json
{
  "columns": ["Backlog", "In Progress", "Review", "Done"],
  "customFields": {
    "priority": ["High", "Medium", "Low"],
    "lane": ["A", "B", "C", "D"],
    "effort": ["XS", "S", "M", "L", "XL"],
    "sprint": "text"
  },
  "views": ["Board", "Sprint", "Priority", "Timeline"],
  "automation": {
    "prCreated": "Move to In Progress",
    "prReadyForReview": "Move to Review",
    "prMerged": "Move to Done",
    "archiveOld": "Archive after 30 days in Done"
  }
}
```

</details>

---

### user-story

Template for creating development-ready user stories that connect ideas to roadmap execution

**Version:** 0.1.0  
**Category:** planning  
**Created:** 2025-10-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./user-story/user-story-template.md .
```

📁 [View in repo](./user-story) | 📖 [README](./user-story/README.md) | 🚀 [USAGE](./user-story/USAGE.md)

<details>
<summary>Schema Details</summary>

```json
{
  "requiredSections": [
    "Title",
    "Persona & Need",
    "Context",
    "Scope",
    "Technical Notes",
    "Risks & Dependencies"
  ],
  "titleFormat": "^\\[(U|C)-[a-z0-9-]+\\]",
  "requiredLinks": ["sourceIdea", "roadmapCard"]
}
```

</details>

---

## Tooling Templates

### script

Compliant script template with full CLI contract and guardrails

**Version:** 0.1.0  
**Category:** tooling  
**Created:** 2025-10-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./script/template-script.mjs .
```

📁 [View in repo](./script) | 📖 [README](./script/README.md) | 🚀 [USAGE](./script/USAGE.md)

<details>
<summary>Schema Details</summary>

```json
{
  "requiredHeader": {
    "tags": ["@since", "@version"],
    "format": "JSDoc block comment at top of file"
  },
  "requiredFlags": [
    "--help",
    "--dry-run",
    "--yes",
    "--output",
    "--log-level",
    "--cwd"
  ],
  "exitCodes": {
    "0": "Success",
    "2": "Noop/idempotent",
    "3": "Partial success",
    "10": "Precondition failed",
    "11": "Validation failed",
    "13": "Unsafe environment"
  },
  "sizeLimits": {
    "maxScriptLines": 300,
    "maxFunctionLines": 60
  }
}
```

</details>

---

### Snippet - Inline Edit Label

Scaffold the InlineEditLabel snippet with controller, default view, headless variant, tests, Storybook docs, and README.

**Version:** 0.1.0  
**Category:** tooling  
**Created:** 2025-02-18  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./snippet-inline-edit-label/snippets/InlineEditLabel/InlineEditLabel.tsx .
```

📁 [View in repo](./snippet-inline-edit-label) | 📖 [README](./snippet-inline-edit-label/README.md) | 🚀 [USAGE](./snippet-inline-edit-label/USAGE.md)

---

## Testing Templates

### Test (Integration)

Integration test template for multi-component and API interaction testing

**Version:** 0.1.0  
**Category:** testing  
**Created:** 2025-01-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./test-integration/test-integration.spec.tsx .
```

📁 [View in repo](./test-integration) | 📖 [README](./test-integration/README.md) | 🚀 [USAGE](./test-integration/USAGE.md)

---

### Test (Unit)

Unit test template for component and function testing with Vitest

**Version:** 0.1.0  
**Category:** testing  
**Created:** 2025-01-28  
**Documentation:** [GitHub Pages](https://louis-pvs.github.io/plaincraft/)

**Quick Start:**

```bash
cp ./test-unit/test-unit.spec.tsx .
```

📁 [View in repo](./test-unit) | 📖 [README](./test-unit/README.md) | 🚀 [USAGE](./test-unit/USAGE.md)

---

---

_Generated by `scripts/ops/generate-template-catalog.mjs`_
_Run `pnpm templates:catalog --yes` to regenerate_
