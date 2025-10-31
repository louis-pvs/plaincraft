# Usage: Bug Report Template

## Basic Usage

1. **Create bug report:**

   ```bash
   cp templates/bug-report/bug-report.md my-bug.md
   ```

2. **Fill in the sections:**
   - Provide clear, numbered reproduction steps
   - Include environment details (browser, OS, version)
   - Attach screenshots or error logs
   - Describe expected vs actual behavior

3. **Submit the issue:**
   ```bash
   gh issue create --title "Bug: [Description]" --body-file my-bug.md --label bug
   ```

## Template Variables

Replace these placeholders:

- `[Bug Description]` - Brief summary of the issue
- `[Reproduction Steps]` - Numbered steps to reproduce
- `[Expected Behavior]` - What should happen
- `[Actual Behavior]` - What actually happens
- `[Environment]` - Browser, OS, app version
- `[Screenshots]` - Visual evidence

## Examples

### UI Bug

```markdown
**Title:** Bug: Profile image not loading in Safari

**Description:**
Profile images fail to load on user profile page in Safari 17.

**Steps to Reproduce:**

1. Open app in Safari 17 on macOS
2. Navigate to any user profile page
3. Observe profile image area

**Expected Behavior:**
Profile image displays at top of page

**Actual Behavior:**
Broken image icon shown, console error: "Failed to load resource"

**Environment:**

- Browser: Safari 17.0
- OS: macOS 14.1
- App version: 2.3.0

**Screenshots:**
[Attach screenshot of broken image]
```

### Runtime Error

```markdown
**Title:** Bug: App crashes when deleting last item in list

**Description:**
Application crashes with TypeError when deleting the last item from a list.

**Steps to Reproduce:**

1. Create a new list with one item
2. Click delete button on the item
3. Observe error in console

**Expected Behavior:**
Item is deleted, empty state is shown

**Actual Behavior:**
TypeError: Cannot read property 'length' of undefined
App freezes and requires page refresh

**Environment:**

- Browser: Chrome 120
- OS: Windows 11
- App version: 2.3.0

**Console Output:**
```

TypeError: Cannot read property 'length' of undefined
at List.render (List.tsx:42)
at performWork (react-dom.js:1234)

```

**Impact:**
Critical - blocks all users from deleting last item
```

### Performance Bug

```markdown
**Title:** Bug: Dashboard takes 10+ seconds to load

**Description:**
Dashboard page is extremely slow to load with large datasets.

**Steps to Reproduce:**

1. Log in as user with 1000+ items
2. Navigate to dashboard
3. Time how long until page is interactive

**Expected Behavior:**
Page loads in < 2 seconds

**Actual Behavior:**
Page takes 10-15 seconds to load
Browser becomes unresponsive during load

**Environment:**

- Browser: Firefox 121
- OS: Ubuntu 22.04
- App version: 2.3.0
- Dataset size: 1200 items

**Performance Profile:**
[Attach Chrome DevTools performance profile]

**Impact:**
High - affects power users with large datasets
```

## Best Practices

### Reproduction Steps

- Number each step clearly
- Include all prerequisites (login state, data setup)
- Be specific about clicks, inputs, navigation
- Verify steps reproduce the bug consistently

### Environment Details

- Always include browser and version
- OS and version
- App version or commit hash
- Device type if mobile

### Evidence

- Screenshots for visual bugs
- Console logs for errors
- Network tab for API issues
- Performance profiles for slowness

### Impact Assessment

- Critical: Blocks major functionality, data loss
- High: Affects many users, has workaround
- Medium: Affects some users, minor impact
- Low: Edge case, cosmetic issue

## Integration with Scripts

```bash
# Validate bug report structure
node scripts/validate-ideas.mjs --file my-bug.md

# Create issue from bug report
gh issue create \
  --title "Bug: Description" \
  --body-file my-bug.md \
  --label bug,priority:high

# Link to worktree for fix (updates idea metadata automatically)
pnpm gh:worktree 123 --no-draft
```
