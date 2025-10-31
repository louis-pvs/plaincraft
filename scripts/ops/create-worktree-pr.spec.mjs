import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { describe, it, expect, afterAll } from "vitest";
import { ensureIdeaMetadataForBootstrap } from "./create-worktree-pr.mjs";

const tempDirs = [];

async function makeTempIdeaFile(contents) {
  const dir = await mkdtemp(
    path.join(os.tmpdir(), "plaincraft-worktree-bootstrap-"),
  );
  tempDirs.push(dir);
  const file = path.join(dir, "idea.md");
  await writeFile(file, contents, "utf-8");
  return file;
}

describe("ensureIdeaMetadataForBootstrap", () => {
  afterAll(async () => {
    await Promise.all(
      tempDirs.map(async (dir) => {
        try {
          await rm(dir, { recursive: true, force: true });
        } catch {
          // ignore cleanup errors in tests
        }
      }),
    );
    tempDirs.length = 0;
  });

  it("updates pending issue and inserts status", async () => {
    const ideaFile = await makeTempIdeaFile(
      [
        "# ARCH-example",
        "",
        "Lane: C (DevOps & Automation)",
        "Issue: pending",
        "",
        "## Lane",
        "",
        "- **Primary Lane:** C (DevOps & Automation)",
      ].join("\n"),
    );

    const changed = await ensureIdeaMetadataForBootstrap(ideaFile, 321);
    expect(changed).toBe(true);

    const content = await readFile(ideaFile, "utf-8");
    expect(content).toContain("Issue: #321");
    expect(content).toContain("Status: in-progress");
    expect(content).toMatch(/Status: in-progress\n\n## Lane/);
  });

  it("normalizes numeric issue value and replaces existing status", async () => {
    const ideaFile = await makeTempIdeaFile(
      [
        "# ARCH-example",
        "",
        "Lane: C (DevOps & Automation)",
        "Issue: 12",
        "Status: ready",
        "",
        "## Lane",
        "",
        "- **Primary Lane:** C (DevOps & Automation)",
      ].join("\n"),
    );

    const changed = await ensureIdeaMetadataForBootstrap(ideaFile, 12);
    expect(changed).toBe(true);

    const content = await readFile(ideaFile, "utf-8");
    expect(content).toContain("Issue: #12");
    expect(content).toContain("Status: in-progress");
    expect(content).not.toContain("Status: ready");
  });

  it("returns false when metadata already aligned", async () => {
    const ideaFile = await makeTempIdeaFile(
      [
        "# ARCH-example",
        "",
        "Lane: C (DevOps & Automation)",
        "Issue: #55",
        "Status: in-progress",
        "",
        "## Lane",
        "",
        "- **Primary Lane:** C (DevOps & Automation)",
      ].join("\n"),
    );

    const changed = await ensureIdeaMetadataForBootstrap(ideaFile, 55);
    expect(changed).toBe(false);

    const content = await readFile(ideaFile, "utf-8");
    expect(content.match(/Status: in-progress/g)).toHaveLength(1);
  });
});
