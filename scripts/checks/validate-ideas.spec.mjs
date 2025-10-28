/**
 * validate-ideas.spec.mjs
 * Regression tests for validateIdeas helper.
 */

import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { validateIdeas } from "./validate-ideas.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createLogger() {
  return {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    trace: () => {},
  };
}

async function createTempRepo() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "validate-ideas-"));
  await mkdir(path.join(tempRoot, ".git"), { recursive: true });
  return tempRoot;
}

describe("validateIdeas helper", () => {
  it("marks workspace missing when /ideas is absent", async () => {
    const tempRoot = await createTempRepo();

    try {
      const result = await validateIdeas({ cwd: tempRoot }, createLogger());

      expect(result.status).toBe("missing");
      expect(result.message).toContain("Ideas workspace not found");
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("marks workspace empty when /ideas has no cards", async () => {
    const tempRoot = await createTempRepo();
    await mkdir(path.join(tempRoot, "ideas"), { recursive: true });

    try {
      const result = await validateIdeas({ cwd: tempRoot }, createLogger());

      expect(result.status).toBe("empty");
      expect(result.message).toContain("No idea files found in /ideas");
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
