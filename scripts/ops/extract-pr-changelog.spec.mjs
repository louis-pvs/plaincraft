/**
 * extract-pr-changelog.spec.mjs
 * @since 2025-11-01
 * @version 1.0.0
 * Tests for PR changelog extraction
 */

import { describe, it, expect } from "vitest";

/**
 * Extract changelog section from PR body
 */
function extractChangelogSection(prBody) {
  if (!prBody) return null;

  const patterns = [
    /## Changes\s*\n([\s\S]*?)(?=\n##|$)/i,
    /## Changelog\s*\n([\s\S]*?)(?=\n##|$)/i,
    /## What Changed\s*\n([\s\S]*?)(?=\n##|$)/i,
    /## Summary\s*\n([\s\S]*?)(?=\n##|$)/i,
    /### Changes\s*\n([\s\S]*?)(?=\n###|$)/i,
  ];

  for (const pattern of patterns) {
    const match = prBody.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extract title from PR title - handles [TAG] prefix format
 */
function extractTitle(prTitle) {
  if (!prTitle) return "Changes";

  const match = prTitle.match(/^\[([^\]]+)\]\s+(.+)$/);
  if (match) {
    return match[2].trim();
  }

  return prTitle.trim();
}

/**
 * Generate filename from PR number and title
 */
function generateFilename(prNumber, prTitle) {
  const title = extractTitle(prTitle);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);

  return `pr-${prNumber}-${slug}.md`;
}

describe("extractChangelogSection", () => {
  it("should extract content from ## Changes section", () => {
    const prBody = `
## Overview
Some overview text

## Changes
- Added feature X
- Fixed bug Y

## Testing
Some testing notes
`;
    const result = extractChangelogSection(prBody);
    expect(result).toBe("- Added feature X\n- Fixed bug Y");
  });

  it("should extract content from ## Changelog section", () => {
    const prBody = `
## Changelog
- Updated component
- Added tests
`;
    const result = extractChangelogSection(prBody);
    expect(result).toBe("- Updated component\n- Added tests");
  });

  it("should extract content from ## What Changed section", () => {
    const prBody = `
## What Changed
- Refactored module A
`;
    const result = extractChangelogSection(prBody);
    expect(result).toBe("- Refactored module A");
  });

  it("should extract content from ## Summary section", () => {
    const prBody = `
## Summary
This PR does X and Y
`;
    const result = extractChangelogSection(prBody);
    expect(result).toBe("This PR does X and Y");
  });

  it("should return null when no changelog section exists", () => {
    const prBody = `
## Overview
Just some overview

## Testing
Some testing
`;
    const result = extractChangelogSection(prBody);
    expect(result).toBeNull();
  });

  it("should return null for empty body", () => {
    const result = extractChangelogSection("");
    expect(result).toBeNull();
  });

  it("should handle content until next section", () => {
    const prBody = `
## Changes
- Line 1
- Line 2

## Next Section
Should not be included
`;
    const result = extractChangelogSection(prBody);
    expect(result).toBe("- Line 1\n- Line 2");
  });

  it("should handle content until end of file", () => {
    const prBody = `
## Changes
- Line 1
- Line 2
- Line 3`;
    const result = extractChangelogSection(prBody);
    expect(result).toBe("- Line 1\n- Line 2\n- Line 3");
  });

  it("should handle case-insensitive section headers", () => {
    const prBody = `
## changes
- Lower case header
`;
    const result = extractChangelogSection(prBody);
    expect(result).toBe("- Lower case header");
  });
});

describe("extractTitle", () => {
  it("should extract title without [TAG] prefix", () => {
    const result = extractTitle("[ARCH-123] Add New Feature");
    expect(result).toBe("Add New Feature");
  });

  it("should extract title with [TAG] containing hyphen", () => {
    const result = extractTitle("[B-456] Fix Bug");
    expect(result).toBe("Fix Bug");
  });

  it("should return original title if no [TAG] prefix", () => {
    const result = extractTitle("Simple Title");
    expect(result).toBe("Simple Title");
  });

  it("should return Changes for empty title", () => {
    const result = extractTitle("");
    expect(result).toBe("Changes");
  });

  it("should return Changes for null title", () => {
    const result = extractTitle(null);
    expect(result).toBe("Changes");
  });

  it("should trim whitespace", () => {
    const result = extractTitle("[TAG]   Title With Spaces  ");
    expect(result).toBe("Title With Spaces");
  });
});

describe("generateFilename", () => {
  it("should generate filename from PR number and title", () => {
    const result = generateFilename(123, "[ARCH-456] Add New Component");
    expect(result).toBe("pr-123-add-new-component.md");
  });

  it("should handle special characters in title", () => {
    const result = generateFilename(99, "Fix Bug: Something/Else");
    expect(result).toBe("pr-99-fix-bug-something-else.md");
  });

  it("should truncate long titles", () => {
    const longTitle =
      "This is a very long title that should be truncated to fifty characters maximum";
    const result = generateFilename(1, longTitle);
    expect(result).toBe(
      "pr-1-this-is-a-very-long-title-that-should-be-truncated.md",
    );
    // Verify slug is truncated to 50 chars (before .md)
    const slug = result.replace(/^pr-\d+-/, "").replace(/\.md$/, "");
    expect(slug.length).toBeLessThanOrEqual(50);
  });

  it("should handle title with multiple spaces", () => {
    const result = generateFilename(42, "Multiple   Spaces   Title");
    expect(result).toBe("pr-42-multiple-spaces-title.md");
  });

  it("should remove leading and trailing hyphens", () => {
    const result = generateFilename(5, "---Title---");
    expect(result).toBe("pr-5-title.md");
  });

  it("should convert uppercase to lowercase", () => {
    const result = generateFilename(10, "[TAG] UPPERCASE TITLE");
    expect(result).toBe("pr-10-uppercase-title.md");
  });
});
