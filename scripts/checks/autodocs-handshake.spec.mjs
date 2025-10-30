/**
 * autodocs-handshake.spec.mjs
 * Guards the contract between Autodocs MDX pages and README metadata.
 */

import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { describe, it, expect } from "vitest";
import { repoRoot } from "../_lib/core.mjs";

async function listSnippetDirs(root) {
  const snippetsDir = path.join(root, "snippets");
  const entries = await readdir(snippetsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("_"));
}

describe("Autodocs README handshake", () => {
  it("requires README metadata and surfaces it in MDX docs", async () => {
    const root = await repoRoot();
    const snippetDirs = await listSnippetDirs(root);

    expect(snippetDirs.length).toBeGreaterThan(0);

    for (const dirName of snippetDirs) {
      const snippetPath = path.join(root, "snippets", dirName);
      const readmePath = path.join(snippetPath, "README.md");
      const mdxPath = await findMdxFile(snippetPath, dirName);

      const readme = await readFile(readmePath, "utf-8");
      const scaffoldMatch = readme.match(/scaffold_ref:\s*([^\s]+)/i);
      const ownerMatch = readme.match(/_Owner:\s*@([A-Za-z0-9-_]+)/);

      expect(scaffoldMatch, `${dirName} README missing scaffold_ref`).toBeTruthy();
      expect(ownerMatch, `${dirName} README missing owner handle`).toBeTruthy();

      const scaffoldRaw = scaffoldMatch[1].replace(/^#/, "").trim();
      const [templateRef] = scaffoldRaw.split("@");
      const templateRelPath = templateRef.replace(/^\/+/, "");
      const templateAbsPath = path.join(root, templateRelPath);

      const templateStat = await stat(templateAbsPath);
      expect(
        templateStat.isDirectory(),
        `${templateRelPath} referenced by ${dirName} is not a directory`,
      ).toBe(true);

      const mdx = await readFile(mdxPath, "utf-8");
      expect(mdx).toMatch(/README\.md\?raw/, `${dirName} Autodocs must import README`);
      expect(mdx).toMatch(/scaffoldRef/i, `${dirName} Autodocs missing scaffoldRef surface`);
      expect(mdx).toMatch(/ownerHandle/i, `${dirName} Autodocs missing owner handle surface`);
    }
  });
});

async function findMdxFile(snippetPath, dirName) {
  const files = await readdir(snippetPath);
  const match = files.find((file) => file.endsWith(".mdx"));

  if (!match) {
    throw new Error(`${dirName} missing Autodocs MDX file`);
  }

  return path.join(snippetPath, match);
}
