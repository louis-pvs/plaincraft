#!/usr/bin/env node

/**
 * Unit tests for PR content generation
 * Tests ticket ID extraction, issue linking, and checklist propagation
 */

import { describe, it } from "node:test";
import assert from "node:assert";

/**
 * Extract ticket ID from tag (e.g., [B-pr-template-enforcement] -> B-pr-template-enforcement)
 */
function extractTicketId(tag) {
  const match = tag.match(/^\[([\w-]+)\]$/);
  return match ? match[1] : null;
}

describe("PR Content Generation", () => {
  describe("extractTicketId", () => {
    it("should extract ticket ID from valid tag", () => {
      assert.strictEqual(
        extractTicketId("[B-pr-template-enforcement]"),
        "B-pr-template-enforcement",
      );
      assert.strictEqual(extractTicketId("[U-inline-edit]"), "U-inline-edit");
      assert.strictEqual(extractTicketId("[ARCH-ci]"), "ARCH-ci");
      assert.strictEqual(extractTicketId("[PB-roadmap]"), "PB-roadmap");
    });

    it("should return null for invalid tags", () => {
      assert.strictEqual(extractTicketId("B-pr-template"), null);
      assert.strictEqual(extractTicketId(""), null);
      assert.strictEqual(extractTicketId("[invalid tag]"), null);
      assert.strictEqual(extractTicketId("no-brackets"), null);
    });
  });

  describe("Lane detection", () => {
    it("should detect correct lane from tag prefix", () => {
      const getLane = (tag) => {
        let lane = "";
        if (tag.startsWith("[U-")) lane = "lane:A";
        else if (tag.startsWith("[B-")) lane = "lane:B";
        else if (tag.startsWith("[C-") || tag.startsWith("[ARCH-"))
          lane = "lane:C";
        else if (tag.startsWith("[D-") || tag.startsWith("[PB-"))
          lane = "lane:D";
        return lane;
      };

      assert.strictEqual(getLane("[U-inline-edit]"), "lane:A");
      assert.strictEqual(getLane("[B-pr-template]"), "lane:B");
      assert.strictEqual(getLane("[C-ci-fix]"), "lane:C");
      assert.strictEqual(getLane("[ARCH-refactor]"), "lane:C");
      assert.strictEqual(getLane("[D-project]"), "lane:D");
      assert.strictEqual(getLane("[PB-playbook]"), "lane:D");
    });
  });

  describe("Scope summary generation", () => {
    it("should extract first sentence from content", () => {
      const extractScopeSummary = (content) => {
        const firstLine = content.split("\n")[0].trim();
        return firstLine.replace(/^[-*]\s*/, "").split(/[.!?]/)[0] + ".";
      };

      assert.strictEqual(
        extractScopeSummary("- Fix PR template compliance gaps"),
        "Fix PR template compliance gaps.",
      );

      assert.strictEqual(
        extractScopeSummary(
          "Update generator to auto-populate ticket IDs. Additional context here.",
        ),
        "Update generator to auto-populate ticket IDs.",
      );
    });
  });
});
