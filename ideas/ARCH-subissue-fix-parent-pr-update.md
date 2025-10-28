# ARCH-subissue-fix-parent-pr-update

Lane: C (DevOps & Automation)
Parent: ARCH-subissue-pipeline-repair
Issue: #48

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, sub-issues

## Purpose

Auto-update parent PR bodies after sub-issue merges so reviewers can see progress and checklist state without manual edits.

## Problem

When `scripts/merge-subissue-to-parent.mjs` merges a sub-issue branch to the parent branch, it successfully performs the git merge and push. However, the parent PR body remains stale:

- Sub-Issues progress section not updated
- Acceptance checklist doesn't reflect merged work
- No indication that 1/5, 2/5, etc. sub-issues are complete

Reviewers see outdated PR descriptions and must manually check issue checklists.

## Proposal

Extend `scripts/merge-subissue-to-parent.mjs` with a new `updateParentPR()` function:

1. After successful git merge, find parent PR number via `gh pr list --search "Closes #ParentIssue"`
2. Fetch updated parent issue body (contains latest Sub-Issues checklist)
3. Extract `## Sub-Issues` section from issue
4. Update parent PR body to add/replace `## Sub-Issues Progress` section
5. Use `gh pr edit` to push updated body

Implementation:

```javascript
async function updateParentPR(parentIssueNumber, subIssueNumber) {
  try {
    // 1. Find parent PR
    const { stdout: prStdout } = await execAsync(
      `gh pr list --search "Closes #${parentIssueNumber}" --json number --limit 1`,
    );
    const prs = JSON.parse(prStdout);
    if (prs.length === 0) {
      console.log(
        `ℹ️  No open PR found for parent issue #${parentIssueNumber}`,
      );
      return;
    }
    const parentPRNumber = prs[0].number;

    // 2. Get parent issue Sub-Issues section
    const { stdout: issueStdout } = await execAsync(
      `gh issue view ${parentIssueNumber} --json body`,
    );
    const issueBody = JSON.parse(issueStdout).body;

    const subIssuesRegex = /## Sub-Issues\s*([\s\S]*?)(?=\n##|$)/;
    const match = issueBody.match(subIssuesRegex);
    const subIssuesSection = match ? match[1].trim() : "";

    // 3. Get current PR body
    const { stdout: prBodyStdout } = await execAsync(
      `gh pr view ${parentPRNumber} --json body -q .body`,
    );
    let prBody = prBodyStdout;

    // 4. Update or add Sub-Issues Progress section
    if (/## Sub-Issues Progress/m.test(prBody)) {
      prBody = prBody.replace(
        /## Sub-Issues Progress\s*[\s\S]*?(?=\n##|$)/,
        `## Sub-Issues Progress\n\n${subIssuesSection}\n`,
      );
    } else {
      prBody = prBody.replace(
        /(# Acceptance Checklist)/,
        `## Sub-Issues Progress\n\n${subIssuesSection}\n\n---\n\n$1`,
      );
    }

    // 5. Update PR
    const bodyFile = `/tmp/parent-pr-body-${Date.now()}.md`;
    await writeFile(bodyFile, prBody);
    await execAsync(`gh pr edit ${parentPRNumber} --body-file "${bodyFile}"`);

    console.log(
      `✅ Updated parent PR #${parentPRNumber} with sub-issue progress`,
    );
  } catch (error) {
    console.warn(`⚠️  Could not update parent PR: ${error.message}`);
  }
}
```

Integrate into `merge-subissue-to-parent.mjs` main function after successful merge.

## Acceptance Checklist

- [ ] `updateParentPR()` function implemented in `merge-subissue-to-parent.mjs`
- [ ] Function finds parent PR via `gh pr list --search`
- [ ] Extracts Sub-Issues section from parent issue body
- [ ] Updates or adds `## Sub-Issues Progress` section in PR body
- [ ] Uses temp file + `gh pr edit --body-file` to update PR
- [ ] Test: Merge sub-issue → parent PR shows updated progress section
- [ ] Test: Multiple merges → progress increments (1/3, 2/3, 3/3)
- [ ] Test: No open parent PR → gracefully logs message, doesn't fail
- [ ] PR body markdown structure remains valid (no broken formatting)
- [ ] Integration: Called automatically after each `merge-subissue-to-parent.mjs` run
