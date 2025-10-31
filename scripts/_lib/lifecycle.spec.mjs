/**
 * lifecycle.spec.mjs
 * Tests for lifecycle config loader
 */

import path from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  loadLifecycleConfig,
  clearLifecycleConfigCache,
  LifecycleConfigSchema,
} from "./lifecycle.mjs";

describe("LifecycleConfigSchema", () => {
  it("should validate minimal config snapshot", () => {
    const sample = {
      version: "0.0.1",
      project: {
        id: 123,
        fields: {
          id: "ID",
          type: "Type",
          lane: "Lane",
          status: "Status",
          owner: "Owner",
          priority: "Priority",
          release: "Release",
        },
        statuses: ["Draft"],
        types: ["Arch"],
        lanes: ["C"],
        priorities: ["P1"],
      },
      branches: {
        allowedPrefixes: ["feat"],
        pattern: "^feat\\/([A-Z]+-\\d+)-[a-z0-9-]+$",
      },
      commits: {
        pattern: "^\\[([A-Z]+-\\d+)\\]\\s+feat\\([^)]+\\):\\s+.+$",
      },
      pullRequests: {
        titlePattern: "^\\[([A-Z]+-\\d+)\\]\\s+.+$",
      },
      ideas: {
        directory: "ideas",
        requiredFields: ["id"],
      },
    };

    expect(() => LifecycleConfigSchema.parse(sample)).not.toThrow();
  });
});

describe("loadLifecycleConfig", () => {
  afterEach(() => {
    clearLifecycleConfigCache();
  });

  it("loads and normalizes lifecycle configuration from repo", async () => {
    const config = await loadLifecycleConfig();

    expect(config.version).toBeDefined();
    expect(config.project.fields.id).toBe("ID");
    expect(config.project.statusSet.has("Ticketed")).toBe(true);
    expect(config.branches.regex).toBeInstanceOf(RegExp);
    expect(config.commits.regex).toBeInstanceOf(RegExp);
    expect(config.pullRequests.regex).toBeInstanceOf(RegExp);
    expect(config.paths.configPath).toContain(
      path.join("scripts", "config", "lifecycle.json"),
    );
  });

  it("returns cached instance on subsequent calls", async () => {
    const first = await loadLifecycleConfig();
    const second = await loadLifecycleConfig();

    expect(second).toBe(first);
  });

  it("forces reload when requested", async () => {
    const first = await loadLifecycleConfig();
    const second = await loadLifecycleConfig({ forceReload: true });

    expect(second).not.toBe(first);
    expect(second.version).toBe(first.version);
  });
});
