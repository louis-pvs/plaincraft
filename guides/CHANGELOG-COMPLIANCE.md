# Changelog Convention & Compliance Guide

This guide merges our changelog authoring conventions with the compliance
checks that keep automation trustworthy. Use it whenever you plan a release,
prepare `_tmp/` summaries, or audit the supporting scripts.

## Structure Expectations

- `CHANGELOG.md` lives at the repo root with the fixed heading:
  `# Changelog` followed by “All notable changes…”. Never duplicate or remove
  that intro.
- Every release block uses the exact format `## [<version>] - YYYY-MM-DD`.
- Inside a release block, organize information with `###` headings such as
  `Highlights`, `Tooling & Commands`, `Rollout Notes`, or other nouns that help
  downstream pairs scan quickly.
- Lead each entry with why the change exists and who owns it before listing
  implementation bullets.
- Keep bullets concise and action-oriented (“Add CI summary job” instead of
  “CI summary job added”).
- Reference scripts, commands, and ticket IDs in backticks so teams can search
  for them easily.
- Capture follow-ups or risks in a dedicated closing subsection to make
  handoffs explicit.
- When noting timings or metrics, specify the environment (local vs CI) and
  keep them grouped together.
- Maintain ~90 character line width and avoid trailing whitespace.

### Temporary Summaries (`/_tmp/*.md`)

- Draft release notes as individual Markdown files named with an ordering
  prefix: `001-title.md`, `010-hotfix.md`, etc.
- Start every file with a `# Title` line—this becomes the `###` section heading
  after consolidation.
- Place the section content beneath the title. Skip the release-level heading;
  the consolidator generates it.
- The consolidator deletes processed files, so treat `_tmp/` as disposable.

### Consolidation Workflow

1. Bump the version in `package.json` if the release requires it.
2. Save ordered summaries in `_tmp/`.
3. Run `node scripts/consolidate-changelog.mjs` (or rely on the pre-commit
   hook) to merge the summaries into `CHANGELOG.md`.
4. Review the resulting entry for heading order, spacing, and accuracy before
   committing.

### Commit & PR Requirements

- Every commit message must begin with the ticket ID in brackets: `[U-<slug>]`,
  `[C-<slug>]`, `[B-<slug>]`, `[ARCH-<slug>]`, `[PB-<slug>]`. The changelog and
  PR title should share that same tag.
- PRs must include `Closes #<issue-number>` and carry over the ticket’s
  acceptance checklist.
- Run the pre-push suite (`pnpm typecheck && pnpm lint && pnpm test && pnpm
storybook:test`) inside the integration window.
- Use `pnpm ci:check --watch` (requires installed + authenticated `gh`) to
  monitor workflow status once the branch is pushed.

### Quick Checklist Before Committing

- [ ] Version updated in `package.json` (if applicable).
- [ ] `_tmp/` summaries present and ordered.
- [ ] `node scripts/consolidate-changelog.mjs` (or the pre-commit hook) ran
      successfully.
- [ ] `CHANGELOG.md` entry includes context, highlights, tooling notes, and
      rollout steps.
- [ ] `pnpm lint` and `pnpm test` pass locally.
- [ ] All commits use the ticket-prefixed tag.
- [ ] PR title matches the changelog section tag.

## Script Compliance Review

### `scripts/consolidate-changelog.mjs`

#### ✅ Compliant Areas

1. **File Layout**
   - Preserves the `# Changelog` header and description.
   - Generates release headings as `## [<version>] - YYYY-MM-DD`.
   - Wraps each summary with `### <Title>`.
   - Inserts new releases before older ones.

2. **Version & Date**
   - Reads the version from `package.json`.
   - Uses the current date in ISO `YYYY-MM-DD` format.
   - Guarantees consistent heading syntax.

3. **Temporary Summaries**
   - Reads from `/_tmp`.
   - Sorts files alphabetically (supports numeric prefixes).
   - Extracts the first `# Title` and uses it as the section header.
   - Removes that title from the body before insertion.

4. **Automation**
   - Deletes processed `_tmp/*.md` files after success.
   - Prints clear console output for each step.
   - Handles missing directories gracefully.

#### ⚠️ Recommendations

1. **Preserve Formatting** — Already achieved via double newline between
   sections. Maintain this if editing the script.
2. **Error Handling** — Currently adequate; malformed files throw readable
   errors.
3. **Duplicate Release Detection** — Optional enhancement to warn when a
   release heading already exists.

### `scripts/generate-pr-content.mjs`

#### ✅ Compliant Areas

1. **Source Parsing**
   - Reads the latest changelog block.
   - Extracts all `### <Title>` sections.
   - Captures the commit tag from the first section title.

2. **PR Title Convention**
   - Copies the section tag verbatim (e.g. `[ARCH-ci]`).
   - Works with all lane tags defined in `protocol.md`.
   - Reinforces the ticket-ID prefix requirement.

3. **PR Body Generation**
   - Mirrors section content in the PR description.
   - Includes the integration checklist.
   - Mentions version metadata.

#### ⚠️ Recommendations

1. **Mixed Tags** — The script assumes a single tag per release. If sections
   diverge, reviewers should adjust the changelog before running the generator.

### `scripts/pre-commit-changelog.mjs`

#### ✅ Compliant Areas

1. **Automatic Consolidation**
   - Detects `_tmp/*.md` files.
   - Runs the consolidator when `CHANGELOG.md` is unstaged.
   - Stages the resulting changelog automatically.

2. **Integration**
   - Executes before `lint-staged` via `simple-git-hooks`.
   - Exits cleanly when no summaries are present.
   - Emits clear status messages.

#### ⚠️ Recommendations

1. **Commit Message Check** — Potential future enhancement to warn when staged
   commits lack the ticket prefix.

## Summary

- The tooling enforces ~95% of our conventions automatically.
- Remaining items (duplicate releases, mixed tags, malformed summaries) are
  caught during review.
- Optional future enhancements include duplicate release detection, tag
  validation, additional formatting lint, and a dry-run consolidator mode.

## Testing Checklist

Use this workflow to validate changes to changelog tooling:

```bash
# 1. Create ordered summaries
echo "# [ARCH-ci] First Feature" > _tmp/001-feature.md
echo "# [ARCH-ci] Second Feature" > _tmp/002-feature.md

# 2. Run consolidation
pnpm changelog

# 3. Inspect CHANGELOG.md
# - Contains '## [version] - YYYY-MM-DD'
# - Includes '### [ARCH-ci] First Feature'
# - Includes '### [ARCH-ci] Second Feature'
# - _tmp/ is empty

# 4. Generate PR content
pnpm pr:generate

# 5. Verify output
# - PR title mirrors the changelog tag
# - PR body includes both sections
```

All checks should pass ✅
