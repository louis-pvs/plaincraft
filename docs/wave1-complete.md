# Wave 1 Implementation Complete ✅

Wave 1 of the project status integration is now complete. All automation infrastructure is in place.

## What Was Implemented

### 1. Token Scope Verification ✅

- Added `verifyGhTokenScopes()` function to `github.mjs`
- Checks for required `read:project` and `project` scopes
- Returns actionable remediation message if scopes missing

### 2. Non-Interactive GH Wrapper ✅

- Added `ghCommand()` helper to prevent CLI hangs
- Ensures all gh commands use `--json` or other non-interactive flags
- Available for refactoring existing scripts

### 3. Project Status Updates Wired ✅

- **create-branch.mjs**: Now calls `ensureProjectStatus("Branched")` after branch creation
  - Replaces exit code 10 "not yet implemented" error
  - Logs status transitions or warnings
- **open-or-update-pr.mjs**: Now calls `ensureProjectStatus("PR Open")` after PR creation
  - Already had the infrastructure, added token verification
  - Provides clear feedback on status update success/failure

### 4. Helper Scripts Created ✅

- **update-project-status-field.mjs**: Shows manual steps to update Status field options
- **refresh-project-cache.mjs**: Fetches latest project metadata and updates cache

## Manual Steps Required

The GitHub Projects v2 API does not support programmatic field option updates. You must manually update the Status field via the web UI:

### Step 1: Update Status Field Options

```bash
# Run this to see the project URL and instructions
node scripts/ops/update-project-status-field.mjs
```

1. Open: https://github.com/users/louis-pvs/projects/1/settings
2. Click on the "Status" field
3. Remove old options: "Todo", "In Progress", "Done"
4. Add new options in this order:
   - **Ticketed** - Issue created and ready for branch (Gray)
   - **Branched** - Work branch created (Yellow)
   - **PR Open** - Pull request opened (Blue)
   - **In Review** - Under active review (Purple)
   - **Merged** - PR merged to main (Green)
   - **Archived** - Completed and archived (Gray)

### Step 2: Refresh Project Cache

After updating the Status field options in the web UI, run:

```bash
node scripts/ops/refresh-project-cache.mjs
```

This will:

- Fetch the latest project metadata including new Status options
- Update `.repo/projects.json` with option IDs
- Verify all fields are cached correctly

### Step 3: Test Status Transitions

```bash
# Test creating a branch (should update to "Branched")
pnpm ops:create-branch -- --id C-148 --slug test-wave1 --yes --dry-run=false

# Test creating a PR (should update to "PR Open")
# (push branch first, then run)
pnpm ops:open-or-update-pr -- --id C-148 --yes --dry-run=false
```

## Expected Output

After completing the manual steps, you should see:

```
[INFO] Project status updated: Ticketed → Branched
```

Or if scopes are missing:

```
[WARN] Missing required scopes: read:project, project. Run: gh auth refresh -s read:project -s project
```

Or if options aren't updated yet:

```
[WARN] Project status not updated: Status option "Branched" not found in project cache.
```

## What's Next

Wave 1 provides the foundation. Next steps:

- Complete manual Status field update
- Refresh cache
- Test full lifecycle: Ticketed → Branched → PR Open → In Review → Merged
- Implement Wave 2 (reliability + completeness)
- Implement Wave 3 (downstream + docs)

## Files Changed

- `scripts/_lib/github.mjs`: Added `ghCommand()`, `verifyGhTokenScopes()`
- `scripts/ops/create-branch.mjs`: Wired `ensureProjectStatus("Branched")`
- `scripts/ops/open-or-update-pr.mjs`: Added token verification
- `scripts/ops/update-project-status-field.mjs`: Manual update instructions
- `scripts/ops/refresh-project-cache.mjs`: Cache refresh utility

Status updates will now automatically track lifecycle transitions once the manual steps are complete.
