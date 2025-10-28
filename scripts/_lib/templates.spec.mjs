/**
 * templates.spec.mjs
 * Unit tests for templates.mjs
 */

import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  countTemplates,
  countGuides,
  checkRatio,
  listTemplates,
  validateTemplateRef,
  generateTemplateFiles,
  generateGuideContent,
} from "./templates.mjs";

// Mock fs modules
vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("templates.mjs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("countTemplates", () => {
    it("should count templates with config files", async () => {
      readdir.mockResolvedValue([
        { name: "bug-report", isDirectory: () => true },
        { name: "user-story", isDirectory: () => true },
        { name: "README.md", isDirectory: () => false },
      ]);
      existsSync.mockImplementation((path) =>
        path.includes("template.config.json"),
      );

      const result = await countTemplates("/repo");
      expect(result).toBe(2);
    });

    it("should exclude directories without config files", async () => {
      readdir.mockResolvedValue([
        { name: "template1", isDirectory: () => true },
        { name: "template2", isDirectory: () => true },
      ]);
      existsSync
        .mockReturnValueOnce(true) // template1 has config
        .mockReturnValueOnce(false); // template2 no config

      const result = await countTemplates("/repo");
      expect(result).toBe(1);
    });

    it("should return 0 for directory with only files", async () => {
      readdir.mockResolvedValue([
        { name: "README.md", isDirectory: () => false },
        { name: "INDEX.md", isDirectory: () => false },
      ]);

      const result = await countTemplates("/repo");
      expect(result).toBe(0);
    });

    it("should handle empty templates directory", async () => {
      readdir.mockResolvedValue([]);

      const result = await countTemplates("/repo");
      expect(result).toBe(0);
    });
  });

  describe("countGuides", () => {
    it("should count guide-*.md files", async () => {
      readdir.mockResolvedValue([
        "guide-workflow.md",
        "guide-scripts.md",
        "guide-changelog.md",
        "README.md",
        "CONTRIBUTING.md",
      ]);

      const result = await countGuides("/repo");
      expect(result).toBe(3);
    });

    it("should exclude non-guide markdown files", async () => {
      readdir.mockResolvedValue([
        "guide-test.md",
        "README.md",
        "ARCHITECTURE.md",
        "guide-draft.txt",
      ]);

      const result = await countGuides("/repo");
      expect(result).toBe(1);
    });

    it("should handle empty guides directory", async () => {
      readdir.mockResolvedValue([]);

      const result = await countGuides("/repo");
      expect(result).toBe(0);
    });

    it("should exclude files not starting with guide-", async () => {
      readdir.mockResolvedValue([
        "draft-guide.md",
        "my-guide.md",
        "tutorial.md",
      ]);

      const result = await countGuides("/repo");
      expect(result).toBe(0);
    });
  });

  describe("checkRatio", () => {
    it("should calculate ratio and allow guide when ratio is good", async () => {
      // Mock countTemplates to return 15
      readdir.mockResolvedValueOnce([
        { name: "t1", isDirectory: () => true },
        { name: "t2", isDirectory: () => true },
      ]);
      existsSync.mockReturnValue(true);

      // Mock countGuides to return 3
      readdir.mockResolvedValueOnce(["guide-1.md", "guide-2.md", "guide-3.md"]);

      const result = await checkRatio("/repo");
      expect(result.templates).toBe(2);
      expect(result.guides).toBe(3);
      expect(result.ratio).toBeCloseTo(0.667, 2);
      expect(result.canAddGuide).toBe(false); // ratio < 3.0
      expect(result.needsTemplates).toBeGreaterThan(0);
    });

    it("should allow adding guide when no guides exist", async () => {
      readdir.mockResolvedValueOnce([
        { name: "template1", isDirectory: () => true },
      ]);
      existsSync.mockReturnValue(true);
      readdir.mockResolvedValueOnce([]);

      const result = await checkRatio("/repo");
      expect(result.guides).toBe(0);
      expect(result.canAddGuide).toBe(true);
    });

    it("should calculate needsTemplates correctly", async () => {
      readdir.mockResolvedValueOnce([{ name: "t1", isDirectory: () => true }]);
      existsSync.mockReturnValue(true);
      readdir.mockResolvedValueOnce(["guide-1.md", "guide-2.md"]);

      const result = await checkRatio("/repo");
      expect(result.guides).toBe(2);
      expect(result.templates).toBe(1);
      // (guides + 1) * 3.0 = 9, need 8 more templates
      expect(result.needsTemplates).toBe(8);
    });

    it("should handle case with perfect ratio", async () => {
      // 9 templates, 3 guides = 3.0 ratio
      const templateDirs = Array.from({ length: 9 }, (_, i) => ({
        name: `template${i}`,
        isDirectory: () => true,
      }));
      readdir.mockResolvedValueOnce(templateDirs);
      existsSync.mockReturnValue(true);
      readdir.mockResolvedValueOnce(["guide-1.md", "guide-2.md", "guide-3.md"]);

      const result = await checkRatio("/repo");
      expect(result.ratio).toBe(3.0);
      expect(result.canAddGuide).toBe(true);
    });
  });

  describe("listTemplates", () => {
    it("should list templates with metadata", async () => {
      readdir.mockResolvedValue([
        { name: "bug-report", isDirectory: () => true },
        { name: "user-story", isDirectory: () => true },
      ]);
      existsSync.mockReturnValue(true);
      readFile
        .mockResolvedValueOnce(
          JSON.stringify({
            id: "bug-report",
            version: "1.0.0",
            category: "issue",
          }),
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            id: "user-story",
            version: "0.2.0",
            category: "planning",
          }),
        );

      const result = await listTemplates("/repo");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "bug-report",
        version: "1.0.0",
        category: "issue",
        ref: "/templates/bug-report@v1.0.0",
      });
      expect(result[1]).toEqual({
        id: "user-story",
        version: "0.2.0",
        category: "planning",
        ref: "/templates/user-story@v0.2.0",
      });
    });

    it("should skip directories without config files", async () => {
      readdir.mockResolvedValue([
        { name: "valid-template", isDirectory: () => true },
        { name: "incomplete", isDirectory: () => true },
      ]);
      existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
      readFile.mockResolvedValue(
        JSON.stringify({
          id: "valid-template",
          version: "1.0.0",
          category: "test",
        }),
      );

      const result = await listTemplates("/repo");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("valid-template");
    });

    it("should handle empty templates directory", async () => {
      readdir.mockResolvedValue([]);

      const result = await listTemplates("/repo");
      expect(result).toEqual([]);
    });

    it("should skip non-directory entries", async () => {
      readdir.mockResolvedValue([
        { name: "README.md", isDirectory: () => false },
        { name: "template1", isDirectory: () => true },
      ]);
      existsSync.mockReturnValue(true);
      readFile.mockResolvedValue(
        JSON.stringify({ id: "template1", version: "1.0.0", category: "test" }),
      );

      const result = await listTemplates("/repo");
      expect(result).toHaveLength(1);
    });
  });

  describe("validateTemplateRef", () => {
    it("should validate correct template reference with version", async () => {
      existsSync.mockReturnValue(true);

      const result = await validateTemplateRef(
        "/repo",
        "/templates/bug-report@v1.0.0",
      );
      expect(result).toBe(true);
    });

    it("should validate template reference without version", async () => {
      existsSync.mockReturnValue(true);

      const result = await validateTemplateRef(
        "/repo",
        "/templates/user-story",
      );
      expect(result).toBe(true);
    });

    it("should reject invalid format", async () => {
      const result = await validateTemplateRef("/repo", "invalid-ref");
      expect(result).toBe(false);
    });

    it("should reject template that does not exist", async () => {
      existsSync.mockReturnValue(false);

      const result = await validateTemplateRef(
        "/repo",
        "/templates/nonexistent@v1.0.0",
      );
      expect(result).toBe(false);
    });

    it("should reject null reference", async () => {
      const result = await validateTemplateRef("/repo", null);
      expect(result).toBe(false);
    });

    it("should reject undefined reference", async () => {
      const result = await validateTemplateRef("/repo", undefined);
      expect(result).toBe(false);
    });

    it("should reject reference with invalid characters", async () => {
      const result = await validateTemplateRef(
        "/repo",
        "/templates/Invalid_Name@v1.0.0",
      );
      expect(result).toBe(false);
    });

    it("should accept version without v prefix", async () => {
      existsSync.mockReturnValue(true);

      const result = await validateTemplateRef(
        "/repo",
        "/templates/template-name@1.0.0",
      );
      expect(result).toBe(true);
    });
  });

  describe("generateTemplateFiles", () => {
    it("should generate all required template files", () => {
      const result = generateTemplateFiles(
        "/repo/templates/test-template",
        "test-template",
        "test",
      );

      expect(result).toHaveLength(4);
      expect(result[0].path).toContain("README.md");
      expect(result[1].path).toContain("USAGE.md");
      expect(result[2].path).toContain("template.config.json");
      expect(result[3].path).toContain("test-template-template.md");
    });

    it("should include template ID in file contents", () => {
      const result = generateTemplateFiles(
        "/repo/templates/bug-report",
        "bug-report",
        "issue",
      );

      expect(result[0].content).toContain("Bug report");
      expect(result[0].content).toContain(
        "templates/bug-report/bug-report-template.md",
      );
      expect(result[3].content).toContain("# Bug report Template");
    });

    it("should create valid JSON config", () => {
      const result = generateTemplateFiles(
        "/repo/templates/test",
        "test",
        "testing",
      );

      const configFile = result.find((f) =>
        f.path.includes("template.config.json"),
      );
      expect(configFile).toBeDefined();

      const config = JSON.parse(configFile.content);
      expect(config.id).toBe("test");
      expect(config.category).toBe("testing");
      expect(config.version).toBe("0.1.0");
      expect(config.entrypoint).toBe("test-template.md");
      expect(config.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should capitalize display name", () => {
      const result = generateTemplateFiles(
        "/repo/templates/my-cool-template",
        "my-cool-template",
        "test",
      );

      expect(result[0].content).toContain("# My cool template Template");
    });

    it("should use provided category", () => {
      const result = generateTemplateFiles(
        "/repo/templates/test",
        "test",
        "custom-category",
      );

      const configFile = result.find((f) =>
        f.path.includes("template.config.json"),
      );
      const config = JSON.parse(configFile.content);
      expect(config.category).toBe("custom-category");
    });
  });

  describe("generateGuideContent", () => {
    it("should generate guide with all required sections", () => {
      const result = generateGuideContent(
        "test-workflow",
        "/templates/workflow@v1.0.0",
        "@testuser",
        "lane-A",
      );

      expect(result).toContain("id: guide-test-workflow");
      expect(result).toContain("owner: @testuser");
      expect(result).toContain("lane: lane-A");
      expect(result).toContain("scaffold_ref: /templates/workflow@v1.0.0");
      expect(result).toContain("# When to use");
      expect(result).toContain("# When not to use");
      expect(result).toContain("# Steps (all executable)");
      expect(result).toContain("# Rollback");
      expect(result).toContain("# Requirements");
      expect(result).toContain("# Links");
    });

    it("should include current date in frontmatter", () => {
      const result = generateGuideContent(
        "test",
        "/templates/test@v1.0.0",
        "@user",
        "lane-A",
      );

      const today = new Date().toISOString().split("T")[0];
      expect(result).toContain(`created: ${today}`);
      expect(result).toContain(`last_verified: ${today}`);
    });

    it("should set version to 0.1.0", () => {
      const result = generateGuideContent(
        "test",
        "/templates/test@v1.0.0",
        "@user",
        "lane-A",
      );

      expect(result).toContain("version: 0.1.0");
    });

    it("should set TTL to 90 days", () => {
      const result = generateGuideContent(
        "test",
        "/templates/test@v1.0.0",
        "@user",
        "lane-A",
      );

      expect(result).toContain("ttl_days: 90");
    });

    it("should include template reference in links", () => {
      const templateRef = "/templates/custom-template@v2.0.0";
      const result = generateGuideContent(
        "test",
        templateRef,
        "@user",
        "lane-A",
      );

      expect(result).toContain(`- Templates: \`${templateRef}\``);
    });

    it("should format artifact_id correctly", () => {
      const result = generateGuideContent(
        "my-custom-guide",
        "/templates/test@v1.0.0",
        "@user",
        "lane-A",
      );

      expect(result).toContain("artifact_id: guide-my-custom-guide");
      expect(result).toContain("id: guide-my-custom-guide");
    });

    it("should handle different lanes", () => {
      const resultA = generateGuideContent(
        "test",
        "/templates/test@v1.0.0",
        "@user",
        "lane-A",
      );
      const resultD = generateGuideContent(
        "test",
        "/templates/test@v1.0.0",
        "@user",
        "lane-D",
      );

      expect(resultA).toContain("lane: lane-A");
      expect(resultD).toContain("lane: lane-D");
    });
  });
});
