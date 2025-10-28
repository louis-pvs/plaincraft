# ARCH-subissue-fix-duplicate-sections

Lane: C (DevOps & Automation)
Parent: ARCH-subissue-pipeline-repair

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, sub-issues

## Purpose

Prevent duplicate `## Sub-Issues` sections in parent issues so sync scripts only ever manage a single canonical checklist.

## Problem

When `scripts/ideas-to-issues.mjs` creates sub-issues, it appends a new `## Sub-Issues` section to the parent issue body. If the script runs multiple times or if a Sub-Issues section already exists, duplicate sections are created. This breaks the sync script (`sync-issue-to-card.mjs`) which expects a single canonical section.

## Proposal

Modify `scripts/ideas-to-issues.mjs` function `updateParentWithChildren()`:

1. Before updating parent issue, check if `## Sub-Issues` section already exists
2. If exists, replace the entire section (not append)
3. If doesn't exist, append as before
4. Use regex: `/## Sub-Issues\s*[\s\S]*?(?=\n##|$)/` to match section boundaries
5. Preserve formatting to ensure compatibility with `sync-issue-to-card.mjs`

Implementation:

```javascript
async function updateParentWithChildren(
  parentIssueNumber,
  childIssues,
  dryRun,
) {
  // ... existing code ...

  const { stdout } = await execAsync(
    `gh issue view ${parentIssueNumber} --json body`,
  );
  let currentBody = JSON.parse(stdout).body || "";

  const subIssuesRegex = /## Sub-Issues\s*[\s\S]*?(?=\n##|$)/;
  const hasSubIssues = subIssuesRegex.test(currentBody);

  let updatedBody;
  if (hasSubIssues) {
    updatedBody = currentBody.replace(
      subIssuesRegex,
      `## Sub-Issues\n\n${taskList}`,
    );
  } else {
    updatedBody = `${currentBody}\n\n## Sub-Issues\n\n${taskList}`;
  }

  // ... rest of update logic ...
}
```

## Acceptance Checklist

- [ ] `updateParentWithChildren()` function updated with section replacement logic
- [ ] Regex correctly matches Sub-Issues section boundaries
- [ ] Test: Run script twice on same parent → single Sub-Issues section appears
- [ ] Test: Manually edit parent issue, add Sub-Issues → re-run script → section replaced not duplicated
- [ ] Formatting preserved (checklist format: `- [ ] #N Title`)
- [ ] `sync-issue-to-card.mjs` can still parse the section correctly
- [ ] Dry-run mode shows replacement behavior in logs
