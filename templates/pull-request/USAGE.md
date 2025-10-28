# Usage: Pull Request Template

## Basic Usage

1. **Copy the template:**

   ```bash
   cp templates/pull-request/pull-request.md pr-body.md
   ```

2. **Fill in the sections:**
   - Replace `[Issue Title]` with descriptive title matching the issue
   - Complete **Context** with why these changes are needed
   - List all **Changes Made** with file paths
   - Document **Testing** steps for reviewers
   - Check off **Verification** items as completed

3. **Create the PR:**
   ```bash
   gh pr create --title "Your Title" --body-file pr-body.md
   ```

## Template Variables

Replace these placeholders:

- `[Issue Title]` - Match the related issue title
- `[Issue Number]` - Reference issue being closed
- `[Context]` - Why these changes are needed
- `[Changes Made]` - Bullet list of files/components changed
- `[Testing Steps]` - How reviewers can verify changes
- `[Verification Checklist]` - Pre-merge checks

## Examples

### Feature PR

```markdown
**Title:** Implement dark mode toggle

**Context:**
Closes #123. Users requested ability to switch between light/dark themes for better accessibility and preference support.

**Changes Made:**

- Added ThemeContext provider (`src/context/ThemeContext.tsx`)
- Updated Button component with theme variants (`src/components/Button.tsx`)
- Added theme toggle to Settings page (`src/pages/Settings.tsx`)
- Persisted preference to localStorage (`src/utils/storage.ts`)

**Testing:**

1. Navigate to Settings page
2. Click theme toggle button
3. Verify all components update colors
4. Refresh page and verify theme persists

**Verification:**

- [x] Tests passing (100% coverage maintained)
- [x] No console errors
- [x] Docs updated (`docs/theming.md`)
- [x] Accessibility: ARIA labels added
- [x] Performance: No layout shifts detected
```

### Bug Fix PR

```markdown
**Title:** Fix duplicate API calls on profile load

**Context:**
Fixes #456. Profile component was calling API twice on mount due to missing dependency array in useEffect, causing performance issues and duplicate data processing.

**Changes Made:**

- Fixed useEffect dependency array (`src/components/Profile.tsx:45`)
- Added unit test for single API call (`src/components/Profile.spec.tsx`)

**Testing:**

1. Open Profile page
2. Open browser DevTools Network tab
3. Verify only 1 API request to `/api/profile`
4. Run `npm test Profile.spec.tsx`

**Verification:**

- [x] Tests passing (new test added)
- [x] No console errors
- [x] Network tab shows single request
- [x] No regression in profile loading time
```

## Integration with Scripts

```bash
# Auto-generate PR body from issue
node scripts/generate-pr-content.mjs --issue 123

# Create issue + worktree + PR draft atomically
node scripts/create-worktree-pr.mjs \
  --template issue-unit \
  --title "Fix login bug" \
  --create-pr

# Update PR checklist after sub-issue merge
node scripts/manual-update-pr-checkboxes.mjs --pr 456
```

## Auto-Generated Sections

When using `generate-pr-content.mjs`, the following are auto-populated:

- Issue reference and closure statement
- Changed files list from git diff
- Commit history summary
- Linked related PRs and issues

## Reviewer Guidelines

Include in PR body when coordination needed:

- **Requires:** [Specific reviewer expertise needed]
- **Focus Areas:** [Parts needing extra scrutiny]
- **Known Issues:** [Intentional gaps to address later]
