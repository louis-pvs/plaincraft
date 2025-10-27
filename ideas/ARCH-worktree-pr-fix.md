# ARCH-worktree-pr-fix

- **Lane**: C
- **Type**: Bug
- **Purpose**: Fix worktree script PR creation failures when branches have no commits
  Issue: #20

## Problem

The `create-worktree-pr.mjs` script fails when creating PRs for new branches with no commits, causing confusing errors even though the worktree and branch were created successfully.

**Error encountered:**

```
GraphQL: No commits between main and feat/arch-ideas-pipeline
```

## Root Causes

1. **No commit detection**: Script attempts to create PR without checking if commits exist on the branch
2. **Escaping issues**: PR body uses inline string with quote escaping that breaks with multiline content
3. **Misleading error**: Script exits with error even though worktree/branch creation succeeded

## Solution

### 1. Add Commit Detection

Add `hasCommitsForPR()` function that checks commit count using `git rev-list --count` before attempting PR creation.

### 2. Use File-Based PR Body

Replace inline escaping with temp file approach:

- Write PR body to `/tmp/pr-body-{timestamp}.md`
- Use `--body-file` flag instead of inline `--body`
- Avoids all quote/newline escaping issues

### 3. Graceful Skip with Instructions

When no commits exist:

- Skip PR creation without throwing error
- Show success message for worktree/branch creation
- Provide clear next steps: `gh pr create --fill --draft`

## Benefits

- ✅ No confusing errors when branch has no commits
- ✅ Reliable PR body handling for complex markdown
- ✅ Clear user guidance for next steps
- ✅ Script completes successfully for valid workflow
- ✅ Better UX for common development pattern

## Implementation

```javascript
// New function to check commits
async function hasCommitsForPR(branchName, baseBranch = "main") {
  const { stdout } = await execAsync(
    `git rev-list --count ${baseBranch}..${branchName}`,
  );
  return parseInt(stdout.trim(), 10) > 0;
}

// Updated PR creation with file-based body
async function createPR(issueNumber, branchName, worktreePath, isDraft = true) {
  const bodyFile = `/tmp/pr-body-${Date.now()}.md`;
  await writeFile(bodyFile, prBody);

  const cmd = `gh pr create --title "${issue.title}" --body-file "${bodyFile}" ...`;
  // ...
}

// Graceful handling in main
const hasCommits = await hasCommitsForPR(branchName, baseBranch);
if (!hasCommits) {
  console.log("⚠️  No commits on branch yet. Skipping PR creation.");
  // Show helpful instructions
  return;
}
```

## Acceptance Checklist

- [x] `hasCommitsForPR()` function added
- [x] PR body uses `--body-file` with temp file
- [x] Graceful skip when no commits exist
- [x] Clear instructions provided to user
- [x] Added `writeFile` import from `node:fs/promises`
- [x] Linting passes
- [ ] Tested with branch containing commits
- [ ] Documentation updated if needed

## Files Changed

- `scripts/create-worktree-pr.mjs`

## Rollout Notes

This is a bug fix that improves UX. No breaking changes - the script still creates worktrees/branches successfully and now handles the no-commit case gracefully.

Common workflow that now works better:

1. Run `pnpm gh:worktree <issue-number>`
2. Script creates worktree and branch (no error!)
3. Make changes and commit in worktree
4. Run `gh pr create --fill --draft` when ready
