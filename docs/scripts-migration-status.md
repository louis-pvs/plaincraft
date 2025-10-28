# Script Migration Status

## Completed Migrations (19/27 = 70%)

### Core Libraries Created

- ✅ `_lib/core.mjs` - Core utilities (Logger, parseFlags, repoRoot, atomicWrite, etc.)
- ✅ `_lib/git.mjs` - Git operations (worktrees, commits, branches)
- ✅ `_lib/github.mjs` - GitHub API wrappers (issues, PRs, labels)
- ✅ `_lib/validation.mjs` - Script policy validation
- ✅ `_lib/ideas.mjs` - Idea file parsing and validation

### Migrated Scripts

#### ops/ (13)

1. ✅ `setup-labels.mjs` - Create/update repository lane labels
   - Status: Complete
   - Original: `DEPRECATED/setup-labels.mjs`
   - Features: Full CLI contract, dry-run, JSON output

2. ✅ `bump-version.mjs` - Bump package.json version
   - Status: Complete (migrated earlier)
   - Features: Auto-detect from commits, force type, GitHub Actions output

3. ✅ `create-worktree-pr.mjs` - Create worktree + branch + PR from issue
   - Status: Complete
   - Original: `DEPRECATED/create-worktree-pr.mjs`
   - Features: Parent-child issues, bootstrap commits, post-checkout setup

4. ✅ `ideas-to-issues.mjs` - Convert idea files to GitHub Issues
   - Status: Complete
   - Original: `DEPRECATED/ideas-to-issues.mjs`
   - Features: Sub-issues, task lists, skip existing

5. ✅ `sync-ideas-checklists.mjs` - Sync acceptance checklists to issues
   - Status: Complete
   - Original: `DEPRECATED/sync-ideas-checklists.mjs`
   - Features: Force update, skip if unchanged, filter support

6. ✅ `archive-idea-for-issue.mjs` - Archive ideas when issues close
   - Status: Complete
   - Original: `DEPRECATED/archive-idea-for-issue.mjs`
   - Features: Safety checks, auto-commit, GitHub Actions mode

7. ✅ `cleanup-ideas.mjs` - Clean up orphaned idea files
   - Status: Complete
   - Original: `DEPRECATED/cleanup-ideas.mjs`
   - Features: Batch archive, filter by issue, preview mode

8. ✅ `post-checkout.mjs` - Git post-checkout hook
   - Status: Complete
   - Original: `DEPRECATED/post-checkout.mjs`
   - Features: Install deps, set git config, publish branch, skip flags

9. ✅ `sync-issue-to-card.mjs` - Sync issue content to idea files
   - Status: Complete
   - Original: `DEPRECATED/sync-issue-to-card.mjs`
   - Features: Bidirectional sync, section updates, smart file discovery

10. ✅ `manual-update-pr-checkboxes.mjs` - Update PR checkboxes
    - Status: Complete
    - Original: `DEPRECATED/manual-update-pr-checkboxes.mjs`
    - Features: Acceptance/related checkboxes, preview mode

11. ✅ `merge-subissue-to-parent.mjs` - Merge sub-issue to parent branch
    - Status: Complete
    - Original: `DEPRECATED/merge-subissue-to-parent.mjs`
    - Features: Worktree detection, auto-merge, conflict handling

12. ✅ `generate-pr-content.mjs` - Generate PR title/body from changelog or idea
    - Status: Complete
    - Original: `DEPRECATED/generate-pr-content.mjs`
    - Features: Multiple sources, template integration, GitHub Actions output

13. ✅ `commit-msg-hook.mjs` - Git commit message validation hook
    - Status: Complete
    - Original: `DEPRECATED/commit-msg-hook.mjs`
    - Features: Ticket prefix validation, helpful error messages

14. ✅ `new-snippet.mjs` - Create new snippet from template
    - Status: Complete
    - Original: `DEPRECATED/new-snippet.mjs`
    - Features: PascalCase validation, template replacement

15. ✅ `auto-tag.mjs` - Auto-tag releases from version changes
    - Status: Complete
    - Original: `DEPRECATED/auto-tag.mjs`
    - Features: CHANGELOG extraction, GitHub releases, push tags

#### checks/ (6)

1. ✅ `validate-ideas.mjs` - Validate idea file structure
   - Status: Complete
   - Original: `DEPRECATED/validate-ideas.mjs`
   - Features: Strict mode, filter, type validation

2. ✅ `check-ci.mjs` - Monitor GitHub Actions workflow status
   - Status: Complete
   - Original: `DEPRECATED/check-ci.mjs`
   - Features: Watch mode, formatted reports, JSON output

3. ✅ `pr-requirements.mjs` - PR requirements automation
   - Status: Complete
   - Original: `DEPRECATED/pr-requirements.mjs`
   - Features: Create issues, verify PRs, apply labels, lane detection

4. ✅ `prepare-gh.mjs` - GitHub CLI environment check
   - Status: Complete
   - Original: `DEPRECATED/prepare-gh.mjs`
   - Features: Installation/auth checks, repo access verification

5. ✅ `policy-lint.mjs` - Enforce script guardrails (created earlier)
6. ✅ `smoke.mjs` - Smoke test all scripts (created earlier)
7. ✅ `lint-guides.mjs` - Validate guides (created earlier)
8. ✅ `dedupe-guides.mjs` - Detect duplicate guides (created earlier)

## In Progress (0)

None currently

## Remaining Scripts (8)

### Lower Priority

- [ ] `consolidate-changelog.mjs` - Consolidate changelog entries
- [ ] `create-issues-from-changelog.mjs` - Create issues from changelog
- [ ] `pre-commit-changelog.mjs` - Pre-commit changelog validation
- [ ] `generate-gh-pages-index.mjs` - Generate GitHub Pages index
- [ ] `record-stories.mjs` - Record Storybook stories
- [ ] `setup-project.mjs` - Project setup automation
- [ ] `test-storybook.mjs` - Test Storybook components
- [ ] `bump-version.mjs` - Already in root (may be duplicate - verify)

### Templates (not migrated)

- `_template-check.mjs` - Template for check scripts
- `_template-ops.mjs` - Template for ops scripts

## Migration Statistics

**Total Scripts**: 27
**Migrated**: 19 (70%)
**Remaining**: 8 (30%)

**By Category**:

- Core Libraries: 5/5 (100%)
- Operations: 15/15 (100%)
- Checks: 4/4 in use + 4 enforcement tools (100%)
- Lower Priority: 0/8 (0%)

## Next Steps

1. ✅ Complete high-priority scripts (done)
2. ✅ Complete medium-priority scripts (done)
3. ⏳ Complete lower-priority scripts (8 remaining)
4. ⏳ Verify bump-version.mjs (may be duplicate)
5. ⏳ Install dependencies (execa, zod) - DONE
6. ⏳ Run smoke tests
7. ⏳ Update package.json commands
8. ⏳ Document new structure

- [ ] `generate-gh-pages-index.mjs` - Generate GitHub Pages index
- [ ] `prepare-gh.mjs` - Prepare GitHub environment
- [ ] `new-snippet.mjs` - Create new snippet from template
- [ ] `record-stories.mjs` - Record Storybook stories
- [ ] `setup-project.mjs` - Project setup automation
- [ ] `test-storybook.mjs` - Test Storybook components

## Migration Checklist

For each script migration:

- [ ] Extract reusable functions to `_lib/` if needed
- [ ] Add complete CLI contract (--help, --dry-run, --output, --log-level, --cwd)
- [ ] Add Zod schema validation
- [ ] Add header with @since, @version
- [ ] Support structured output (JSON)
- [ ] Use proper exit codes (0, 2, 10, 11, 13)
- [ ] Use Logger for all output
- [ ] Use atomicWrite for file operations
- [ ] Add to package.json scripts
- [ ] Move original to DEPRECATED/
- [ ] Test --help and --dry-run modes

## Statistics

- **Total Scripts**: 27
- **Migrated**: 11 (41%)
- **Remaining**: 16 (59%)
- **Libraries Created**: 5
- **Enforcement Tools**: 4 (policy-lint, smoke, lint-guides, dedupe-guides)

## Notes

All migrated scripts follow the guardrails:

- Template-first approach
- Small composable tools
- Rerunnable and idempotent
- Testable and callable by CI
- No secrets in code
- Safe by default (dry-run, atomic operations)
