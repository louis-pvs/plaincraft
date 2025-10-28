# Template-First Enforcement Roadmap

**Date:** 2025-10-28  
**Status:** ✅ Phases 1-3 Complete (Phase 4 Optional)  
**Goal:** Automate enforcement of "Template before guide" governance principle

---

## Core Principle

> **Template before guide.** If a thing can be automated or scaffolded, it must ship as a template, script, or CLI first. Guides are thin wrappers that point to the template and show when to use it, not how to recreate it by hand.

---

## Current State

- **Templates:** 12 (10 directories + 2 root files)
- **Guides:** 4 active guides
- **Ratio:** 12:4 = 3:1 ✓ (target achieved)
- **Enforcement:** Manual review only
- **Compliance:** 100% (all guides reference templates via `scaffold_ref`)

---

## Implementation Roadmap

### ✅ Phase 1: Foundation & CI Enforcement (Week 1-2) - COMPLETE

**Status:** Implemented 2025-10-28

**Created:**

- `scripts/checks/lint-guides.mjs` - Guide validation (323 LOC)
- `scripts/checks/template-coverage.mjs` - Ratio enforcement (447 LOC)
- `.github/workflows/docs-governance.yml` - CI workflow
- Pre-commit hooks via lint-staged
- Package.json scripts: `docs:lint`, `docs:coverage`, `docs:check`

**All Phase 1 objectives achieved.**

---

#### 1.1 Create `scripts/checks/docs-lint.mjs`

**Purpose:** Validate guide compliance with governance rules

**Checks:**

- ✓ Frontmatter presence and completeness
- ✓ Required keys: `id`, `owner`, `lane`, `artifact_id`, `scaffold_ref`, `version`, `created`, `ttl_days`, `last_verified`
- ✓ `scaffold_ref` points to existing `/templates/` directory
- ✓ Word count < 600 words per guide
- ✓ Detect essay patterns (paragraphs >5 lines)
- ✓ Executable code blocks reference real scripts/commands
- ✓ ID format matches `guide-*` pattern
- ✓ TTL not expired (created + ttl_days > today)

**Exit Codes:**

- `0` - All checks passed
- `11` - Validation failed (lint errors)

**Usage:**

```bash
node scripts/checks/docs-lint.mjs              # Check all guides
node scripts/checks/docs-lint.mjs --files guide-workflow.md  # Check specific file
node scripts/checks/docs-lint.mjs --json       # JSON output for CI
```

**Output Format:**

```json
{
  "ok": false,
  "totalGuides": 4,
  "guideLimit": 12,
  "totalErrors": 2,
  "totalWarnings": 3,
  "results": [
    {
      "file": "guide-workflow.md",
      "errors": ["scaffold_ref path does not exist"],
      "warnings": ["Found 1 paragraph(s) >5 lines"]
    }
  ]
}
```

---

#### 1.2 Create `scripts/checks/template-coverage.mjs`

**Purpose:** Enforce 3:1 template:guide ratio and template completeness

**Checks:**

- ✓ Template:guide ratio >= 3:1
- ✓ All template directories have `README.md`
- ✓ All template directories have `USAGE.md`
- ✓ All template directories have `template.config.json`
- ✓ All `template.config.json` files are valid JSON
- ✓ All `template.config.json` have required fields: `id`, `name`, `version`, `category`, `entrypoint`
- ✓ Template versions follow semver (x.y.z)
- ✓ Detect orphaned templates (not referenced by any guide)
- ✓ Detect missing templates (guides reference non-existent templates)

**Exit Codes:**

- `0` - All checks passed, ratio met
- `11` - Validation failed (ratio not met or missing templates)

**Usage:**

```bash
node scripts/checks/template-coverage.mjs                    # Full check
node scripts/checks/template-coverage.mjs --check-ratio      # Only check ratio
node scripts/checks/template-coverage.mjs --orphans          # List orphaned templates
node scripts/checks/template-coverage.mjs --json             # JSON output
```

**Output Format:**

```json
{
  "ok": true,
  "templateCount": 12,
  "guideCount": 4,
  "ratio": "3:1",
  "ratioMet": true,
  "targetRatio": 3.0,
  "actualRatio": 3.0,
  "orphanedTemplates": ["bug-report", "test-integration"],
  "missingTemplates": [],
  "errors": [],
  "warnings": ["2 templates not referenced by any guide"]
}
```

---

#### 1.3 Update `.husky/pre-commit` Hook

**Purpose:** Block commits that violate governance rules

**Add to `lint-staged` config in `package.json`:**

```json
{
  "lint-staged": {
    "guides/*.md": [
      "node scripts/checks/docs-lint.mjs --files",
      "node scripts/checks/template-coverage.mjs --check-ratio"
    ]
  }
}
```

**Behavior:**

- Runs on every commit touching guide files
- Blocks commit if lint fails
- Blocks commit if ratio < 3:1
- Provides immediate feedback to developer

---

#### 1.4 Create `.github/workflows/docs-governance.yml`

**Purpose:** CI enforcement of documentation governance

**Workflow Definition:**

```yaml
name: Documentation Governance

on:
  pull_request:
    paths:
      - "guides/**"
      - "templates/**"
      - "docs/**"
  push:
    branches: [main]

jobs:
  docs-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - name: Lint guides
        run: pnpm run docs:lint
      - name: Check template coverage
        run: pnpm run docs:coverage
      - name: Check for duplicate content
        run: pnpm run docs:dedupe

  enforce-ratio:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - name: Enforce 3:1 ratio
        run: |
          pnpm run docs:coverage --check-ratio
          if [ $? -ne 0 ]; then
            echo "❌ Template:guide ratio must be >= 3:1"
            echo "Current state violates template-first governance"
            exit 1
          fi
```

**Add to `package.json`:**

```json
{
  "scripts": {
    "docs:lint": "node scripts/checks/docs-lint.mjs",
    "docs:coverage": "node scripts/checks/template-coverage.mjs",
    "docs:dedupe": "node scripts/checks/guide-dedupe.mjs",
    "docs:check": "pnpm run docs:lint && pnpm run docs:coverage && pnpm run docs:dedupe"
  }
}
```

---

### ✅ Phase 2: Developer Experience (Week 3) - COMPLETE

**Status:** Implemented 2025-10-28

**Created:**

- `scripts/ops/new-template.mjs` - Interactive template wizard (188 LOC)
- `scripts/ops/new-guide.mjs` - Interactive guide wizard with ratio enforcement (207 LOC)
- `scripts/_lib/templates.mjs` - Shared template operations library (302 LOC)
- Package.json scripts: `pnpm new:template`, `pnpm new:guide`

**All Phase 2 objectives achieved.**

---

#### 2.1 Create `scripts/new-template.mjs`

**Purpose:** Interactive wizard to create compliant template packages

**Features:**

- Interactive prompts for template metadata
- Auto-generates boilerplate README, USAGE, template.config.json
- Creates proper directory structure
- Validates template name and category
- Optionally creates corresponding guide

**Usage:**

```bash
pnpm run new:template

# Interactive prompts:
? Template type: [workflow | testing | script | guide | other]
? Template name: feature-request
? Template category: workflow
? Version: 0.1.0
? Author: @username
? Description: Template for feature request issues

Creating template package...
✓ Created templates/feature-request/
✓ Created templates/feature-request/README.md
✓ Created templates/feature-request/USAGE.md
✓ Created templates/feature-request/template.config.json
✓ Created templates/feature-request/feature-request.md

? Create guide for this template? [Y/n] Y

Running: pnpm run new:guide --template feature-request
```

**Generated Structure:**

```
templates/feature-request/
├── README.md               # Auto-generated overview
├── USAGE.md                # Auto-generated usage examples
├── template.config.json    # With provided metadata
└── feature-request.md      # Empty template file
```

---

#### 2.2 Create `scripts/new-guide.mjs`

**Purpose:** Enforce template-first by requiring template reference

**Features:**

- Lists existing `/templates/` directories
- Requires selection of template before creating guide
- Pre-fills frontmatter with template reference
- Auto-generates boilerplate guide structure
- Includes word count tracker in comments
- Validates guide ID format

**Usage:**

```bash
pnpm run new:guide

# Interactive prompts:
? Guide ID: guide-feature-requests
? Owner: @username
? Lane: [A | B | C | D] D
? Required: Which template does this guide reference?
  [Lists all /templates/ directories]
? Selected: templates/feature-request
? Artifact ID: ARCH-feature-request-workflow

Creating guide...
✓ Created guides/guide-feature-requests.md
✓ Frontmatter populated with template reference
✓ Boilerplate sections added
✓ Word count: 0/600

Guide created successfully!
Next steps:
  1. Fill in "When to use" section
  2. Fill in "When not to use" section
  3. Add executable steps referencing template
  4. Run: pnpm run docs:lint
```

**Generated Guide Structure:**

````markdown
---
id: guide-feature-requests
owner: @username
lane: D
artifact_id: ARCH-feature-request-workflow
scaffold_ref: /templates/feature-request@v0.1
version: 0.1.0
created: 2025-10-28
ttl_days: 90
last_verified: 2025-10-28
---

# When to use

[TODO: Fill in when this guide should be used]

# When not to use

[TODO: Fill in when alternative approaches are better]

# Steps (all executable)

1. **Copy template:**
   ```bash
   cp templates/feature-request/feature-request.md .github/ISSUE_TEMPLATE/
   ```
````

[TODO: Add remaining steps]

# Rollback

[TODO: How to undo]

# Requirements

[TODO: Prerequisites]

# Links

- Template: `/templates/feature-request/`
- Scripts: [TODO: Add related scripts]

<!-- Word count: 0/600 -->

````

---

### ✅ Phase 3: Monitoring & Metrics (Week 4) - COMPLETE

**Status:** Implemented 2025-10-28

**Created:**
- `scripts/checks/docs-report.mjs` - Health dashboard with metrics export (314 LOC)
- `scripts/checks/guide-dedupe.mjs` - Similarity detection (252 LOC)
- `docs/metrics.json` - Auto-generated metrics tracking
- Enhanced pre-commit hooks with ratio enforcement
- Package.json scripts: `pnpm docs:report`, `pnpm docs:dedupe`

**All Phase 3 objectives achieved.**

---

#### 3.1 Create `scripts/docs-report.mjs`

**Purpose:** Generate health dashboard for documentation system

**Features:**
- Calculate current template:guide ratio
- Show guide health (word count, TTL remaining, warnings)
- List orphaned templates
- Show templates without guide references
- Trend analysis (if metrics history exists)
- Export to JSON for tracking

**Usage:**
```bash
pnpm run docs:report              # Full report to console
pnpm run docs:report --json       # JSON output
pnpm run docs:report --save       # Save to docs/metrics.json
````

**Output:**

```
📊 Documentation Governance Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Overall Health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Templates:        12
Guides:           4
Ratio:            3:1 ✓ (target: 3:1)
Ratio Status:     PASSING

📝 Guide Health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ guide-changelog.md
  Words: 233/600 (38% capacity)
  TTL: 67 days remaining
  Status: Healthy

✓ guide-scripts.md
  Words: 333/600 (55% capacity)
  TTL: 67 days remaining
  Warnings: 3 long paragraphs

⚠ guide-workflow.md
  Words: 201/600 (33% capacity)
  TTL: 67 days remaining
  Warnings: 1 long paragraph

📦 Template Coverage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ All templates have README.md
✓ All templates have USAGE.md
✓ All templates have template.config.json

Orphaned Templates (not referenced by guides):
  • bug-report (v0.1.0)
  • test-integration (v0.1.0)

Referenced Templates:
  ✓ changelog → guide-changelog.md
  ✓ issue-unit → guide-workflow.md
  ✓ issue-composition → guide-workflow.md
  ✓ pull-request → guide-workflow.md
  ✓ script → guide-scripts.md
  ✓ test-unit → guide-scripts.md

🎯 Recommendations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Consider creating guide for 'bug-report' template
→ Consider creating guide for 'test-integration' template
→ Break long paragraphs in guide-scripts.md into checklists

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report generated: 2025-10-28T10:30:00Z
```

---

#### 3.2 Create `scripts/checks/guide-dedupe.mjs`

**Purpose:** Detect duplicate or similar content between guides

**Features:**

- Calculate similarity percentage between guides
- Flag guides with >30% similarity (merge candidates)
- Detect duplicated code blocks
- Suggest consolidation opportunities
- Check for duplicate content between guides and docs

**Usage:**

```bash
pnpm run docs:dedupe              # Full deduplication check
pnpm run docs:dedupe --threshold 30  # Custom similarity threshold
pnpm run docs:dedupe --json       # JSON output
```

**Output:**

```
🔍 Guide Deduplication Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ High Similarity Detected

guide-changelog.md ↔ guide-scripts.md
  Similarity: 42%
  Common sections:
    - "When to use" (85% similar)
    - "Requirements" (67% similar)

  Recommendation:
    Consider consolidating these guides or extracting common
    content to a shared reference doc in /docs/

✓ No other high-similarity pairs found

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total comparisons: 6
High similarity pairs: 1 (threshold: 30%)
```

---

#### 3.3 Create `docs/metrics.json` (Auto-generated)

**Purpose:** Track metrics over time for trend analysis

**Generated by:** `pnpm run docs:report --save`

**Format:**

```json
{
  "timestamp": "2025-10-28T10:30:00Z",
  "templates": {
    "count": 12,
    "directories": 10,
    "rootFiles": 2
  },
  "guides": {
    "count": 4,
    "limit": 12,
    "capacity": "33%"
  },
  "ratio": {
    "value": 3.0,
    "target": 3.0,
    "status": "passing"
  },
  "guideHealth": [
    {
      "file": "guide-changelog.md",
      "words": 233,
      "ttlRemaining": 67,
      "warnings": 0,
      "errors": 0
    }
  ],
  "orphanedTemplates": ["bug-report", "test-integration"]
}
```

**Trend Analysis:** Compare against previous metrics.json to show:

- Ratio changes over time
- New templates added
- Guides archived
- Health score trends

---

### ⏸️ Phase 4: Process Enforcement (Optional - Future Enhancement)

**Status:** Not Implemented

**Planned Features:**

- Issue template for guide proposals (`.github/ISSUE_TEMPLATE/new-guide-proposal.md`)
- Template catalog generator (`scripts/generate-template-catalog.mjs`)

**Note:** Phase 4 is optional. Core governance is enforced by Phases 1-3. These features would enhance discoverability and proposal workflow but are not critical for enforcement.

---

#### 4.1 Create `.github/ISSUE_TEMPLATE/new-guide-proposal.md`

**Purpose:** Force template-first thinking at proposal stage

**Template:**

```markdown
---
name: New Guide Proposal
about: Propose a new guide for the /guides/ directory
title: "New Guide: [Guide Name]"
labels: ["documentation", "guide-proposal"]
assignees: ""
---

## Guide Proposal

**Proposed Guide ID:** guide-[name]

**Target Lane:** [ ] A | [ ] B | [ ] C | [ ] D

## Template-First Requirement ⚠️

**This proposal REQUIRES an existing template or script.**

**Which template/script does this guide reference?**

- [ ] Template exists: `/templates/______`
- [ ] Script exists: `/scripts/______`
- [ ] Neither exists (see below)

### If Neither Exists

❌ **This proposal is BLOCKED until you create the template/script first.**

**Why?** Our governance rule: "Template before guide. If a thing can be automated or scaffolded, it must ship as a template, script, or CLI first."

**Next steps:**

1. Create the template first: `pnpm run new:template`
2. Submit PR with the template
3. After template is merged, reopen this proposal

See: `/templates/guide/` for how to create a guide template.

## Justification

**Why is this guide needed?**
[Explain the use case and target audience]

**What problem does it solve?**
[Describe the problem]

**Why can't this be part of an existing guide?**
[Explain why consolidation isn't appropriate]

## Ratio Impact

**Current ratio:** [Templates]:[Guides] = [Ratio]
**After this guide:** [Templates]:[Guides+1] = [New Ratio]

⚠️ **If new ratio < 3:1, this proposal requires adding templates first**

## Checklist

- [ ] Template/script exists and is referenced above
- [ ] Checked existing guides for consolidation opportunity
- [ ] Ratio will remain >= 3:1 after adding this guide
- [ ] Read `/docs/guides-governance.md`
```

---

#### 4.2 Create `scripts/generate-template-catalog.mjs`

**Purpose:** Auto-generate discoverable template index

**Features:**

- Scans `/templates/` directory
- Reads `template.config.json` from each template
- Extracts usage examples from USAGE.md
- Shows which guides reference each template
- Generates markdown catalog

**Usage:**

```bash
pnpm run templates:catalog              # Generate catalog
pnpm run templates:catalog --output templates/index.md  # Custom output
```

**Generated `templates/index.md`:**

````markdown
# Template Catalog

**Auto-generated:** 2025-10-28  
**Total Templates:** 12

---

## Workflow Templates

### bug-report (v0.1.0)

Structured bug report template for consistent issue reporting.

**Category:** workflow  
**Referenced by:** None  
**Created:** 2025-01-28

**Quick Start:**

```bash
cp templates/bug-report/bug-report.md .github/ISSUE_TEMPLATE/
```
````

[View README](./bug-report/README.md) | [View Usage](./bug-report/USAGE.md)

---

### issue-unit (v0.1.0)

Single-purpose issue template for bugs, small features, or focused tasks.

**Category:** workflow  
**Referenced by:** guide-workflow.md  
**Created:** 2025-01-28

**Quick Start:**

```bash
cp templates/issue-unit/issue-unit.md my-issue.md
gh issue create --title "Title" --body-file my-issue.md
```

[View README](./issue-unit/README.md) | [View Usage](./issue-unit/USAGE.md)

---

[... continues for all templates ...]

````

---

## Success Metrics

### ✅ Automated Enforcement (Achieved)
- ✅ Pre-commit blocks commits violating ratio
- ✅ CI blocks PRs with ratio < 3:1
- ✅ CI blocks guides without `scaffold_ref`
- ✅ Zero manual review needed for compliance

### ✅ Developer Experience (Achieved)
- ✅ Template creation time < 2 minutes (via `pnpm new:template`)
- ✅ Guide creation time < 3 minutes (via `pnpm new:guide`)
- ✅ Dashboard available on-demand (`pnpm docs:report`)
- ✅ Ratio enforcement prevents non-compliant guides

### ✅ Documentation Quality (Achieved)
- ✅ Ratio maintained >= 3:1 automatically (12:4 = 3.0:1)
- ✅ Essay-style guides warned (>5 line paragraphs detected)
- ✅ Duplicate content detection available (`pnpm docs:dedupe`)
- ✅ TTL tracking automated (90-day monitoring)

---

## Rollback Plan

If automation causes issues:

1. **Disable pre-commit checks:**
   ```bash
   # Remove from package.json lint-staged config
````

2. **Disable CI workflow:**

   ```bash
   # Comment out .github/workflows/docs-governance.yml
   ```

3. **Keep scripts for manual use:**

   ```bash
   # Scripts still available for manual validation
   pnpm run docs:check
   ```

4. **Revert to manual review:**
   - Add checklist to PR template
   - Manual validation of ratio and scaffold_ref

---

## Dependencies

**Required:**

- Node.js 20.11.0+
- pnpm 9.0.0+
- Git hooks enabled (`simple-git-hooks`)

**Optional:**

- GitHub CLI (`gh`) for template catalog integration
- `tree` command for directory visualization

---

## Maintenance

**Weekly:**

- Review `docs:report` output
- Check for orphaned templates
- Address high-similarity guide pairs

**Monthly:**

- Review TTL expirations
- Archive expired guides
- Update template versions

**Quarterly:**

- Analyze metrics trends
- Adjust ratio target if needed
- Review automation effectiveness

---

## References

- **Governance:** `/docs/guides-governance.md`
- **Implementation:** `/docs/guides-implementation.md`
- **Current Guides:** `/guides/README.md`
- **Templates:** `/templates/`
- **Scripts:** `/scripts/README.md`

---

## Approval & Sign-off

**Created by:** @louis-pvs  
**Date:** 2025-10-28  
**Status:** ✅ **Phases 1-3 Complete**

**Implementation Owner:** @louis-pvs  
**Completed:** 2025-10-28  
**Branch:** `feat/doc-alignment`

**Summary:**
All core governance automation complete. Template-first enforcement is now fully automated through CI/CD, pre-commit hooks, and developer tools. Phase 4 remains optional for future enhancement.

---

_This roadmap ensures the "Template before guide" principle is automatically enforced through CI/CD, making it impossible to violate governance rules._
