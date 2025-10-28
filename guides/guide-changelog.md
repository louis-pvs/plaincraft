---
id: guide-changelog
owner: @louis-pvs
lane: D
artifact_id: ARCH-changelog-workflow
scaffold_ref: /templates/ideas@v0.1
version: 0.1.0
created: 2025-10-28
ttl_days: 90
last_verified: 2025-10-28
---

# When to use

- Preparing a release and need to consolidate temporary changelog entries
- Writing commit messages that comply with ticket-based automation
- Reviewing changelog structure before merging to main

# When not to use

- Ad-hoc commit messages without corresponding tickets
- Drafting documentation unrelated to releases
- Creating issues or PRs (use respective guides)

# Steps (all executable)

1. **Create temporary changelog entries:**

   ```bash
   # Draft release notes in _tmp/ with ordering prefix
   echo "# Feature Title\n\n- Implementation detail" > _tmp/001-feature.md
   ```

2. **Consolidate into CHANGELOG.md:**

   ```bash
   pnpm run changelog:consolidate
   # Or rely on pre-commit hook
   ```

3. **Validate structure:**

   ```bash
   # Check commit message format
   node scripts/commit-msg-hook.mjs "[U-slug] Add feature"
   ```

4. **Commit with proper ticket prefix:**
   ```bash
   git commit -m "[ARCH-changelog-workflow] Consolidate release notes"
   ```

# Rollback

- Revert consolidated commits: `git revert <sha>`
- Restore \_tmp/ files from git history if accidentally deleted

# Requirements

- Commit messages must start with ticket ID: `[U-*]`, `[C-*]`, `[B-*]`, `[ARCH-*]`, `[PB-*]`
- CHANGELOG.md uses format: `## [<version>] - YYYY-MM-DD`
- Temporary files in `_tmp/*.md` with title as first `#` heading
- Each release block organizes with `###` headings: Highlights, Tooling, Rollout Notes

# Links

- Script: `/scripts/ops/consolidate-changelog.mjs`
- Hook: `/scripts/commit-msg-hook.mjs`
- Template: `/templates/ideas/` (for ticket structure)
- Pre-commit: `/scripts/pre-commit-changelog.mjs`
