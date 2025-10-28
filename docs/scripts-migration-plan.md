# Scripts Migration Plan

**Date:** 2025-10-28  
**Status:** In Progress  
**Goal:** Align all scripts with repository guardrails for maintainability, testability, and CI automation.

---

## Overview

This document outlines the strategy for migrating 27 existing scripts to the new guardrails-compliant structure. The migration prioritizes safety, incremental progress, and minimal disruption to existing workflows.

## Current State

### Existing Scripts (27 total)

Located in `/scripts` root:

- archive-idea-for-issue.mjs
- auto-tag.mjs
- bump-version.mjs ✅ **Migrated**
- check-ci.mjs
- cleanup-ideas.mjs
- commit-msg-hook.mjs
- consolidate-changelog.mjs
- create-issues-from-changelog.mjs
- create-worktree-pr.mjs
- generate-gh-pages-index.mjs
- generate-pr-content.mjs
- generate-pr-content.spec.mjs
- ideas-to-issues.mjs
- manual-update-pr-checkboxes.mjs
- merge-subissue-to-parent.mjs
- new-snippet.mjs
- post-checkout.mjs
- pr-requirements.mjs
- pre-commit-changelog.mjs
- prepare-gh.mjs
- record-stories.mjs
- setup-labels.mjs
- setup-project.mjs
- sync-ideas-checklists.mjs
- sync-issue-to-card.mjs
- test-storybook.mjs
- validate-ideas.mjs

### New Structure

```
/scripts/
  _lib/                   # Pure helpers, no I/O
    core.mjs             ✅ Logger, parseFlags, repoRoot, atomicWrite, etc.
    git.mjs              ✅ Git operations
    github.mjs           ✅ GitHub API via gh CLI
    validation.mjs       ✅ Schema validation, policy checks
    allowlist.json       ✅ Network whitelist

  ops/                    # Orchestrators
    bump-version.mjs     ✅ Refactored example

  checks/                 # Validations and linters
    policy-lint.mjs      ✅ Enforce guardrails
    smoke.mjs            ✅ Smoke test all scripts

  migration/              # One-off data moves

  DEPRECATED/             # Auto-redirect shims (90-day expiry)
```

---

## Categorization Strategy

### 1. **Pure Helpers → `_lib/`**

Extract reusable functions with no side effects:

**Candidates:**

- Parsing logic from `validate-ideas.mjs`
- GitHub API wrappers from `create-worktree-pr.mjs`, `ideas-to-issues.mjs`
- File I/O helpers from multiple scripts
- Markdown parsing utilities

**New Files to Create:**

- `_lib/ideas.mjs` - Idea file parsing and validation
- `_lib/markdown.mjs` - Markdown utilities
- `_lib/changelog.mjs` - Changelog parsing
- `_lib/pr.mjs` - PR generation and manipulation

### 2. **Orchestrators → `ops/`**

Scripts that compose `_lib` functions:

**Candidates (Priority Order):**

1. `bump-version.mjs` ✅ **Done**
2. `setup-labels.mjs` - Simple, good next target
3. `validate-ideas.mjs` - Extract validation logic first
4. `create-worktree-pr.mjs` - Complex, refactor git/github libs first
5. `ideas-to-issues.mjs` - After idea lib exists
6. `consolidate-changelog.mjs` - After changelog lib
7. `generate-pr-content.mjs` - After pr lib

### 3. **Validators → `checks/`**

Scripts that perform checks without mutating state:

**Candidates:**

1. `check-ci.mjs` - CI status checker
2. `pr-requirements.mjs` - PR validation
3. `validate-ideas.mjs` - After extracting lib

### 4. **Hooks → Special Handling**

Git hooks need special consideration:

**Scripts:**

- `commit-msg-hook.mjs` - Keep at root or `/hooks`
- `post-checkout.mjs` - Keep at root or `/hooks`
- `pre-commit-changelog.mjs` - Keep at root or `/hooks`

**Strategy:** Create `/scripts/hooks/` subdirectory or keep at root with shim in new structure.

### 5. **One-offs → `migration/`**

Scripts that should run once or are specific to a point in time:

**Candidates:**

- `cleanup-ideas.mjs` - One-time cleanup
- `archive-idea-for-issue.mjs` - Manual operation
- `merge-subissue-to-parent.mjs` - Specific workflow

---

## Migration Phases

### Phase 1: Foundation (✅ Complete)

- [x] Create folder structure
- [x] Build `_lib/core.mjs`
- [x] Build `_lib/git.mjs`
- [x] Build `_lib/github.mjs`
- [x] Build `_lib/validation.mjs`
- [x] Create `checks/policy-lint.mjs`
- [x] Create `checks/smoke.mjs`
- [x] Refactor one example script (`bump-version.mjs`)
- [x] Update `package.json` with guardrails commands

### Phase 2: Extract Common Libraries (Next)

**Goal:** Build shared libraries that existing scripts can use.

1. **Create `_lib/ideas.mjs`**
   - Extract from `validate-ideas.mjs`, `ideas-to-issues.mjs`, `sync-ideas-checklists.mjs`
   - Functions: `parseIdeaFile()`, `validateIdeaStructure()`, `findIdeaFiles()`
2. **Create `_lib/markdown.mjs`**
   - Extract from PR and changelog scripts
   - Functions: `parseMarkdown()`, `extractSections()`, `generateMarkdown()`

3. **Create `_lib/changelog.mjs`**
   - Status: completed (shared changelog helpers now consumed by ops scripts)
   - Extracted from `consolidate-changelog.mjs`, `create-issues-from-changelog.mjs`

4. **Create `_lib/pr.mjs`**
   - Extract from `generate-pr-content.mjs`, `manual-update-pr-checkboxes.mjs`
   - Functions: `generatePRBody()`, `updatePRCheckboxes()`, `parsePRTemplate()`

### Phase 3: Migrate High-Value Scripts

**Priority Order:**

1. **`setup-labels.mjs` → `ops/setup-labels.mjs`**
   - Low complexity
   - Uses `_lib/github.mjs`
   - Good learning case

2. **`validate-ideas.mjs` → `checks/validate-ideas.mjs`**
   - After `_lib/ideas.mjs` exists
   - Pure validation, no writes

3. **`check-ci.mjs` → `checks/check-ci.mjs`**
   - Already a checker
   - Minimal refactor

4. **`create-worktree-pr.mjs` → `ops/create-worktree-pr.mjs`**
   - Complex orchestrator
   - After git/github libs are battle-tested

5. **`ideas-to-issues.mjs` → `ops/ideas-to-issues.mjs`**
   - After `_lib/ideas.mjs` exists
   - High value for automation

### Phase 4: Migrate Medium Priority Scripts

6. `consolidate-changelog.mjs` → `ops/consolidate-changelog.mjs` (migrated)
7. `create-issues-from-changelog.mjs` → `ops/create-issues-from-changelog.mjs` (migrated)
8. `generate-pr-content.mjs` → `ops/generate-pr-content.mjs` (failing policy-lint: add CLI contract)
9. `sync-ideas-checklists.mjs` → `ops/sync-ideas-checklists.mjs` (failing policy-lint: add CLI contract)
10. `setup-project.mjs` → `ops/setup-project.mjs` (migrated)
11. `auto-tag.mjs` → `ops/auto-tag.mjs` (failing policy-lint: add CLI contract)

### Phase 5: Migrate Low Priority / One-offs

12. `cleanup-ideas.mjs` → `migration/cleanup-ideas.mjs`
13. `archive-idea-for-issue.mjs` → `migration/archive-idea-for-issue.mjs`
14. Remaining scripts as needed

### Phase 6: Deprecation & Cleanup

1. Move old scripts to `DEPRECATED/` with redirect shims
2. Update all documentation and guides
3. Update CI workflows
4. Remove `DEPRECATED/` scripts after 90 days

---

## Per-Script Migration Checklist

For each script being migrated:

**Pre-Migration:**

- [ ] Read existing script, understand purpose
- [ ] Identify reusable functions → extract to `_lib/`
- [ ] Document dependencies and side effects
- [ ] Note any hardcoded paths or assumptions

**Migration:**

- [ ] Add header with `@since`, `@version`
- [ ] Implement CLI contract (`--help`, `--dry-run`, `--yes`, `--output`, `--log-level`, `--cwd`)
- [ ] Use `zod` for schema validation
- [ ] Use `Logger` for structured logging
- [ ] Implement idempotent operations
- [ ] Add preflight checks
- [ ] Use atomic writes for file operations
- [ ] Add exit code semantics
- [ ] Support `--output json` with `runId`, `script`, `durationMs`

**Post-Migration:**

- [ ] Test `--help` flag
- [ ] Test `--dry-run` mode
- [ ] Test `--yes` execution
- [ ] Test `--output json`
- [ ] Write unit tests for `_lib` functions
- [ ] Update `package.json` scripts
- [ ] Update documentation
- [ ] Create redirect shim in root
- [ ] Mark old script as deprecated

---

## Backward Compatibility Strategy

To avoid breaking existing workflows:

### Option A: Redirect Shims (Recommended)

Keep old scripts at root with a simple redirect:

```js
#!/usr/bin/env node
/**
 * bump-version.mjs
 * @deprecated since=2025-10-28 replace=ops/bump-version.mjs
 * This is a redirect shim. Use `node scripts/ops/bump-version.mjs` instead.
 */

console.warn("⚠️  This script has moved to scripts/ops/bump-version.mjs");
console.warn("   Update your commands. This shim expires 2026-01-26.\n");

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const newScript = join(__dirname, "ops", "bump-version.mjs");

const proc = spawn("node", [newScript, ...process.argv.slice(2)], {
  stdio: "inherit",
});

proc.on("exit", (code) => process.exit(code ?? 2));
```

### Option B: Symlinks

```bash
cd /scripts
ln -s ops/bump-version.mjs bump-version.mjs
```

**Recommendation:** Use Option A (redirect shims) for visibility and enforcement of 90-day deprecation policy.

---

## Testing Strategy

### Unit Tests

Create tests for each `_lib` module:

```
_lib/core.spec.mjs
_lib/git.spec.mjs
_lib/github.spec.mjs
_lib/validation.spec.mjs
_lib/ideas.spec.mjs
_lib/markdown.spec.mjs
_lib/changelog.spec.mjs
_lib/pr.spec.mjs
```

### Integration Tests

Create fixtures and test ops scripts:

```
ops/bump-version.spec.mjs
ops/setup-labels.spec.mjs
checks/validate-ideas.spec.mjs
```

### Smoke Tests

Automated via `scripts:smoke`:

- All scripts respond to `--help`
- All ops scripts support `--dry-run --output json`

---

## CI Integration

### New Workflow: `scripts-guardrails.yml`

```yaml
name: Scripts Guardrails

on:
  pull_request:
    paths:
      - "scripts/**"
  push:
    branches: [main]

jobs:
  guardrails:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: pnpm install
      - name: Policy Lint
        run: pnpm scripts:lint
      - name: Unit Tests
        run: pnpm scripts:test
      - name: Smoke Tests
        run: pnpm scripts:smoke
```

### Fail Fast Rules

- Any script lacking header → build fails
- Dangerous patterns detected → build fails
- Deprecated scripts >90 days → build fails
- `--help` returns non-zero → build fails
- Scripts >300 LOC → warning (enforced after 30 days)

---

## Timeline

### Week 1 (Current)

- ✅ Foundation complete
- Next: Extract `_lib/ideas.mjs`, `_lib/markdown.mjs`

### Week 2

- Migrate 5 high-priority scripts
- Write unit tests for new libs
- Update documentation

### Week 3

- Migrate remaining scripts
- Create redirect shims
- Update CI workflows

### Week 4

- Polish and testing
- Team review and feedback
- Mark legacy scripts as deprecated

### 90 Days Later

- Remove `DEPRECATED/` scripts
- Declare full migration complete

---

## Success Metrics

**Automation ratio:** ≥3:1 (script calls vs manual steps)  
**Rerun safety:** ≥95% noop on repeated runs  
**MTTR for failures:** <10 minutes (structured logs + validation)  
**Test coverage:** ≥80% for `_lib` functions  
**LOC per script:** <300 lines  
**Function LOC:** <60 lines

---

## Rollback Plan

If migration causes issues:

1. Redirect shims ensure old paths still work
2. Revert specific problematic scripts
3. Keep old script at root until fixed
4. Update only `package.json` references

---

## Questions & Decisions Needed

- [ ] Create `/scripts/hooks/` or keep hooks at root?
- [ ] Symlinks vs redirect shims for backward compat?
- [ ] Should we version `_lib` modules separately?
- [ ] CI enforcement timeline: warnings vs errors?

---

## Next Actions

1. **Immediate:** Extract `_lib/ideas.mjs` from `validate-ideas.mjs`
2. **This week:** Migrate `setup-labels.mjs` → `ops/setup-labels.mjs`
3. **This week:** Create unit tests for `_lib/core.mjs`
4. **Document:** Update `guides/SCRIPTS-REFERENCE.md` with new structure

---

**Owner:** Scripts alignment initiative  
**Last Updated:** 2025-10-28  
**Review Date:** 2025-11-04
