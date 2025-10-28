# Scripts Alignment - Implementation Summary

**Date:** 2025-10-28  
**Status:** Foundation Complete - Ready for Phase 2

---

## What Was Accomplished

### ✅ Phase 1: Foundation (Complete)

#### 1. Folder Structure Created

```
/scripts/
├── _lib/                    # Pure helper libraries
│   ├── core.mjs            ✅ Core utilities (Logger, parseFlags, repoRoot, etc.)
│   ├── git.mjs             ✅ Git operations (worktrees, branches, commits)
│   ├── github.mjs          ✅ GitHub API via gh CLI (issues, PRs, labels)
│   ├── validation.mjs      ✅ Policy validation (headers, patterns, size)
│   └── allowlist.json      ✅ Network domain whitelist
│
├── ops/                     # Orchestrators
│   └── bump-version.mjs    ✅ Example migration (version bumping)
│
├── checks/                  # Validators and linters
│   ├── policy-lint.mjs     ✅ Enforce script guardrails
│   └── smoke.mjs           ✅ Test --help and --dry-run
│
├── migration/               # One-off data migrations
│
├── DEPRECATED/              # Deprecated script shims (90-day expiry)
│
├── _template-ops.mjs       ✅ Template for new ops scripts
├── _template-check.mjs     ✅ Template for new check scripts
├── MIGRATION-PLAN.md       ✅ Detailed migration roadmap
└── README.md               ✅ Comprehensive documentation
```

#### 2. Core Libraries Built

**`_lib/core.mjs`** - 310 lines

- `Logger` class with configurable levels
- `repoRoot()` - Find git repository root
- `atomicWrite()` - Atomic file operations
- `parseFlags()` - CLI argument parser
- `formatOutput()` - JSON/text formatting
- `fail()` / `succeed()` - Structured exit helpers
- `generateRunId()` - Unique run identifiers
- `readJSON()` / `writeJSON()` - Safe JSON I/O
- `validateEnvironment()` - Environment checks
- `isInsideRepo()` - Path safety checks

**`_lib/git.mjs`** - 115 lines

- `isGitClean()` - Check working directory status
- `getCurrentBranch()` - Get current branch
- `branchExists()` - Check branch existence
- `getRecentCommits()` - Fetch commit messages
- `createWorktree()` - Create git worktree
- `removeWorktree()` - Remove worktree
- `listWorktrees()` - List all worktrees

**`_lib/github.mjs`** - 145 lines

- `isGhAuthenticated()` - Check gh CLI auth
- `getIssue()` - Fetch issue details
- `createPR()` - Create pull request
- `listIssues()` - List issues with filters
- `getPR()` - Get PR details
- `updatePR()` - Update PR
- `createLabel()` - Create/update label

**`_lib/validation.mjs`** - 172 lines

- `loadAllowlist()` - Load network whitelist
- `isUrlAllowed()` - Validate URLs
- `validateScriptHeader()` - Check metadata
- `validateCLIContract()` - Verify required flags
- `detectDangerousPatterns()` - Find unsafe code
- `checkSizeCompliance()` - Enforce LOC limits

#### 3. Enforcement Tools Created

**`checks/policy-lint.mjs`** - 193 lines

- Validates all scripts against guardrails
- Checks header metadata (@since, @version, @deprecated)
- Verifies CLI contract compliance
- Detects dangerous patterns (sudo, eval, secrets)
- Enforces size limits (<300 LOC, <60 LOC/function)
- Checks deprecated script age (90-day rule)
- **Exit codes:** 0 (pass), 11 (validation), 13 (unsafe)

**`checks/smoke.mjs`** - 225 lines

- Tests all executable scripts
- Runs `--help` on every script (must exit 0)
- Runs `--dry-run --output json` on ops scripts
- Validates JSON output structure
- 5-second timeout per script
- **Exit codes:** 0 (pass), 11 (failure)

#### 4. Example Migration

**`ops/bump-version.mjs`** - 237 lines

- Fully refactored from original `bump-version.mjs`
- Implements complete CLI contract
- Uses `zod` for schema validation
- Supports dry-run mode
- Atomic writes
- Structured logging
- JSON output support
- GitHub Actions integration

#### 5. Package.json Integration

Added to `scripts` section:

```json
"scripts:lint": "node scripts/checks/policy-lint.mjs",
"scripts:test": "vitest run --reporter=dot scripts/**/*.spec.mjs",
"scripts:smoke": "node scripts/checks/smoke.mjs",
"scripts:guardrails": "pnpm scripts:lint && pnpm scripts:test && pnpm scripts:smoke"
```

#### 6. Documentation

- **`MIGRATION-PLAN.md`** (450+ lines)
  - Complete categorization of 27 existing scripts
  - Phase-by-phase migration strategy
  - Per-script checklist
  - Backward compatibility strategy
  - Timeline and metrics

- **`README.md`** (430+ lines)
  - Quick start guide
  - CLI contract documentation
  - Exit code semantics
  - Library API reference
  - Template examples
  - Troubleshooting guide

- **Templates**
  - `_template-ops.mjs` - For orchestrator scripts
  - `_template-check.mjs` - For validation scripts

---

## Guardrails Implemented

### ✅ 1. Layout Contract

- `_lib/` for pure helpers
- `ops/` for orchestrators
- `checks/` for validators
- `migration/` for one-offs
- `DEPRECATED/` for shims

### ✅ 2. One Job Per Tool

- `_lib` modules are small and focused
- `ops` scripts compose `_lib` functions
- No raw shell commands (use `execa`)

### ✅ 3. CLI Contract

All new scripts support:

- `--help` (show usage)
- `--dry-run` (default for ops)
- `--yes` (execute writes)
- `--output json|text`
- `--log-level` (trace|debug|info|warn|error)
- `--cwd` (working directory)

### ✅ 4. Idempotency

- Atomic writes via temp files
- Repeated runs converge or noop
- No timing dependencies

### ✅ 5. Sandbox Safety

- Writes only in repo root
- Network whitelist enforcement
- Path validation helpers

### ✅ 6. Exit Code Semantics

- 0: Success
- 2: Noop/convergence
- 3: Partial success (retryable)
- 10: Precondition failed
- 11: Validation failed
- 13: Unsafe environment

### ✅ 7. Observability

- Structured logging to STDERR
- JSON output to STDOUT
- Include `runId`, `script`, `version`, `durationMs`

### ✅ 8. Versioning

- Header with `@since`, `@version`
- Optional `@deprecated` with expiry date

### ✅ 9. No Secret Handling

- Read from env vars only
- Exit 13 if missing
- Never log secrets

### ✅ 10. Time Budgets

- Preflights <1 second
- Checks <60 seconds
- Ops <5 minutes

---

## File Statistics

| Category            | Files  | Lines of Code |
| ------------------- | ------ | ------------- |
| Libraries (`_lib/`) | 4      | 742           |
| Checks              | 2      | 418           |
| Ops (migrated)      | 1      | 237           |
| Templates           | 2      | 220           |
| Documentation       | 3      | 1,100+        |
| **Total**           | **12** | **~2,717**    |

---

## Next Steps (Phase 2)

### Immediate Priorities

1. **Extract `_lib/ideas.mjs`**
   - Parse idea files
   - Validate structure
   - Find and categorize ideas
   - Extract from: `validate-ideas.mjs`, `ideas-to-issues.mjs`

2. **Extract `_lib/markdown.mjs`**
   - Parse markdown sections
   - Extract metadata
   - Generate formatted markdown
   - Extract from: PR scripts, changelog scripts

3. **Migrate `setup-labels.mjs` → `ops/setup-labels.mjs`**
   - Simple orchestrator
   - Uses `_lib/github.mjs`
   - Good learning case

4. **Write Unit Tests**
   - `_lib/core.spec.mjs`
   - `_lib/git.spec.mjs`
   - `_lib/github.spec.mjs`
   - `_lib/validation.spec.mjs`

### This Week

- [ ] Create `_lib/ideas.mjs`
- [ ] Create `_lib/markdown.mjs`
- [ ] Migrate 3 high-priority scripts
- [ ] Write initial unit tests
- [ ] Update CI workflows

---

## How to Use

### Run Guardrails Check

```bash
pnpm scripts:guardrails
```

Currently runs:

1. ✅ Policy lint (validates script compliance)
2. ⚠️ Unit tests (will pass when tests are written)
3. ✅ Smoke tests (validates script execution)

### Test Individual Scripts

```bash
# Show help
node scripts/ops/bump-version.mjs --help

# Dry run
node scripts/ops/bump-version.mjs --dry-run

# Execute
node scripts/ops/bump-version.mjs --yes

# JSON output
node scripts/ops/bump-version.mjs --output json
```

### Create New Script

```bash
# Copy template
cp scripts/_template-ops.mjs scripts/ops/my-new-script.mjs

# Edit and customize
vim scripts/ops/my-new-script.mjs

# Make executable
chmod +x scripts/ops/my-new-script.mjs

# Test
node scripts/ops/my-new-script.mjs --help
```

---

## Migration Progress

### Status Overview

- **Total Scripts:** 27
- **Migrated:** 1 (3.7%)
- **In Progress:** 0
- **Remaining:** 26

### Categorization Complete

| Category      | Count | Scripts               |
| ------------- | ----- | --------------------- |
| **Ops**       | 15    | Most workflow scripts |
| **Checks**    | 4     | Validators            |
| **Hooks**     | 3     | Git hooks             |
| **Migration** | 3     | One-off scripts       |
| **Unknown**   | 2     | Needs review          |

See [MIGRATION-PLAN.md](./MIGRATION-PLAN.md) for full details.

---

## CI Integration (Next)

### Proposed Workflow

```yaml
name: Scripts Guardrails

on:
  pull_request:
    paths: ["scripts/**"]
  push:
    branches: [main]

jobs:
  guardrails:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm scripts:guardrails
```

### Enforcement

- ✅ Policy violations fail build
- ✅ Dangerous patterns fail build
- ⚠️ Size warnings (enforced after 30 days)
- ✅ Deprecated scripts >90 days fail

---

## Success Metrics

**Target:**

- Automation ratio: ≥3:1
- Rerun safety: ≥95% noop
- MTTR: <10 minutes
- Test coverage: ≥80%

**Current:**

- Foundation: ✅ Complete
- Test coverage: 0% (tests coming in Phase 2)
- Migrated scripts: 3.7% (1/27)

---

## Resources

- [Full Guardrails](../guides/SCRIPTS-REFERENCE.md) (if exists)
- [Migration Plan](./MIGRATION-PLAN.md)
- [Scripts README](./README.md)
- [Package.json](../package.json)

---

## Team Notes

### What Changed for Developers

**Before:**

```bash
node scripts/bump-version.mjs major
```

**Now:**

```bash
# Dry run (default)
node scripts/ops/bump-version.mjs major

# Execute
node scripts/ops/bump-version.mjs major --yes

# Old path still works via redirect shim (when created)
node scripts/bump-version.mjs major
```

### Breaking Changes

**None yet!** All old scripts still in place. Migration is additive.

### When Will Old Scripts Be Removed?

After redirect shims are created:

1. Deprecation date set
2. 90-day grace period
3. Auto-removal enforced by CI
4. Example: Script deprecated 2025-10-28 → removed 2026-01-26

---

## Questions & Feedback

- Open an issue with tag `scripts-alignment`
- Review the [Migration Plan](./MIGRATION-PLAN.md)
- Check the [README](./README.md) for examples

---

**Status:** ✅ Foundation Complete - Ready for Phase 2  
**Next Review:** 2025-11-04  
**Owner:** Scripts alignment initiative
