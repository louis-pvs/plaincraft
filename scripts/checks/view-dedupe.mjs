#!/usr/bin/env node
/**
 * view-dedupe.mjs
 * @since 2025-10-30
 * @version 0.1.0
 * Summary: Prevent Storybook/Playbook docs from duplicating README steps
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { parseFlags, repoRoot, fail, succeed } from "../_lib/core.mjs";

const DOC_SOURCES = [
  { base: "storybook/docs", extensions: [".md", ".mdx"] },
  { base: "playbook/pages", extensions: [".md", ".mdx"] },
];

const README_SOURCES = [
  { base: "snippets", patterns: ["README.md", "USAGE.md"] },
  { base: "templates", patterns: ["README.md", "USAGE.md"] },
];

const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/view-dedupe.mjs [options]

Options:
  --help              Show this help message
  --dry-run           Preview mode without making changes (default: true)
  --yes               Execute mode (confirms execution)
  --cwd <path>        Working directory (default: process.cwd())
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)

Description:
  Ensures Storybook docs and Playbook pages stay narrative-only:
  - Detects \\\`bash/sh\\\` code blocks duplicated from README/USAGE files
  - Flags guardrail headings (Scaffold/Test/Rollback) inside view docs

Exit codes:
  0  - Success (no duplicates found)
  11 - Validation failed (duplicates detected)
`);
  process.exit(0);
}

function normalizeCommand(block) {
  return block
    .replace(/```(?:bash|sh)\n?/g, "")
    .replace(/```$/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .join("\n");
}

async function collectReferenceCommands(root, source) {
  const commands = new Map();
  const baseDir = path.join(root, source.base);

  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (!source.patterns.some((pattern) => entry.name.endsWith(pattern))) {
        continue;
      }

      const content = await readFile(entryPath, "utf-8");
      const matches = content.match(/```(?:bash|sh)\n[\s\S]*?```/g);
      if (!matches) continue;

      for (const block of matches) {
        const normalized = normalizeCommand(block);
        if (!normalized) continue;

        if (!commands.has(normalized)) {
          commands.set(normalized, []);
        }
        commands.get(normalized).push(path.relative(root, entryPath));
      }
    }
  }

  await walk(baseDir);
  return commands;
}

async function collectViewDocs(root) {
  const docs = [];

  for (const source of DOC_SOURCES) {
    const baseDir = path.join(root, source.base);
    try {
      const stats = await stat(baseDir);
      if (!stats.isDirectory()) continue;
    } catch {
      continue;
    }

    const entries = await readdir(baseDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDocs = await collectNestedDocs(
          root,
          path.join(baseDir, entry.name),
          source.extensions,
        );
        docs.push(...subDocs);
      } else if (source.extensions.some((ext) => entry.name.endsWith(ext))) {
        docs.push(path.join(baseDir, entry.name));
      }
    }
  }

  return docs;
}

async function collectNestedDocs(root, dir, extensions) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectNestedDocs(root, entryPath, extensions);
      files.push(...nested);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(entryPath);
    }
  }
  return files;
}

(async () => {
  try {
    const root = await repoRoot(args.cwd);
    const referenceCommands = new Map();

    for (const source of README_SOURCES) {
      const commands = await collectReferenceCommands(root, source);
      for (const [command, files] of commands.entries()) {
        if (!referenceCommands.has(command)) {
          referenceCommands.set(command, new Set());
        }
        const existing = referenceCommands.get(command);
        files.forEach((file) => existing.add(file));
      }
    }

    const docs = await collectViewDocs(root);
    const duplicates = [];
    const headingViolations = [];

    for (const doc of docs) {
      const content = await readFile(doc, "utf-8");

      if (/^##\s+(Scaffold|Test|Rollback)/m.test(content)) {
        headingViolations.push(path.relative(root, doc));
      }

      const blocks = content.match(/```(?:bash|sh)\n[\s\S]*?```/g) || [];
      for (const block of blocks) {
        const normalized = normalizeCommand(block);
        if (!normalized) continue;
        if (!referenceCommands.has(normalized)) continue;

        duplicates.push({
          doc: path.relative(root, doc),
          command: normalized,
          sources: Array.from(referenceCommands.get(normalized)),
        });
      }
    }

    const payload = {
      ok: duplicates.length === 0 && headingViolations.length === 0,
      duplicates,
      headingViolations,
      checkedDocs: docs.map((doc) => path.relative(root, doc)),
    };

    if (!payload.ok) {
      fail({
        exitCode: 11,
        message: "View documentation duplicates scaffold steps",
        output: args.output,
        script: "view-dedupe",
        error: payload,
      });
    } else {
      succeed({
        output: args.output,
        script: "view-dedupe",
        message: "View documentation dedupe passed",
        ...payload,
      });
    }
  } catch (error) {
    fail({
      exitCode: 11,
      message: error.message,
      output: args.output,
      script: "view-dedupe",
      error: { stack: error.stack },
    });
  }
})();
