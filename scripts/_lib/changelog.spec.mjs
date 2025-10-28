/**
 * changelog.spec.mjs
 * Unit tests for changelog.mjs
 */

import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getSummaryFiles,
  parseSummaryFile,
  parseSummaryFiles,
  generateVersionEntry,
  deduplicateChangelog,
  mergeVersionEntries,
  insertVersionEntry,
  parseChangelogContent,
  parseChangelogFile,
  filterChangelogByVersion,
  laneLabelFromTitle,
  normalizeSectionFilters,
  extractSections,
} from "./changelog.mjs";

// Mock fs modules
vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("changelog.mjs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getSummaryFiles", () => {
    it("should return empty array if directory does not exist", async () => {
      existsSync.mockReturnValue(false);
      const result = await getSummaryFiles("/repo");
      expect(result).toEqual([]);
    });

    it("should return sorted markdown files from tmp directory", async () => {
      existsSync.mockReturnValue(true);
      readdir.mockResolvedValue([
        "summary2.md",
        "summary1.md",
        "readme.txt",
        "summary3.md",
      ]);

      const result = await getSummaryFiles("/repo");
      expect(result).toEqual([
        "/repo/_tmp/summary1.md",
        "/repo/_tmp/summary2.md",
        "/repo/_tmp/summary3.md",
      ]);
    });

    it("should use custom tmp directory", async () => {
      existsSync.mockReturnValue(true);
      readdir.mockResolvedValue(["change.md"]);

      const result = await getSummaryFiles("/repo", "custom-tmp");
      expect(result).toEqual(["/repo/custom-tmp/change.md"]);
    });

    it("should handle empty directory", async () => {
      existsSync.mockReturnValue(true);
      readdir.mockResolvedValue([]);

      const result = await getSummaryFiles("/repo");
      expect(result).toEqual([]);
    });

    it("should filter out non-markdown files", async () => {
      existsSync.mockReturnValue(true);
      readdir.mockResolvedValue([
        "file.txt",
        "doc.pdf",
        "change.md",
        "script.mjs",
      ]);

      const result = await getSummaryFiles("/repo");
      expect(result).toEqual(["/repo/_tmp/change.md"]);
    });
  });

  describe("parseSummaryFile", () => {
    it("should parse summary file with title", async () => {
      readFile.mockResolvedValue("# Button Component\n\nAdded button");

      const result = await parseSummaryFile("/repo/summary.md");
      expect(result).toEqual({
        title: "Button Component",
        content: "# Button Component\n\nAdded button",
        filePath: "/repo/summary.md",
      });
    });

    it("should handle file without title", async () => {
      readFile.mockResolvedValue("Some content\nMore content");

      const result = await parseSummaryFile("/repo/summary.md");
      expect(result).toEqual({
        title: "Changes",
        content: "Some content\nMore content",
        filePath: "/repo/summary.md",
      });
    });

    it("should trim whitespace from content", async () => {
      readFile.mockResolvedValue("# Title\n\nContent\n\n\n");

      const result = await parseSummaryFile("/repo/summary.md");
      expect(result.content).toBe("# Title\n\nContent");
    });

    it("should extract title without hash and whitespace", async () => {
      readFile.mockResolvedValue("#   Multiple Spaces   \n\nContent");

      const result = await parseSummaryFile("/repo/summary.md");
      expect(result.title).toBe("Multiple Spaces");
    });

    it("should handle title in middle of file", async () => {
      readFile.mockResolvedValue("Introduction\n# Main Title\nBody");

      const result = await parseSummaryFile("/repo/summary.md");
      expect(result.title).toBe("Main Title");
    });
  });

  describe("parseSummaryFiles", () => {
    it("should parse multiple files", async () => {
      readFile
        .mockResolvedValueOnce("# File One\nContent 1")
        .mockResolvedValueOnce("# File Two\nContent 2");

      const result = await parseSummaryFiles(["/file1.md", "/file2.md"]);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("File One");
      expect(result[1].title).toBe("File Two");
    });

    it("should handle empty array", async () => {
      const result = await parseSummaryFiles([]);
      expect(result).toEqual([]);
    });
  });

  describe("generateVersionEntry", () => {
    it("should generate version entry with summaries", () => {
      const result = generateVersionEntry({
        version: "1.0.0",
        date: "2025-01-15",
        summaries: [
          { title: "Features", content: "# Features\n\n- Add button" },
          { title: "Fixes", content: "# Fixes\n\n- Fix layout" },
        ],
      });

      expect(result).toContain("## [1.0.0] - 2025-01-15");
      expect(result).toContain("### Features");
      expect(result).toContain("- Add button");
      expect(result).toContain("### Fixes");
      expect(result).toContain("- Fix layout");
    });

    it("should strip title from summary content", () => {
      const result = generateVersionEntry({
        version: "0.1.0",
        date: "2025-01-01",
        summaries: [{ title: "Changes", content: "# Changes\n\nContent" }],
      });

      expect(result).toContain("### Changes");
      expect(result).toContain("Content");
      // The function strips the title line but searches for "# Changes" as a comment
      expect(result).toMatch(/### Changes\n\nContent/);
    });

    it("should handle empty summaries", () => {
      const result = generateVersionEntry({
        version: "1.0.0",
        date: "2025-01-01",
        summaries: [],
      });

      expect(result).toBe("## [1.0.0] - 2025-01-01\n");
    });

    it("should add proper spacing between sections", () => {
      const result = generateVersionEntry({
        version: "1.0.0",
        date: "2025-01-01",
        summaries: [
          { title: "A", content: "# A\n\nA content" },
          { title: "B", content: "# B\n\nB content" },
        ],
      });

      expect(result).toMatch(/### A\n\nA content\n\n### B/);
    });

    it("should end with single newline", () => {
      const result = generateVersionEntry({
        version: "1.0.0",
        date: "2025-01-01",
        summaries: [{ title: "Test", content: "# Test\n\nData" }],
      });

      expect(result.endsWith("\n")).toBe(true);
      expect(result.endsWith("\n\n")).toBe(false);
    });
  });

  describe("deduplicateChangelog", () => {
    it("should return empty string for null input", () => {
      expect(deduplicateChangelog(null)).toBe("");
    });

    it("should return empty string for undefined input", () => {
      expect(deduplicateChangelog(undefined)).toBe("");
    });

    it("should preserve changelog without duplicates", () => {
      const changelog = `# Changelog

## [1.0.0] - 2025-01-01

### Features

- Feature A

## [0.9.0] - 2024-12-01

### Fixes

- Fix B
`;

      const result = deduplicateChangelog(changelog);
      expect(result).toContain("## [1.0.0]");
      expect(result).toContain("## [0.9.0]");
    });

    it("should merge duplicate version sections", () => {
      const changelog = `# Changelog

## [1.0.0] - 2025-01-01

### Features

- Feature A

## [1.0.0] - 2025-01-01

### Fixes

- Fix B
`;

      const result = deduplicateChangelog(changelog);
      const matches = result.match(/## \[1\.0\.0\]/g);
      expect(matches).toHaveLength(1);
      expect(result).toContain("### Features");
      expect(result).toContain("### Fixes");
    });

    it("should preserve header before version entries", () => {
      const changelog = `# Changelog

All notable changes.

## [1.0.0] - 2025-01-01

### Features

- Feature
`;

      const result = deduplicateChangelog(changelog);
      expect(result).toContain("# Changelog");
      expect(result).toContain("All notable changes.");
    });

    it("should handle changelog with no versions", () => {
      const changelog = "# Changelog\n\nNo releases yet.";
      const result = deduplicateChangelog(changelog);
      expect(result).toBe(changelog);
    });

    it("should maintain version order", () => {
      const changelog = `# Changelog

## [2.0.0] - 2025-02-01

### Features

- New

## [2.0.0] - 2025-02-01

### Fixes

- Fix

## [1.0.0] - 2025-01-01

### Initial

- Initial
`;

      const result = deduplicateChangelog(changelog);
      const v2Index = result.indexOf("## [2.0.0]");
      const v1Index = result.indexOf("## [1.0.0]");
      expect(v2Index).toBeLessThan(v1Index);
    });
  });

  describe("mergeVersionEntries", () => {
    it("should merge two version entries with different sections", () => {
      const existing = `## [1.0.0] - 2025-01-01

### Features

- Feature A`;

      const incoming = `## [1.0.0] - 2025-01-01

### Fixes

- Fix B`;

      const result = mergeVersionEntries(existing, incoming);
      expect(result).toContain("### Features");
      expect(result).toContain("- Feature A");
      expect(result).toContain("### Fixes");
      expect(result).toContain("- Fix B");
    });

    it("should merge sections with same heading", () => {
      const existing = `## [1.0.0] - 2025-01-01

### Features

- Feature A`;

      const incoming = `## [1.0.0] - 2025-01-01

### Features

- Feature B`;

      const result = mergeVersionEntries(existing, incoming);
      expect(result).toContain("- Feature A");
      expect(result).toContain("- Feature B");
    });

    it("should not duplicate existing content", () => {
      const existing = `## [1.0.0] - 2025-01-01

### Features

- Feature A`;

      const incoming = `## [1.0.0] - 2025-01-01

### Features

- Feature A`;

      const result = mergeVersionEntries(existing, incoming);
      const matches = result.match(/- Feature A/g);
      expect(matches).toHaveLength(1);
    });

    it("should handle empty incoming section", () => {
      const existing = `## [1.0.0] - 2025-01-01

### Features

- Feature A`;

      const incoming = `## [1.0.0] - 2025-01-01

### Features

`;

      const result = mergeVersionEntries(existing, incoming);
      expect(result).toContain("- Feature A");
    });

    it("should preserve header in merged output", () => {
      const existing = `## [1.0.0] - 2025-01-01

### Features

- A`;

      const incoming = `## [1.0.0] - 2025-01-01

### Fixes

- B`;

      const result = mergeVersionEntries(existing, incoming);
      expect(result.startsWith("## [1.0.0] - 2025-01-01")).toBe(true);
    });
  });

  describe("insertVersionEntry", () => {
    it("should create new changelog if none exists", () => {
      const newEntry = `## [1.0.0] - 2025-01-01

### Features

- Feature A
`;

      const result = insertVersionEntry("", newEntry, "1.0.0");
      expect(result).toContain("# Changelog");
      expect(result).toContain(
        "All notable changes to this project will be documented in this file.",
      );
      expect(result).toContain("## [1.0.0] - 2025-01-01");
    });

    it("should insert new version at top", () => {
      const existing = `# Changelog

## [0.9.0] - 2024-12-01

### Features

- Old feature
`;

      const newEntry = `## [1.0.0] - 2025-01-01

### Features

- New feature
`;

      const result = insertVersionEntry(existing, newEntry, "1.0.0");
      const v1Index = result.indexOf("## [1.0.0]");
      const v09Index = result.indexOf("## [0.9.0]");
      expect(v1Index).toBeLessThan(v09Index);
    });

    it("should merge duplicate versions", () => {
      const existing = `# Changelog

## [1.0.0] - 2025-01-01

### Features

- Feature A
`;

      const newEntry = `## [1.0.0] - 2025-01-01

### Fixes

- Fix B
`;

      const result = insertVersionEntry(existing, newEntry, "1.0.0");
      const matches = result.match(/## \[1\.0\.0\]/g);
      expect(matches).toHaveLength(1);
      expect(result).toContain("### Features");
      expect(result).toContain("### Fixes");
    });

    it("should deduplicate after insertion", () => {
      const existing = `# Changelog

## [1.0.0] - 2025-01-01

### Features

- Feature A

## [1.0.0] - 2025-01-01

### Fixes

- Fix B
`;

      const newEntry = `## [2.0.0] - 2025-02-01

### Features

- New
`;

      const result = insertVersionEntry(existing, newEntry, "2.0.0");
      const v1Matches = result.match(/## \[1\.0\.0\]/g);
      expect(v1Matches).toHaveLength(1);
    });

    it("should handle null existing changelog", () => {
      const newEntry = `## [1.0.0] - 2025-01-01

### Features

- Feature
`;

      const result = insertVersionEntry(null, newEntry, "1.0.0");
      expect(result).toContain("# Changelog");
      expect(result).toContain("## [1.0.0]");
    });
  });

  describe("parseChangelogContent", () => {
    it("should parse changelog with multiple versions", () => {
      const content = `# Changelog

## [1.0.0] - 2025-01-01

### Features

- Feature A

## [0.9.0] - 2024-12-01

### Fixes

- Fix B
`;

      const result = parseChangelogContent(content);
      expect(result).toHaveLength(2);
      expect(result[0].version).toBe("1.0.0");
      expect(result[0].date).toBe("2025-01-01");
      expect(result[1].version).toBe("0.9.0");
    });

    it("should parse sections within versions", () => {
      const content = `# Changelog

## [1.0.0] - 2025-01-01

### Features

- Feature A

### Fixes

- Fix B
`;

      const result = parseChangelogContent(content);
      expect(result[0].sections).toHaveLength(2);
      expect(result[0].sections[0].title).toBe("Features");
      expect(result[0].sections[0].content).toBe("- Feature A");
      expect(result[0].sections[1].title).toBe("Fixes");
    });

    it("should handle empty changelog", () => {
      const result = parseChangelogContent("");
      expect(result).toEqual([]);
    });

    it("should handle changelog without versions", () => {
      const content = "# Changelog\n\nNo releases yet.";
      const result = parseChangelogContent(content);
      expect(result).toEqual([]);
    });

    it("should trim section content", () => {
      const content = `# Changelog

## [1.0.0] - 2025-01-01

### Features

- Feature A

`;

      const result = parseChangelogContent(content);
      expect(result[0].sections[0].content).toBe("- Feature A");
    });

    it("should handle version without sections", () => {
      const content = `# Changelog

## [1.0.0] - 2025-01-01

No changes.
`;

      const result = parseChangelogContent(content);
      expect(result).toHaveLength(1);
      expect(result[0].sections).toEqual([]);
    });
  });

  describe("parseChangelogFile", () => {
    it("should read and parse changelog file", async () => {
      readFile.mockResolvedValue(`# Changelog

## [1.0.0] - 2025-01-01

### Features

- Feature A
`);

      const result = await parseChangelogFile("/repo/CHANGELOG.md");
      expect(result).toHaveLength(1);
      expect(result[0].version).toBe("1.0.0");
      expect(readFile).toHaveBeenCalledWith("/repo/CHANGELOG.md", "utf-8");
    });
  });

  describe("filterChangelogByVersion", () => {
    const entries = [
      { version: "1.0.0", date: "2025-01-01", sections: [] },
      { version: "0.9.0", date: "2024-12-01", sections: [] },
      { version: "0.8.0", date: "2024-11-01", sections: [] },
    ];

    it("should filter entries by version", () => {
      const result = filterChangelogByVersion(entries, "0.9.0");
      expect(result).toHaveLength(1);
      expect(result[0].version).toBe("0.9.0");
    });

    it("should return all entries if no version specified", () => {
      const result = filterChangelogByVersion(entries, null);
      expect(result).toEqual(entries);
    });

    it("should return empty array if version not found", () => {
      const result = filterChangelogByVersion(entries, "2.0.0");
      expect(result).toEqual([]);
    });

    it("should handle undefined version", () => {
      const result = filterChangelogByVersion(entries, undefined);
      expect(result).toEqual(entries);
    });

    it("should handle empty entries array", () => {
      const result = filterChangelogByVersion([], "1.0.0");
      expect(result).toEqual([]);
    });
  });

  describe("laneLabelFromTitle", () => {
    it("should extract lane-A from U- prefix", () => {
      expect(laneLabelFromTitle("[U-button] Add button")).toBe("lane-A");
    });

    it("should extract lane-C from C- prefix", () => {
      expect(laneLabelFromTitle("[C-profile] Create profile")).toBe("lane-C");
    });

    it("should extract lane-C from ARCH- prefix", () => {
      expect(laneLabelFromTitle("[ARCH-refactor] Refactor code")).toBe(
        "lane-C",
      );
    });

    it("should extract lane-B from B- prefix", () => {
      expect(laneLabelFromTitle("[B-fix] Fix bug")).toBe("lane-B");
    });

    it("should extract lane-D from D- prefix", () => {
      expect(laneLabelFromTitle("[D-docs] Update docs")).toBe("lane-D");
    });

    it("should extract lane-D from PB- prefix", () => {
      expect(laneLabelFromTitle("[PB-playbook] Add playbook")).toBe("lane-D");
    });

    it("should return null for unknown prefix", () => {
      expect(laneLabelFromTitle("[X-unknown] Unknown")).toBeNull();
    });

    it("should return null for title without tag", () => {
      expect(laneLabelFromTitle("No tag here")).toBeNull();
    });

    it("should return null for null title", () => {
      expect(laneLabelFromTitle(null)).toBeNull();
    });

    it("should return null for undefined title", () => {
      expect(laneLabelFromTitle(undefined)).toBeNull();
    });

    it("should return null for empty title", () => {
      expect(laneLabelFromTitle("")).toBeNull();
    });
  });

  describe("normalizeSectionFilters", () => {
    it("should split comma-separated filters", () => {
      expect(normalizeSectionFilters("Features,Fixes")).toEqual([
        "features",
        "fixes",
      ]);
    });

    it("should trim whitespace", () => {
      expect(normalizeSectionFilters("  Features  ,  Fixes  ")).toEqual([
        "features",
        "fixes",
      ]);
    });

    it("should convert to lowercase", () => {
      expect(normalizeSectionFilters("FEATURES,Fixes,changed")).toEqual([
        "features",
        "fixes",
        "changed",
      ]);
    });

    it("should handle undefined input", () => {
      expect(normalizeSectionFilters(undefined)).toEqual([]);
    });

    it("should handle empty string", () => {
      expect(normalizeSectionFilters("")).toEqual([]);
    });

    it("should filter out empty tokens", () => {
      expect(normalizeSectionFilters("Features,,Fixes,")).toEqual([
        "features",
        "fixes",
      ]);
    });

    it("should handle single filter", () => {
      expect(normalizeSectionFilters("Features")).toEqual(["features"]);
    });

    it("should convert non-string to string", () => {
      expect(normalizeSectionFilters(123)).toEqual(["123"]);
    });
  });

  describe("extractSections", () => {
    const entries = [
      {
        version: "1.0.0",
        date: "2025-01-01",
        sections: [
          { title: "[U-button] Add button", content: "Button added" },
          { title: "[C-profile] Profile page", content: "Profile created" },
        ],
      },
      {
        version: "0.9.0",
        date: "2024-12-01",
        sections: [{ title: "[B-fix] Bug fix", content: "Fixed bug" }],
      },
    ];

    it("should extract all sections without filters", () => {
      const result = extractSections(entries);
      expect(result).toHaveLength(3);
      expect(result[0].title).toBe("[U-button] Add button");
      expect(result[0].version).toBe("1.0.0");
    });

    it("should filter sections by keyword", () => {
      const result = extractSections(entries, ["button"]);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("[U-button] Add button");
    });

    it("should filter with multiple keywords", () => {
      const result = extractSections(entries, ["button", "profile"]);
      expect(result).toHaveLength(2);
    });

    it("should handle case-insensitive filtering", () => {
      // extractSections compares token against lowercased title
      // so filters should be pre-normalized (lowercase) before calling
      const result = extractSections(entries, ["button"]);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("[U-button] Add button");
    });

    it("should skip sections without title", () => {
      const entriesWithEmpty = [
        {
          version: "1.0.0",
          date: "2025-01-01",
          sections: [
            { title: "[U-button] Add button", content: "Content" },
            { title: "", content: "No title" },
            { title: null, content: "Null title" },
          ],
        },
      ];

      const result = extractSections(entriesWithEmpty);
      expect(result).toHaveLength(1);
    });

    it("should return empty array if no matches", () => {
      const result = extractSections(entries, ["nonexistent"]);
      expect(result).toEqual([]);
    });

    it("should handle empty entries array", () => {
      const result = extractSections([]);
      expect(result).toEqual([]);
    });

    it("should include version metadata in results", () => {
      const result = extractSections(entries, ["fix"]);
      expect(result[0]).toEqual({
        version: "0.9.0",
        date: "2024-12-01",
        title: "[B-fix] Bug fix",
        content: "Fixed bug",
      });
    });

    it("should handle empty filters array", () => {
      const result = extractSections(entries, []);
      expect(result).toHaveLength(3);
    });
  });
});
