# ARCH-subissue-fix-pr-context

Lane: C (DevOps & Automation)
Parent: ARCH-subissue-pipeline-repair
Issue: #47

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, sub-issues

## Purpose

Add parent issue context to sub-issue PRs so reviewers immediately see how the work maps to the larger architectural effort.

## Problem

When sub-issue PRs are created via `create-worktree-pr.mjs`, the PR body doesn't indicate that the work is part of a larger parent issue. Reviewers lack context about:

- Which parent issue this sub-issue belongs to
- The overall architectural goal
- Position in the sub-issue sequence (e.g., "2 of 5")

The `generate-pr-content.mjs` script parses idea files but ignores `Parent: #N` metadata.

## Proposal

Enhance `scripts/generate-pr-content.mjs` to detect and use parent metadata:

1. Parse idea file content for `Parent: #(\d+)` pattern
2. If parent found, fetch parent issue details via `gh issue view`
3. Add prominent banner at top of PR body: `> **Part of:** #ParentNumber ParentTitle`
4. Include parent reference in footer: `**Parent Issue:** #N`
5. Ensure standalone PRs (no parent) are unaffected

Implementation location: `generateBodyFromIdeaFile()` function (~line 470-520)

```javascript
async function generateBodyFromIdeaFile(ideaFilePath, issueNumber) {
  const metadata = await parseIdeaFile(ideaFilePath);

  // Check if this is a sub-issue
  const parentMatch = metadata.content?.match(/Parent:\s*#(\d+)/);
  const parentIssue = parentMatch ? parentMatch[1] : null;

  let parentContext = "";
  if (parentIssue) {
    const { stdout } = await execAsync(
      `gh issue view ${parentIssue} --json title,number`,
    );
    const parent = JSON.parse(stdout);
    parentContext = `> **Part of:** #${parent.number} ${parent.title}\n\n`;
  }

  const body = `Closes #${issueNumber}

${parentContext}**Purpose:** ${metadata.purpose}

## Problem
${metadata.problem}

## Proposal
${metadata.proposal}

## Acceptance Checklist
${metadata.acceptance.join("\n")}

---

${parentIssue ? `**Parent Issue:** #${parentIssue}\n` : ""}**Source:** \`/ideas/${metadata.filename}\`
`;

  return body;
}
```

## Acceptance Checklist

- [ ] `generateBodyFromIdeaFile()` function updated to parse `Parent: #N` metadata
- [ ] Parent issue details fetched via GitHub CLI
- [ ] PR body includes banner: `> **Part of:** #Parent Title`
- [ ] Footer includes parent reference link
- [ ] Test: Create sub-issue PR → banner appears at top
- [ ] Test: Create standalone PR → no parent banner (no regression)
- [ ] Parent issue link is clickable and navigates correctly
- [ ] Error handling: if parent issue not found, gracefully skip context (no crash)
