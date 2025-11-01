import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHECKS_DIR = path.resolve(__dirname);

function collectScriptFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectScriptFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".mjs")) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("logging contract", () => {
  it("scripts/checks do not use logger.info by default", () => {
    const files = collectScriptFiles(CHECKS_DIR).filter(
      (file) => !file.endsWith(".spec.mjs"),
    );

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      expect(content.includes("logger.info(")).toBe(false);
    }
  });
});
