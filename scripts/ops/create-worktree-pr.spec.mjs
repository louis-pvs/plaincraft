import { describe, it, expect } from "vitest";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureIdeaMetadataForBootstrap } from "./create-worktree-pr.mjs";

async function makeTempIdeaFile(contents) {
  const dir = await mkdtemp(
    path.join(process.cwd(), ".tmp-worktree-bootstrap-"),
  );
  const file = path.join(dir, "idea.md");
  await writeFile(file, contents, "utf-8");
  return file;
}

describe("ensureIdeaMetadataForBootstrap", () => {
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
