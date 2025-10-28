# U-package-json-migration

- **Lane**: C
- **Linked Composition**: `ARCH-scripts-migration-complete`
- **Contracts**: Update all package.json script commands to reference new script locations under `scripts/ops/` and `scripts/checks/` subdirectories.

## Lane

Lane: C

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, scripts, migration

## Purpose

Update package.json to align with the new scripts directory structure after migration, ensuring all pnpm commands reference correct paths.

## Problem

After the scripts migration to `ops/` and `checks/` subdirectories, package.json still contains 20+ script references pointing to old root-level paths:

**Current (Incorrect):**

```json
"ci:check": "node scripts/check-ci.mjs"
"ideas:validate": "node scripts/validate-ideas.mjs"
"new:snippet": "node scripts/new-snippet.mjs"
```

**Should be:**

```json
"ci:check": "node scripts/checks/check-ci.mjs"
"ideas:validate": "node scripts/checks/validate-ideas.mjs"
"new:snippet": "node scripts/ops/new-snippet.mjs"
```

Without this update:

1. **User friction**: `pnpm` commands fail with "file not found" errors
2. **CI breakage**: Automated builds reference non-existent scripts
3. **Incomplete migration**: Migration appears "done" but commands are broken

## Proposal

### Phase 1: Audit & Map (1 hour)

1. **Identify all script references in package.json**

   ```bash
   grep -E "\"node scripts/" package.json | wc -l
   ```

2. **Verify actual script locations**

   ```bash
   find scripts/ops scripts/checks -name "*.mjs" -type f
   ```

3. **Create mapping document**
   - Old path → New path
   - Mark any scripts not yet migrated

### Phase 2: Update package.json (2 hours)

1. **Update all script paths systematically**
   - ops/ scripts: create-worktree-pr, setup-project, new-snippet, consolidate-changelog, create-issues-from-changelog
   - checks/ scripts: check-ci, validate-ideas, pr-requirements, policy-lint, smoke

2. **Test each changed command**

   ```bash
   pnpm <command> --help  # Verify it loads
   ```

3. **Update scripts:test command if needed**
   ```bash
   "scripts:test": "vitest run --reporter=dot scripts/**/*.spec.mjs"
   ```

### Phase 3: Verification (1 hour)

1. **Run all pnpm commands in dry-run/help mode**

   ```bash
   pnpm ideas:validate --help
   pnpm changelog --help
   pnpm gh:worktree --help
   ```

2. **Test critical workflows**
   - Create test idea file and validate
   - Generate changelog (dry-run)
   - Verify CI check commands work

3. **Update CI workflows if they directly reference pnpm commands**

## Script Migration Map

| Old Path                                       | New Path                                | Status             |
| ---------------------------------------------- | --------------------------------------- | ------------------ |
| `scripts/check-ci.mjs`                         | `scripts/checks/check-ci.mjs`           | ✅ Migrated        |
| `scripts/validate-ideas.mjs`                   | `scripts/checks/validate-ideas.mjs`     | ✅ Migrated        |
| `scripts/pr-requirements.mjs`                  | `scripts/checks/pr-requirements.mjs`    | ✅ Migrated        |
| `scripts/ideas-to-issues.mjs`                  | `scripts/ops/ideas-to-issues.mjs`       | ✅ Migrated        |
| `scripts/create-worktree-pr.mjs`               | `scripts/ops/create-worktree-pr.mjs`    | ✅ Migrated        |
| `scripts/sync-ideas-checklists.mjs`            | `scripts/ops/sync-ideas-checklists.mjs` | ✅ Migrated        |
| `scripts/ops/consolidate-changelog.mjs`        | -                                       | ✅ Already correct |
| `scripts/ops/setup-project.mjs`                | -                                       | ✅ Already correct |
| `scripts/ops/create-issues-from-changelog.mjs` | -                                       | ✅ Already correct |
| `scripts/prepare-gh.mjs`                       | `scripts/ops/prepare-gh.mjs`            | ? Check            |
| `scripts/setup-labels.mjs`                     | `scripts/ops/setup-labels.mjs`          | ? Check            |
| `scripts/post-checkout.mjs`                    | `scripts/checks/post-checkout.mjs`      | ? Check            |
| `scripts/generate-pr-content.mjs`              | `scripts/ops/generate-pr-content.mjs`   | ? Check            |
| `scripts/new-snippet.mjs`                      | `scripts/ops/new-snippet.mjs`           | ? Check            |
| `scripts/auto-tag.mjs`                         | `scripts/ops/auto-tag.mjs`              | ? Check            |
| `scripts/record-stories.mjs`                   | `scripts/ops/record-stories.mjs`        | ? Check            |
| `scripts/test-storybook.mjs`                   | `scripts/checks/test-storybook.mjs`     | ? Check            |

## Acceptance Checklist

- [ ] All script paths in package.json audited and mapped to new locations
- [ ] All `ops/` script references updated in package.json
- [ ] All `checks/` script references updated in package.json
- [ ] Every pnpm command tested with `--help` or `--dry-run`
- [ ] CI-critical commands verified (`test`, `lint`, `format`, `typecheck`)
- [ ] Documentation updated if any command names changed
- [ ] No file-not-found errors when running pnpm commands
- [ ] CI workflows still pass after update

## Notes

- Estimated effort: 4 hours
- Risk: Low - can quickly rollback package.json changes if issues found
- Blocker: None - all scripts already migrated structurally
- Follow-up: Create DEPRECATED shims (U-deprecated-shims) after this

## Links

- Parent: `/ideas/ARCH-scripts-migration-complete.md`
- Scripts README: `/scripts/README.md`
- Package.json: `/package.json`
