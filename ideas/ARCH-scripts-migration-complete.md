# ARCH-scripts-migration-complete

Lane: C (DevOps & Automation)  
Created: 2025-10-28

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, scripts, migration

## Purpose

Complete the scripts migration initiative by finishing all remaining tasks: unit testing for `_lib` modules, package.json updates, DEPRECATED shims, and CI integration.

This tracks the final 15% of the migration plan after achieving 100% policy compliance (all 73 lint errors resolved).

## Problem

The scripts migration has achieved major milestones:

- ✅ 23/27 scripts (85%) structurally migrated to `ops/`, `checks/` subdirectories
- ✅ All 73 policy lint errors resolved (100% CLI contract compliance)
- ✅ 7 `_lib` modules created with 62 exported functions (1,838 LOC)
- ✅ Smoke tests 77% passing (47/61), --help tests 100% passing

However, critical work remains incomplete:

- ❌ **Zero unit test coverage** for `_lib` modules (35-50 hours estimated)
- ❌ package.json still references old script paths
- ❌ No DEPRECATED shims for backward compatibility (90-day policy)
- ❌ CI workflows not updated to use new script locations
- ❌ Documentation gaps in guides/scripts reference

Without completing this work:

1. **Fragility risk**: No safety net if `_lib` functions break during refactoring
2. **User friction**: Old commands fail without redirect shims
3. **CI breakage**: Automated workflows reference non-existent paths
4. **Knowledge gap**: Team doesn't know new script structure

## Proposal

### Phase 1: Unit Test Coverage (Week 2 - Critical Priority)

Create comprehensive test suites for all `_lib` modules targeting 80% coverage minimum:

1. **core.mjs** (14 functions, 301 LOC) - 6-8 hours
   - Test: Logger class, parseFlags, atomicWrite, formatOutput, fail/succeed helpers
   - Mock: fs operations, process.exit calls
2. **validation.mjs** (6 functions, 223 LOC) - 5-7 hours
   - Test: validateScriptHeader, validateCLIContract, detectDangerousPatterns
   - Fixtures: Sample script files, allowlist.json

3. **ideas.mjs** (6 functions, 277 LOC) - 5-7 hours
   - Test: parseIdeaFile, validateIdeaFile, extractSubIssues, extractChecklistItems
   - Fixtures: Sample U-_.md, C-_.md, ARCH-\*.md files

4. **changelog.mjs** (13 functions, 401 LOC) - 8-12 hours
   - Test: parseSummaryFile, mergeVersionEntries, insertVersionEntry, deduplicateChangelog
   - Fixtures: Sample CHANGELOG.md, summary files

5. **templates.mjs** (7 functions, 301 LOC) - 4-6 hours
   - Test: listTemplates, validateTemplateRef, generateTemplateFiles
   - Mock: File system operations

6. **github.mjs** (9 functions, 210 LOC) - 4-6 hours
   - Test: getIssue, createPR, updateIssue, listIssues
   - Mock: execa calls to gh CLI

7. **git.mjs** (8 functions, 125 LOC) - 3-4 hours
   - Test: isGitClean, getCurrentBranch, createWorktree, listWorktrees
   - Mock: execa calls to git

**Testing Infrastructure:**

- Use vitest (already configured in vitest.config.ts)
- Create `scripts/_lib/*.spec.mjs` files alongside modules
- Set up fixtures in `scripts/_lib/__fixtures__/`
- Mock strategy: Mock file I/O and external commands (git, gh)

### Phase 2: Package.json & Backward Compatibility (Week 3)

1. **Update package.json scripts**
   - Change all references from `scripts/*.mjs` to `scripts/ops/*.mjs`, `scripts/checks/*.mjs`
   - Update CI-specific commands
   - Test all pnpm commands still work

2. **Create DEPRECATED shims**
   - For each moved script, create redirect shim in root with deprecation warning
   - Include 90-day expiry date (expires Jan 26, 2026)
   - Log warning on every execution pointing to new location

3. **Update CI workflows**
   - `.github/workflows/*.yml` - update all script paths
   - Test workflows in PR before merging

### Phase 3: Documentation & Team Onboarding (Week 4)

1. **Update documentation**
   - `docs/scripts-reference.md` - Full API reference for new structure
   - `guides/guide-scripts.md` - Updated workflow examples
   - `README.md` - Update quick start commands

2. **Team review**
   - Walkthrough session for new structure
   - Q&A for migration questions
   - Gather feedback on pain points

3. **Mark legacy complete**
   - Set 90-day timer for DEPRECATED removal (Jan 26, 2026)
   - Document rollback plan if needed
   - Declare migration complete

## Sub-Issues

- [ ] `U-lib-unit-tests` - Write unit tests for all 7 `_lib` modules (35-50 hours)
- [ ] `U-package-json-migration` - Update package.json commands and scripts section
- [ ] `U-deprecated-shims` - Create backward compatibility redirect shims
- [ ] `U-ci-workflow-migration` - Update GitHub Actions workflows
- [ ] `U-docs-migration-complete` - Finalize all documentation updates

## Acceptance Checklist

- [ ] All 7 `_lib` modules have test files with ≥80% coverage
- [ ] `pnpm scripts:test` runs all unit tests successfully
- [ ] All package.json commands reference new script paths
- [ ] DEPRECATED shims created for all moved scripts (expires 2026-01-26)
- [ ] CI workflows updated and tested in PR
- [ ] Documentation fully updated (scripts-reference, guide-scripts, README)
- [ ] Team walkthrough completed with feedback gathered
- [ ] Migration marked complete in `docs/scripts-migration-plan.md`
- [ ] 90-day deprecation timer started for legacy script removal

## Success Metrics

- **Test Coverage:** ≥80% for all `_lib` modules
- **Backward Compatibility:** 0 user-reported breakages from script moves
- **CI Stability:** All workflows green after migration
- **Team Velocity:** No slowdown in script usage/development
- **Documentation:** 100% of scripts documented with examples

## Notes

- Current status: 85% structural migration, 100% policy compliance, 0% test coverage
- Estimated total effort: 50-70 hours across 3 weeks
- Risk: Without tests, refactoring `_lib` functions is dangerous
- Follow-up: After 90 days (Jan 2026), remove DEPRECATED/ scripts permanently

## Links

- Migration Plan: `/docs/scripts-migration-plan.md`
- Guardrails: `/scripts/GUARDRAILS.md`
- Current Structure: `/scripts/README.md`
- Policy Lint: `/scripts/checks/policy-lint.mjs`
- Smoke Tests: `/scripts/checks/smoke.mjs`
