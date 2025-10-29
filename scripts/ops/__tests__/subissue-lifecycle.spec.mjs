/**
 * subissue-lifecycle.spec.mjs
 * Integration-style test for sub-issue automation flow.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

let parentIssueBody;
let prBody;

const execCommandMock = vi.fn(async () => ({
  stdout: JSON.stringify([{ number: 101 }]),
}));

const updateIssueMock = vi.fn(async (_issueNumber, payload) => {
  parentIssueBody = payload.body;
});

const updatePRMock = vi.fn(async (_prNumber, payload) => {
  prBody = payload.body;
});

vi.mock("../../_lib/git.mjs", () => ({
  execCommand: execCommandMock,
}));

vi.mock("../../_lib/github.mjs", () => ({
  getIssue: vi.fn(async () => ({
    body: parentIssueBody,
  })),
  getPR: vi.fn(async () => ({
    body: prBody,
  })),
  updateIssue: updateIssueMock,
  updatePR: updatePRMock,
}));

const log = {
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();

  parentIssueBody = `
# Parent Issue

## Problem

Parent problem statement.

## Sub-Issues

- [ ] #123 ARCH-subissue-fix - Prevent duplicate sections
- [ ] #124 ARCH-subissue-next - Follow-up task

## Proposal

Plan of record.
`;

  prBody = `
Closes #42

## Problem

Parent problem summary.

## Proposal

Solution outline.

## Acceptance Checklist

- [ ] Parent ready

---
**Source:** \`/ideas/ARCH-parent.md\`
`;
});

describe("sub-issue lifecycle automation", () => {
  it("marks parent checklist complete and refreshes PR progress", async () => {
    const { updateParentIssueChecklist, updateParentPullRequest } =
      await import("../merge-subissue-to-parent.mjs");

    const checklistResult = await updateParentIssueChecklist(42, 123, log);

    expect(checklistResult.updated).toBe(true);
    expect(updateIssueMock).toHaveBeenCalledTimes(1);
    expect(parentIssueBody).toContain(
      "- [x] #123 ARCH-subissue-fix - Prevent duplicate sections",
    );
    expect(parentIssueBody).toContain(
      "- [ ] #124 ARCH-subissue-next - Follow-up task",
    );

    const prResult = await updateParentPullRequest(42, 123, log);

    expect(prResult.updated).toBe(true);
    expect(execCommandMock).toHaveBeenCalled();
    expect(updatePRMock).toHaveBeenCalledTimes(1);
    expect(prBody).toContain("## Sub-Issues Progress");
    expect(prBody).toContain("**Progress:** 1 / 2 complete");
    expect(prBody).toContain(
      "- [x] #123 ARCH-subissue-fix - Prevent duplicate sections",
    );
    expect(prBody).toContain("- [ ] #124 ARCH-subissue-next - Follow-up task");
    expect(prBody).toMatch(/## Acceptance Checklist/);
  });
});
