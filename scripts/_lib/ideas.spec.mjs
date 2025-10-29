/**
 * ideas.spec.mjs
 * Unit tests for ideas.mjs
 */

import { readFile, readdir } from "node:fs/promises";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  VALIDATION_RULES,
  getIdeaType,
  parseIdeaFile,
  validateIdeaFile,
  findIdeaFiles,
  extractSubIssues,
  extractChecklistItems,
} from "./ideas.mjs";

// Mock fs module
vi.mock("node:fs/promises");

describe("VALIDATION_RULES", () => {
  it("should have rules for all idea types", () => {
    expect(VALIDATION_RULES.unit).toBeDefined();
    expect(VALIDATION_RULES.composition).toBeDefined();
    expect(VALIDATION_RULES.architecture).toBeDefined();
    expect(VALIDATION_RULES.playbook).toBeDefined();
    expect(VALIDATION_RULES.bug).toBeDefined();
  });

  it("should have required sections for each type", () => {
    expect(VALIDATION_RULES.unit.requiredSections).toContain(
      "Acceptance Checklist",
    );
    expect(VALIDATION_RULES.composition.requiredSections).toContain(
      "Units In Scope",
    );
    expect(VALIDATION_RULES.architecture.requiredSections).toContain("Purpose");
  });

  it("should have filename patterns for each type", () => {
    expect(VALIDATION_RULES.unit.filenamePattern).toBeInstanceOf(RegExp);
    expect(VALIDATION_RULES.composition.filenamePattern).toBeInstanceOf(RegExp);
  });
});

describe("getIdeaType", () => {
  it("should detect unit type from U- prefix", () => {
    expect(getIdeaType("U-feature-name.md")).toBe("unit");
    expect(getIdeaType("U-another-idea.md")).toBe("unit");
  });

  it("should detect composition type from C- prefix", () => {
    expect(getIdeaType("C-compose-feature.md")).toBe("composition");
    expect(getIdeaType("C-multi-unit.md")).toBe("composition");
  });

  it("should detect architecture type from ARCH- prefix", () => {
    expect(getIdeaType("ARCH-decision.md")).toBe("architecture");
    expect(getIdeaType("ARCH-refactor-plan.md")).toBe("architecture");
  });

  it("should detect playbook type from PB- prefix", () => {
    expect(getIdeaType("PB-process.md")).toBe("playbook");
    expect(getIdeaType("PB-workflow.md")).toBe("playbook");
  });

  it("should detect bug type from B- prefix", () => {
    expect(getIdeaType("B-crash-on-save.md")).toBe("bug");
    expect(getIdeaType("B-validation-error.md")).toBe("bug");
  });

  it("should detect brief type from lowercase slug", () => {
    expect(getIdeaType("creator-onboarding-bridge.md")).toBe("brief");
    expect(getIdeaType("initiative-brief.md")).toBe("brief");
  });

  it("should handle filenames without known prefix", () => {
    expect(getIdeaType("invalid-idea.md")).toBe("brief");
    expect(getIdeaType("README.md")).toBeNull();
    expect(getIdeaType("X-unknown.md")).toBeNull();
  });

  it("should handle filenames without extension", () => {
    expect(getIdeaType("U-feature")).toBe("unit");
    expect(getIdeaType("C-compose")).toBe("composition");
  });
});

describe("parseIdeaFile", () => {
  it("should extract title from markdown h1", () => {
    const content = "# My Feature Title\n\nSome content";
    const result = parseIdeaFile(content);

    expect(result.title).toBe("My Feature Title");
  });

  it("should extract lane from Lane: specification", () => {
    const content = "## Lane\n\nLane: B\n\n## Other";
    const result = parseIdeaFile(content);

    expect(result.lane).toBe("B");
  });

  it("should handle lowercase lane", () => {
    const content = "Lane: a";
    const result = parseIdeaFile(content);

    expect(result.lane).toBe("A");
  });

  it("should extract issue number", () => {
    const content = "Issue: #42\n\nSome content";
    const result = parseIdeaFile(content);

    expect(result.issueNumber).toBe(42);
  });

  it("should extract all h2 sections", () => {
    const content = `# Title

## Lane

Lane: A

## Purpose

Some purpose

## Problem

Some problem

## Acceptance Checklist

- [ ] Item 1
`;

    const result = parseIdeaFile(content);

    expect(result.sections.Lane).toBe("Lane: A");
    expect(result.sections.Purpose).toBe("Some purpose");
    expect(result.sections.Problem).toBe("Some problem");
    expect(result.sections["Acceptance Checklist"]).toContain("- [ ] Item 1");
    expect(result.sectionsNormalized["purpose"].content).toBe("Some purpose");
  });

  it("should return null values when content missing", () => {
    const content = "No title or metadata";
    const result = parseIdeaFile(content);

    expect(result.title).toBeNull();
    expect(result.lane).toBeNull();
    expect(result.issueNumber).toBeNull();
  });

  it("should handle empty content", () => {
    const result = parseIdeaFile("");

    expect(result.title).toBeNull();
    expect(result.sections).toEqual({});
  });

  it("should trim whitespace from extracted values", () => {
    const content = "#   Title With Spaces   \n\nLane:   C   ";
    const result = parseIdeaFile(content);

    expect(result.title).toBe("Title With Spaces");
    expect(result.lane).toBe("C");
  });

  it("should capture parent issue metadata", () => {
    const content = `# Title

Parent: #42 (ARCH-parent-idea)
`;
    const result = parseIdeaFile(content);

    expect(result.parent).toBe("#42 (ARCH-parent-idea)");
    expect(result.parentIssue).toBe(42);
    expect(result.parentSlug).toBe("ARCH-parent-idea");
  });

  it("should capture sections for purpose/problem/proposal", () => {
    const content = `# Title

## Purpose

Purpose line

## Problem

Problem context

## Proposal

Proposal details
`;

    const result = parseIdeaFile(content);

    expect(result.purpose).toBe("Purpose line");
    expect(result.problem).toBe("Problem context");
    expect(result.proposal).toBe("Proposal details");
  });
});

describe("validateIdeaFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should validate a correct unit idea file", async () => {
    const content = `# U-test-feature

## Lane

Lane: A

## Contracts

Test contracts

## Props + Shape

Test props

## Behaviors

Test behaviors

## Acceptance Checklist

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
`;

    readFile.mockResolvedValue(content);

    const result = await validateIdeaFile("/path/to/U-test-feature.md");

    expect(result.valid).toBe(true);
    expect(result.type).toBe("unit");
    expect(result.errors).toHaveLength(0);
  });

  it("should detect invalid filename prefix", async () => {
    const content = "# Invalid";
    readFile.mockResolvedValue(content);

    const result = await validateIdeaFile("/path/to/X-invalid.md");

    expect(result.valid).toBe(false);
    expect(result.type).toBeNull();
    expect(result.errors).toContain(
      "Filename must start with U-, C-, ARCH-, PB-, or B-",
    );
  });

  it("should detect invalid filename pattern for unit", async () => {
    const content = "# Title";
    readFile.mockResolvedValue(content);

    // Pattern requires .md extension, test without it
    const result = await validateIdeaFile("/path/to/U-invalid");

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("doesn't match pattern"))).toBe(
      true,
    );
  });

  it("should detect missing title", async () => {
    const content = `## Lane

Lane: A

## Contracts
`;

    readFile.mockResolvedValue(content);

    const result = await validateIdeaFile("/path/to/U-test.md");

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing top-level heading (# Title)");
  });

  it("should detect missing required sections", async () => {
    const content = `# U-test

## Lane

Lane: A
`;

    readFile.mockResolvedValue(content);

    const result = await validateIdeaFile("/path/to/U-test.md");

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing required section: Contracts");
    expect(result.errors).toContain("Missing required section: Props + Shape");
    expect(result.errors).toContain("Missing required section: Behaviors");
    expect(result.errors).toContain(
      "Missing required section: Acceptance Checklist",
    );
  });

  it("should detect missing lane specification", async () => {
    const content = `# U-test

## Contracts

Test

## Props + Shape

Test

## Behaviors

Test

## Acceptance Checklist

- [ ] Item
`;

    readFile.mockResolvedValue(content);

    const result = await validateIdeaFile("/path/to/U-test.md");

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Missing or invalid Lane specification (A, B, C, or D)",
    );
  });

  it("should warn on empty acceptance checklist", async () => {
    const content = `# U-test

## Lane

Lane: A

## Contracts

Test

## Props + Shape

Test

## Behaviors

Test

## Acceptance Checklist

No checklist items here
`;

    readFile.mockResolvedValue(content);

    const result = await validateIdeaFile("/path/to/U-test.md");

    expect(result.warnings).toContain("Acceptance Checklist is empty");
  });

  it("should warn on sparse acceptance checklist", async () => {
    const content = `# U-test

## Lane

Lane: A

## Contracts

Test

## Props + Shape

Test

## Behaviors

Test

## Acceptance Checklist

- [ ] Only one item
`;

    readFile.mockResolvedValue(content);

    const result = await validateIdeaFile("/path/to/U-test.md");

    expect(result.warnings.some((w) => w.includes("only 1 item"))).toBe(true);
  });

  it("should validate composition idea file", async () => {
    const content = `# C-test-composition

## Lane

Lane: B

## Metric Hypothesis

Test metrics

## Units In Scope

- U-unit-1
- U-unit-2

## Acceptance Checklist

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
`;

    readFile.mockResolvedValue(content);

    const result = await validateIdeaFile("/path/to/C-test-composition.md");

    expect(result.valid).toBe(true);
    expect(result.type).toBe("composition");
    expect(result.errors).toHaveLength(0);
  });

  it("should validate architecture idea file", async () => {
    const content = `# ARCH-test-decision

## Lane

Lane: C

## Purpose

Test purpose

## Problem

Test problem

## Proposal

Test proposal

## Acceptance Checklist

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
`;

    readFile.mockResolvedValue(content);

    const result = await validateIdeaFile("/path/to/ARCH-test-decision.md");

    expect(result.valid).toBe(true);
    expect(result.type).toBe("architecture");
    expect(result.errors).toHaveLength(0);
  });

  it("should handle file read errors", async () => {
    readFile.mockRejectedValue(new Error("File not found"));

    const result = await validateIdeaFile("/path/to/U-missing.md");

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Failed to read file: File not found");
    expect(result.metadata).toBeNull();
  });

  it("should warn if title doesn't include ticket prefix", async () => {
    const content = `# My Feature Title

## Lane

Lane: A

## Contracts

Test

## Props + Shape

Test

## Behaviors

Test

## Acceptance Checklist

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
`;

    readFile.mockResolvedValue(content);

    const result = await validateIdeaFile("/path/to/U-my-feature.md");

    expect(result.warnings.some((w) => w.includes("doesn't include"))).toBe(
      true,
    );
  });

  it("should include metadata in result", async () => {
    const content = `# U-test

## Lane

Lane: D

Issue: #123

## Contracts

Test
`;

    readFile.mockResolvedValue(content);

    const result = await validateIdeaFile("/path/to/U-test.md");

    expect(result.metadata).toBeDefined();
    expect(result.metadata.title).toBe("U-test");
    expect(result.metadata.lane).toBe("D");
    expect(result.metadata.issueNumber).toBe(123);
  });
});

describe("findIdeaFiles", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should find all markdown files in directory", async () => {
    readdir.mockResolvedValue([
      "U-feature-1.md",
      "C-compose.md",
      "ARCH-decision.md",
      "README.md",
      "package.json",
    ]);

    const result = await findIdeaFiles("/path/to/ideas");

    expect(result).toContain("U-feature-1.md");
    expect(result).toContain("C-compose.md");
    expect(result).toContain("ARCH-decision.md");
    expect(result).toContain("README.md");
    expect(result).not.toContain("package.json");
  });

  it("should filter by exact filename", async () => {
    readdir.mockResolvedValue([
      "U-feature-1.md",
      "U-feature-2.md",
      "C-compose.md",
    ]);

    const result = await findIdeaFiles("/path/to/ideas", "U-feature-1.md");

    expect(result).toEqual(["U-feature-1.md"]);
  });

  it("should filter by partial match", async () => {
    readdir.mockResolvedValue([
      "U-feature-1.md",
      "U-feature-2.md",
      "C-feature-3.md",
      "ARCH-other.md",
    ]);

    const result = await findIdeaFiles("/path/to/ideas", "feature");

    expect(result).toContain("U-feature-1.md");
    expect(result).toContain("U-feature-2.md");
    expect(result).toContain("C-feature-3.md");
    expect(result).not.toContain("ARCH-other.md");
  });

  it("should return empty array on directory error", async () => {
    readdir.mockRejectedValue(new Error("Directory not found"));

    const result = await findIdeaFiles("/path/to/missing");

    expect(result).toEqual([]);
  });

  it("should handle empty directory", async () => {
    readdir.mockResolvedValue([]);

    const result = await findIdeaFiles("/path/to/empty");

    expect(result).toEqual([]);
  });

  it("should filter out non-markdown files", async () => {
    readdir.mockResolvedValue([
      "U-feature.md",
      "script.mjs",
      "data.json",
      "image.png",
      "style.css",
    ]);

    const result = await findIdeaFiles("/path/to/ideas");

    expect(result).toEqual(["U-feature.md"]);
  });
});

describe("extractSubIssues", () => {
  it("should extract sub-issues from formatted list", () => {
    const content = `## Sub-issues

1. **U-sub-issue-1** - First sub-issue description
2. **C-sub-issue-2** - Second sub-issue description
3. **ARCH-decision-1** - Architecture decision

## Other Section
`;

    const result = extractSubIssues(content);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: "U-sub-issue-1",
      description: "First sub-issue description",
    });
    expect(result[1]).toEqual({
      id: "C-sub-issue-2",
      description: "Second sub-issue description",
    });
    expect(result[2]).toEqual({
      id: "ARCH-decision-1",
      description: "Architecture decision",
    });
  });

  it("should return empty array when no sub-issues section", () => {
    const content = "## Purpose\n\nNo sub-issues here";

    const result = extractSubIssues(content);

    expect(result).toEqual([]);
  });

  it("should handle empty sub-issues section", () => {
    const content = "## Sub-issues\n\n## Other Section";

    const result = extractSubIssues(content);

    expect(result).toEqual([]);
  });

  it("should ignore malformed lines", () => {
    const content = `## Sub-issues

1. **U-valid** - Valid description
Not a numbered item
2. Missing bold markers
3. **Invalid-ID** - Wrong prefix
4. **C-another-valid** - Another valid one
`;

    const result = extractSubIssues(content);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("U-valid");
    expect(result[1].id).toBe("C-another-valid");
  });

  it("should handle various idea prefixes", () => {
    const content = `## Sub-issues

1. **U-unit** - Unit description
2. **C-composition** - Composition description
3. **ARCH-architecture** - Architecture description
4. **PB-playbook** - Playbook description
5. **B-bug** - Bug description
`;

    const result = extractSubIssues(content);

    expect(result).toHaveLength(5);
    expect(result[0].id).toBe("U-unit");
    expect(result[1].id).toBe("C-composition");
    expect(result[2].id).toBe("ARCH-architecture");
    expect(result[3].id).toBe("PB-playbook");
    expect(result[4].id).toBe("B-bug");
  });

  it("should trim whitespace from descriptions", () => {
    const content =
      "## Sub-issues\n\n1. **U-test** -   Description with spaces   ";

    const result = extractSubIssues(content);

    expect(result[0].description).toBe("Description with spaces");
  });

  it("should read sub-issues from parsed metadata", () => {
    const content = `# Title

## Sub-Issues

1. **ARCH-sub** - Details here
`;

    const metadata = parseIdeaFile(content);
    const result = extractSubIssues(metadata);

    expect(result).toEqual([{ id: "ARCH-sub", description: "Details here" }]);
  });
});

describe("extractChecklistItems", () => {
  it("should extract unchecked checklist items", () => {
    const content = `## Acceptance Checklist

- [ ] First task
- [ ] Second task
- [ ] Third task
`;

    const result = extractChecklistItems(content);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe("First task");
    expect(result[1]).toBe("Second task");
    expect(result[2]).toBe("Third task");
  });

  it("should extract checked checklist items", () => {
    const content = `## Acceptance Checklist

- [x] Completed task
- [x] Another completed task
`;

    const result = extractChecklistItems(content);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe("Completed task");
    expect(result[1]).toBe("Another completed task");
  });

  it("should extract mixed checked and unchecked items", () => {
    const content = `## Acceptance Checklist

- [x] Completed task
- [ ] Pending task
- [x] Another completed
- [ ] Another pending
`;

    const result = extractChecklistItems(content);

    expect(result).toHaveLength(4);
    expect(result).toContain("Completed task");
    expect(result).toContain("Pending task");
  });

  it("should return empty array when no checklist section", () => {
    const content = "## Purpose\n\nNo checklist here";

    const result = extractChecklistItems(content);

    expect(result).toEqual([]);
  });

  it("should handle empty checklist section", () => {
    const content = "## Acceptance Checklist\n\n## Other Section";

    const result = extractChecklistItems(content);

    expect(result).toEqual([]);
  });

  it("should ignore non-checkbox list items", () => {
    const content = `## Acceptance Checklist

- [ ] Valid checkbox
- Not a checkbox
* Also not a checkbox
- [ ] Another valid checkbox
`;

    const result = extractChecklistItems(content);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe("Valid checkbox");
    expect(result[1]).toBe("Another valid checkbox");
  });

  it("should trim whitespace from items", () => {
    const content = `## Acceptance Checklist

- [ ]   Task with spaces   
- [x]   Another task   
`;

    const result = extractChecklistItems(content);

    expect(result[0]).toBe("Task with spaces");
    expect(result[1]).toBe("Another task");
  });

  it("should handle checklist at end of file", () => {
    const content = `## Acceptance Checklist

- [ ] Last task
- [ ] Final task`;

    const result = extractChecklistItems(content);

    expect(result).toHaveLength(2);
    expect(result[1]).toBe("Final task");
  });

  it("should stop at next h2 section", () => {
    const content = `## Acceptance Checklist

- [ ] Task 1
- [ ] Task 2

## Notes

- [ ] This should not be included
`;

    const result = extractChecklistItems(content);

    expect(result).toHaveLength(2);
    expect(result).not.toContain("This should not be included");
  });

  it("should read checklist items from parsed metadata", () => {
    const content = `# Title

## Acceptance Checklist

- [ ] One
- [x] Two
`;

    const metadata = parseIdeaFile(content);
    const result = extractChecklistItems(metadata);

    expect(result).toEqual(["One", "Two"]);
  });
});
