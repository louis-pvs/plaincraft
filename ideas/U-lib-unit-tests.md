# U-lib-unit-tests

- **Lane**: C
- **Linked Composition**: `ARCH-scripts-migration-complete`
- **Contracts**: Ensure all `_lib` modules have comprehensive unit test coverage (≥80%) to prevent regressions during refactoring.

## Lane

Lane: C

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** testing, scripts, automation

## Contracts

Deliver comprehensive unit test suites for all 7 `_lib` modules (`core.mjs`, `validation.mjs`, `ideas.mjs`, `changelog.mjs`, `templates.mjs`, `github.mjs`, `git.mjs`) targeting ≥80% code coverage.

The tests must:

- Mock all I/O operations (fs, execa) to avoid side effects
- Cover both success and failure paths
- Test edge cases (empty inputs, malformed data, missing files)
- Be isolated and independent (no shared state)
- Run in CI on every PR

## Props + Shape

This unit delivers test suites for 7 modules:

- `scripts/_lib/core.spec.mjs` - Tests for Logger, parseFlags, atomicWrite, formatOutput, etc.
- `scripts/_lib/validation.spec.mjs` - Tests for script validation and policy checks
- `scripts/_lib/ideas.spec.mjs` - Tests for idea file parsing and validation
- `scripts/_lib/changelog.spec.mjs` - Tests for changelog manipulation
- `scripts/_lib/templates.spec.mjs` - Tests for template operations
- `scripts/_lib/github.spec.mjs` - Tests for GitHub API wrappers
- `scripts/_lib/git.spec.mjs` - Tests for git operations

**Test Infrastructure:**

- Framework: vitest (already configured)
- Mocking: Mock fs operations, execa calls to git/gh CLI
- Fixtures: Create `scripts/_lib/__fixtures__/` with sample files
- Coverage: Track with vitest --coverage flag

## Behaviors

### Test Creation Sequence (Priority Order)

1. **core.mjs** (14 functions, 301 LOC) - 6-8 hours
   - `Logger` class: Test all 5 log levels (trace/debug/info/warn/error)
   - `parseFlags()`: Test CLI argument parsing with various formats
   - `atomicWrite()`: Test atomic file writing with tmp file creation
   - `formatOutput()`: Test JSON vs text mode output
   - `fail()`/`succeed()`: Test exit code handling and output formats
   - `validateEnvironment()`: Test requirement checking (git, gh, node version)
   - `readJSON()`/`writeJSON()`: Test JSON file I/O with error handling
   - Mock: fs.promises, process.exit

2. **validation.mjs** (6 functions, 223 LOC) - 5-7 hours
   - `validateScriptHeader()`: Test @since, @version detection and errors
   - `validateCLIContract()`: Test --help, --dry-run, --yes flag detection
   - `detectDangerousPatterns()`: Test rm -rf, eval(), sudo detection
   - `checkSizeCompliance()`: Test LOC limits and function size checks
   - `loadAllowlist()`/`isUrlAllowed()`: Test domain whitelist checking
   - Fixtures: Sample script files with valid/invalid headers

3. **ideas.mjs** (6 functions, 277 LOC) - 5-7 hours
   - `getIdeaType()`: Test U-/C-/ARCH-/PB- prefix detection
   - `parseIdeaFile()`: Test section extraction (Lane, Purpose, Checklist)
   - `validateIdeaFile()`: Test required section enforcement per type
   - `findIdeaFiles()`: Test recursive file discovery with filters
   - `extractSubIssues()`: Test sub-issue markdown parsing
   - `extractChecklistItems()`: Test checkbox parsing and status
   - Fixtures: Sample U-test.md, C-test.md, ARCH-test.md files

4. **changelog.mjs** (13 functions, 401 LOC) - 8-12 hours
   - `parseSummaryFile()`: Test markdown summary parsing
   - `generateVersionEntry()`: Test version section generation
   - `deduplicateChangelog()`: Test duplicate entry removal
   - `mergeVersionEntries()`: Test version merge logic
   - `insertVersionEntry()`: Test chronological insertion
   - `parseChangelogContent()`: Test full changelog parsing
   - `filterChangelogByVersion()`: Test version filtering
   - `extractSections()`: Test section extraction by lane
   - Fixtures: Sample CHANGELOG.md, summary-\*.md files

5. **templates.mjs** (7 functions, 301 LOC) - 4-6 hours
   - `countTemplates()`: Test template directory counting
   - `countGuides()`: Test guide-\*.md counting
   - `checkRatio()`: Test template:guide ratio validation
   - `listTemplates()`: Test template enumeration with metadata
   - `validateTemplateRef()`: Test template reference validation
   - `generateTemplateFiles()`: Test file generation from templates
   - `generateGuideContent()`: Test guide markdown generation
   - Mock: fs operations, readdir calls

6. **github.mjs** (9 functions, 210 LOC) - 4-6 hours
   - `isGhAuthenticated()`: Test gh auth status check
   - `getIssue()`/`getPR()`: Test issue/PR fetching with JSON parsing
   - `createIssue()`/`createPR()`: Test creation with proper arguments
   - `updateIssue()`/`updatePR()`: Test updates and field merging
   - `listIssues()`: Test filtering and pagination
   - `createLabel()`: Test label creation with color/description
   - Mock: All execa("gh", ...) calls with sample JSON responses

7. **git.mjs** (8 functions, 125 LOC) - 3-4 hours
   - `isGitClean()`: Test working directory status detection
   - `getCurrentBranch()`: Test branch name extraction
   - `branchExists()`: Test branch existence checking
   - `getRecentCommits()`: Test commit log parsing
   - `createWorktree()`/`removeWorktree()`: Test worktree operations
   - `listWorktrees()`: Test worktree enumeration
   - `execCommand()`: Test command execution wrapper
   - Mock: All execa("git", ...) calls

### Testing Best Practices

- **Isolation**: Each test should be independent, no shared state
- **Mocking**: Mock all I/O (fs, execa) to avoid side effects
- **Fixtures**: Use consistent test data, commit to `__fixtures__/`
- **Error cases**: Test both success and failure paths
- **Edge cases**: Empty files, missing sections, malformed JSON
- **Coverage**: Aim for ≥80% line coverage, 100% for critical paths

### Running Tests

```bash
# Run all tests
pnpm scripts:test

# Run specific module tests
pnpm vitest scripts/_lib/core.spec.mjs

# Watch mode during development
pnpm vitest --watch scripts/_lib/

# Coverage report
pnpm vitest --coverage scripts/_lib/
```

## Accessibility

N/A - Backend testing only, no UI components.

## Acceptance Checklist

- [ ] `scripts/_lib/core.spec.mjs` created with ≥80% coverage (Logger, parseFlags, atomicWrite, formatOutput)
- [ ] `scripts/_lib/validation.spec.mjs` created with ≥80% coverage (validateScriptHeader, validateCLIContract, detectDangerousPatterns)
- [ ] `scripts/_lib/ideas.spec.mjs` created with ≥80% coverage (parseIdeaFile, validateIdeaFile, extractSubIssues)
- [ ] `scripts/_lib/changelog.spec.mjs` created with ≥80% coverage (parseSummaryFile, mergeVersionEntries, insertVersionEntry)
- [ ] `scripts/_lib/templates.spec.mjs` created with ≥80% coverage (listTemplates, validateTemplateRef, generateTemplateFiles)
- [ ] `scripts/_lib/github.spec.mjs` created with ≥80% coverage (getIssue, createPR, updateIssue)
- [ ] `scripts/_lib/git.spec.mjs` created with ≥80% coverage (isGitClean, getCurrentBranch, createWorktree)
- [ ] Fixtures directory `scripts/_lib/__fixtures__/` created with test data
- [ ] All tests pass with `pnpm scripts:test` (exit code 0)
- [ ] Coverage report shows ≥80% for all modules
- [ ] CI integration: Tests run on every PR via GitHub Actions
- [ ] Documentation: Add testing section to `scripts/README.md`

## Notes

- **Total Effort:** 35-50 hours (5-7 focused days)
- **Priority:** Critical - No safety net currently for `_lib` refactoring
- **Risk Mitigation:** Start with core.mjs (most reused) to catch issues early
- **Tooling:** vitest already configured in `vitest.config.ts`
- **Mock Strategy:** Use vitest.mock() for fs and execa modules
- **Current Status:** 0% test coverage, 1,838 LOC untested across 62 functions
