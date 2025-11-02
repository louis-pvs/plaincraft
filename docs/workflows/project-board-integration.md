---
id: workflow-project-board
owner: "@lane-c"
lane: C
version: 1.0.0
created: 2025-11-02
ttl_days: 90
last_verified: 2025-11-02
prev: /workflows/pr-changelog-pipeline
next: /policy/workflow-enforcement
---

# Project Board Integration

**Status**: ✅ Operational (Wave 1 & 2 Complete)  
**Last Updated**: 2025-11-02  
**Owner**: Lane C (DevOps & Automation)

## Overview

The project board integration enables automatic lifecycle status tracking through GitHub Projects v2. When you create branches and PRs using the lifecycle scripts, the project board automatically reflects the current status without manual updates.

**Automation Level**: ~85% (from idea → issue → branch → PR → merge)

## Setup

### 1. GitHub Token Scopes

Your GitHub token must have the following scopes:

- `read:project` - Read project board data
- `project` - Update project board items

**Check current scopes**:

```bash
gh auth status
```

**Add missing scopes**:

```bash
gh auth refresh -s read:project -s project
```

### 2. Project Board Setup

Create a GitHub Project with these fields:

| Field Name | Type          | Options                                                  |
| ---------- | ------------- | -------------------------------------------------------- |
| ID         | Text          | Primary identifier (e.g., ARCH-123, C-147)               |
| Status     | Single Select | Ticketed, Branched, PR Open, In Review, Merged, Archived |
| Type       | Single Select | Arch, Component, Bug, Feature                            |
| Lane       | Single Select | A, B, C, D, PB, U                                        |
| Owner      | Text          | GitHub username (e.g., @lane-c)                          |
| Priority   | Single Select | P0, P1, P2, P3                                           |

**Note**: Status options must exactly match lifecycle states for automation to work.

### 3. Cache Refresh

After creating/updating the project, refresh the local cache:

```bash
node scripts/ops/refresh-project-cache.mjs
```

This fetches project metadata and stores it in `.repo/projects.json` for fast lookups.

## Lifecycle Status Transitions

### Automated Transitions

The following status transitions happen automatically:

```
Draft → Ticketed → Branched → PR Open → In Review → Merged → Archived
         ↓           ↓           ↓
      (manual)   create-branch  open-or-update-pr
```

1. **Ticketed**: Manual (when issue is created and added to project)
2. **Branched**: Automatic via `create-branch.mjs`
3. **PR Open**: Automatic via `open-or-update-pr.mjs`
4. **In Review**: Manual (when PR review requested)
5. **Merged**: Manual (when PR merged)
6. **Archived**: Manual (via closeout script)

### Script Integration

#### `create-branch.mjs`

Creates a branch and updates project status to "Branched".

**Validation**:

- Verifies token has required scopes
- Validates branch name matches issue ID (e.g., `feat/C-147-*` requires ID=C-147)
- Checks project cache for Status field and options
- Finds project item by ID field

**Success Output**:

```
[INFO] Project status updated: Ticketed → Branched
```

**Warning Scenarios**:

```
[WARN] Missing required scopes: project. Run: gh auth refresh -s read:project -s project
[WARN] Branch validation failed: branch contains 'C-144' but ID is 'C-147'. Skipping project status update.
[WARN] Project status not updated: Project item for C-147 not found.
```

#### `open-or-update-pr.mjs`

Opens/updates a PR and sets project status to "PR Open".

**Validation**:

- Same token and branch validation as `create-branch`
- Reuses project cache if already loaded
- Updates status after PR created/updated

**Success Output**:

```
[INFO] Project status updated: Branched → PR Open
```

#### `ideas-to-issues.mjs`

Creates an issue and automatically adds it to the project.

**Behavior**:

- After issue creation, attempts to add to project
- Graceful fallback if project unavailable
- Logs success or skips with warning

**Success Output**:

```
Created issue #147: ARCH-test-e2e-with-project
[INFO] Added issue #147 to project (item ID: PVTI_lAHOAHTeus4BG_ACzgWATwY)
```

**Warning Scenarios**:

```
[WARN] Could not add issue to project: Project cache missing ID or Status field metadata. Issue created successfully, add to project manually if needed.
```

## Error Handling & Remediation

### Common Errors

#### 1. Missing Cache Metadata

**Error**:

```
[WARN] Project status not updated: Project cache missing ID or Status field metadata.
```

**Cause**: `.repo/projects.json` is missing or outdated

**Solution**:

```bash
node scripts/ops/refresh-project-cache.mjs
```

#### 2. Status Option Not Found

**Error**:

```
[WARN] Project status not updated: Status option "Branched" not found in project cache. Available: [Todo, In Progress, Done].
```

**Cause**: Project Status field has wrong options

**Solution**:

1. Open project in GitHub web UI
2. Go to Settings → Fields → Status
3. Update options to match lifecycle: Ticketed, Branched, PR Open, In Review, Merged, Archived
4. Refresh cache: `node scripts/ops/refresh-project-cache.mjs`

#### 3. Project Item Not Found

**Error**:

```
[WARN] Project status not updated: Project item for C-147 not found.
```

**Cause**: Issue not added to project yet

**Solution**:

- Wait for `ideas-to-issues` to auto-add (if recently created)
- Or manually add via GitHub web UI
- Or use project-helpers: `addIssueByNumber({ issueNumber: 147, projectId: "PVT_..." })`

#### 4. Branch/ID Mismatch

**Error**:

```
[WARN] Branch validation failed: branch contains 'C-144' but ID is 'C-147'. Skipping project status update.
```

**Cause**: Reusing a branch from a different issue

**Solution**: Create a new branch with correct ID or use `--id` flag matching the branch

#### 5. Insufficient Token Scopes

**Error**:

```
[WARN] Missing required scopes: read:project, project. Run: gh auth refresh -s read:project -s project
```

**Solution**:

```bash
gh auth refresh -s read:project -s project
```

## Technical Details

### Functions (project-helpers.mjs)

#### `loadProjectCache(options)`

Loads project metadata from `.repo/projects.json`.

**Returns**: `{ cache, path, root }`

**Throws**: If cache file missing or invalid

#### `findProjectItemByFieldValue(options)`

Finds a project item by field value (e.g., find by ID="C-147").

**Parameters**:

- `projectId` - Project node ID
- `fieldId` - Field ID to search
- `value` - Value to match
- `retries` - Number of retries for eventual consistency (default: 3)
- `retryDelay` - Initial delay in ms (default: 1000)

**Returns**: `{ item, fields }` or `null`

**Retry Logic**: Uses exponential backoff (1s → 2s → 4s) to handle eventual consistency after item creation.

#### `updateProjectSingleSelectField(options)`

Updates a single-select field value via GraphQL mutation.

**Parameters**:

- `projectId` - Project node ID
- `itemId` - Item node ID
- `fieldId` - Field ID to update
- `optionId` - Target option ID

**Returns**: `Promise<void>`

#### `ensureProjectStatus(options)`

High-level function that updates status if different from current.

**Parameters**:

- `id` - Lifecycle identifier (e.g., "C-147")
- `status` - Target status (e.g., "Branched")
- `cacheInfo` - Optional cached project data
- `itemOverride` - Optional pre-fetched item

**Returns**: `{ updated, previous, message }`

**Logic**:

1. Load project cache
2. Find Status field and options
3. Find project item by ID
4. Check current status
5. Update if different
6. Return result with remediation hints

#### `addIssueByNumber(options)`

Adds an issue to the project by issue number.

**Parameters**:

- `issueNumber` - Issue number
- `projectId` - Project node ID

**Returns**: `{ itemId, issueNodeId }`

### GraphQL Details

**Union Types Handled**:

- `ProjectV2ItemFieldValue` (5 cases: TextValue, NumberValue, SingleSelectValue, DateValue, IterationValue)
- `ProjectV2FieldConfiguration` (3 types: ProjectV2Field, ProjectV2SingleSelectField, ProjectV2IterationField)

**Required Permissions**:

- Read operations: `read:project` scope
- Update operations: `project` scope

### Cache Format (`.repo/projects.json`)

```json
{
  "project": {
    "id": "PVT_kwHOAHTeus4BG_AC",
    "number": 1,
    "title": "Plaincraft Lifecycle",
    "url": "https://github.com/users/louis-pvs/projects/1",
    "fields": {
      "Status": {
        "id": "PVTSSF_lAHOAHTeus4BG_ACzgWAS7I",
        "name": "Status",
        "options": [
          { "id": "f75ad846", "name": "Ticketed" },
          { "id": "47fc9ee4", "name": "Branched" },
          { "id": "7e656307", "name": "PR Open" }
        ]
      },
      "ID": {
        "id": "PVTF_lAHOAHTeus4BG_ACzgWAS7A",
        "name": "ID"
      }
    }
  }
}
```

## Best Practices

1. **Always refresh cache after project changes**: `node scripts/ops/refresh-project-cache.mjs`
2. **Use correct branch naming**: `feat/ID-slug` or `fix/ID-slug` where ID matches the issue
3. **Check token scopes before bulk operations**: `gh auth status`
4. **Monitor warnings in script output**: They provide actionable remediation steps
5. **Let auto-add work**: Don't manually add issues if using `ideas-to-issues` - it handles it
6. **Trust the validation guards**: If branch/ID mismatch is detected, create a new branch

## Troubleshooting

### Project updates not working

1. Check token scopes: `gh auth status`
2. Refresh cache: `node scripts/ops/refresh-project-cache.mjs`
3. Verify project exists: `cat .repo/projects.json`
4. Check Status field options match lifecycle states
5. Ensure issue is added to project

### Items not found after creation

- Wait 2-3 seconds and retry (eventual consistency)
- The retry logic handles this automatically (3 attempts with exponential backoff)
- If persists, manually add via web UI

### Status transitions not appearing

- Check that Status field name is exactly "Status" (case-sensitive)
- Verify options match lifecycle states exactly
- Refresh browser if viewing in web UI (may be cached)

## Future Enhancements

- [ ] Auto-transition to "In Review" when PR review requested
- [ ] Auto-transition to "Merged" when PR merged (via webhook or workflow)
- [ ] Auto-archive when idea file moved to `_archive/`
- [ ] Bulk status updates for multiple items
- [ ] Project board selection (support multiple projects)
- [ ] Custom field mapping (flexible field names)
