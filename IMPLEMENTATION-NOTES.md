# ARCH-ideas-changelog-sync Implementation Notes

## Current Status

Issue #31 worktree created, ready for implementation.

## Required Changes

### 1. Update consolidate-changelog.mjs

- Add `findIdeaFileForClosedPR()` - locate idea file from PR/Issue
- Add `generateChangelogFromIdea()` - extract Purpose, Problem, Changes from idea
- Update main flow to try idea files before falling back to \_tmp/
- Maintain backward compatibility with existing \_tmp/ workflow

### 2. Deprecate \_tmp/ Folder

- Remove `_tmp/` from .gitignore
- Add migration warning when \_tmp/ files detected
- Update docs to mark as legacy

### 3. Update Pre-commit Hook

- Modify `scripts/pre-commit-changelog.mjs` to check for idea file
- Skip \_tmp/ requirement if corresponding idea file exists
- Show message: "Changelog will be generated from idea file"

### 4. Testing

- Test with PRs that have idea files
- Test backward compatibility with legacy \_tmp/ files
- Verify formatting matches historical entries

## Implementation Complexity

This is a substantial refactoring (~200-300 lines of new code) that requires:

- Careful testing to avoid breaking existing workflows
- Documentation updates across multiple files
- Pre-commit hook modifications

## Next Steps

1. Implement helper functions for idea file discovery
2. Update consolidate-changelog main logic
3. Update pre-commit hook
4. Remove \_tmp/ from .gitignore
5. Test thoroughly
6. Update documentation
