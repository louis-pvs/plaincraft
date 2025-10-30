# Usage: Issue (Unit) Template

## Basic Usage

1. **Copy the template:**

   ```bash
   cp templates/issue-unit/issue-unit.md my-issue.md
   ```

2. **Fill in the sections:**
   - Replace `[Issue Title]` with a clear, action-oriented title
   - Complete the **Problem** section with context and impact
   - Specify **Acceptance Criteria** as testable conditions
   - Add **References** to related issues/PRs/docs

3. **Create the issue:**
   ```bash
   gh issue create --title "Your Title" --body-file my-issue.md
   ```

## Template Variables

Replace these placeholders:

- `[Issue Title]` - Clear description starting with verb (e.g., "Fix login redirect bug")
- `[Component/Area]` - Affected component or file path
- `[Current Behavior]` - What happens now (for bugs)
- `[Expected Behavior]` - What should happen
- `[Acceptance Criteria]` - Bullet list of completion conditions

## Examples

### Bug Fix

```markdown
**Title:** Fix duplicate API calls on profile load

**Problem:**
Component: `src/components/Profile.tsx`
The profile component triggers 2 identical API calls when mounted, causing performance issues and duplicate data processing.

**Acceptance Criteria:**

- [ ] Profile API called exactly once on mount
- [ ] No performance regression in tests
- [ ] Browser network tab shows single request
```

### Small Feature

```markdown
**Title:** Add tooltip to save button

**Problem:**
Component: `src/components/EditorToolbar.tsx`
Users are unclear when the save button is disabled vs. enabled. Need visual feedback.

**Acceptance Criteria:**

- [ ] Tooltip shows "Saved" when no changes
- [ ] Tooltip shows "Save changes" when dirty
- [ ] Accessible via keyboard (aria-label)
```

## Integration with Scripts

```bash
# Create issue and worktree branch in one command
# (idea frontmatter gets Issue:# and status: in-progress before the bootstrap commit)
node scripts/create-worktree-pr.mjs \
  --template issue-unit \
  --title "Fix login redirect bug"

# Validate issue body before submitting
node scripts/validate-ideas.mjs --file my-issue.md
```

## Checklist Sync

Issues created with this template will sync to GitHub Project cards via `scripts/sync-issue-to-card.mjs`.
