# ARCH-subissue-fix-checklist-sync

Lane: C (DevOps & Automation)
Parent: ARCH-subissue-pipeline-repair

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, sub-issues

## Purpose

Auto-update parent issue checklists when sub-issues close so the source-of-truth remains synchronized across cards, issues, and PRs.

## Problem

When a sub-issue closes, the parent issue's `## Sub-Issues` checklist should update from `- [ ] #M Title` to `- [x] #M Title`. Currently this is manual:

- No automation detects sub-issue closure
- Parent issue checklist remains stale with unchecked boxes
- `sync-issue-to-card.mjs` pulls stale data back to idea cards
- Source of truth fragments: git (merged) ≠ issue checklist (unchecked)

The `manual-update-pr-checkboxes.mjs` script only handles PRs, not issues.

## Proposal

Create new script `scripts/update-parent-issue-checklist.mjs`:

1. Accept sub-issue number as CLI argument
2. Find sub-issue idea file and extract `Parent: #N` metadata
3. Fetch parent issue body via `gh issue view`
4. Update checklist: change `- [ ] #SubIssue` to `- [x] #SubIssue` using regex
5. Write updated body back via `gh issue edit --body-file`

Integration options:

- **Option A (quick):** Call from `merge-subissue-to-parent.mjs` after successful merge
- **Option B (robust):** GitHub Actions workflow triggered on `issues: closed` event

Implementation:

```javascript
#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { exec } from "node:child_process";

const execAsync = promisify(exec);

async function updateParentIssueChecklist(subIssueNumber) {
  // 1. Find sub-issue idea file
  const { stdout } = await execAsync(
    `gh issue view ${subIssueNumber} --json title,body`,
  );
  const subIssue = JSON.parse(stdout);

  const tagMatch = subIssue.title.match(/^\[?([A-Z]+-[a-z-]+)\]?/i);
  if (!tagMatch) {
    throw new Error("Could not extract tag from sub-issue title");
  }

  const ideaFile = `ideas/${tagMatch[1]}.md`;
  const content = await readFile(ideaFile, "utf-8");

  // 2. Find parent issue number
  const parentMatch = content.match(/Parent:\s*#(\d+)/);
  if (!parentMatch) {
    throw new Error("No Parent: #N found in sub-issue idea card");
  }
  const parentIssueNumber = parentMatch[1];

  // 3. Get parent issue body
  const { stdout: parentStdout } = await execAsync(
    `gh issue view ${parentIssueNumber} --json body`,
  );
  let parentBody = JSON.parse(parentStdout).body;

  // 4. Update checklist
  const checkboxRegex = new RegExp(
    `^(- \\[[ x]\\] )#${subIssueNumber}( .*)$`,
    "gm",
  );

  const updatedBody = parentBody.replace(
    checkboxRegex,
    `- [x] #${subIssueNumber}$2`,
  );

  // 5. Write back
  const bodyFile = `/tmp/parent-issue-${parentIssueNumber}-${Date.now()}.md`;
  await writeFile(bodyFile, updatedBody);

  await execAsync(
    `gh issue edit ${parentIssueNumber} --body-file "${bodyFile}"`,
  );

  console.log(
    `✅ Updated parent issue #${parentIssueNumber} to mark #${subIssueNumber} complete`,
  );
}

const subIssueNumber = process.argv[2];
if (!subIssueNumber) {
  console.error(
    "Usage: node scripts/update-parent-issue-checklist.mjs <subIssueNumber>",
  );
  process.exit(1);
}

updateParentIssueChecklist(subIssueNumber).catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
```

## Acceptance Checklist

- [ ] `scripts/update-parent-issue-checklist.mjs` script created
- [ ] Script reads sub-issue idea file to find parent reference
- [ ] Fetches parent issue body via `gh issue view`
- [ ] Updates checkbox from `- [ ]` to `- [x]` using regex
- [ ] Writes updated body via `gh issue edit --body-file`
- [ ] Test: Close sub-issue manually → run script → parent checklist updates
- [ ] Test: Sub-issue without parent → graceful error message
- [ ] Integration: Called from `merge-subissue-to-parent.mjs` after merge
- [ ] Optional: GitHub Actions workflow for automatic triggering on issue close
- [ ] Documentation: Added to `SCRIPTS-REFERENCE.md`
