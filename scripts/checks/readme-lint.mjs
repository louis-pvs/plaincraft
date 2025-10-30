#!/usr/bin/env node
/**
 * readme-lint.mjs
 * @since 2025-10-30
 * @version 0.1.0
 * Summary: Validate developer READMEs against Lane C guardrails
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { Logger, parseFlags, repoRoot, fail, succeed } from "../_lib/core.mjs";

const WORDS_LIMIT = 400;
const REQUIRED_HEADINGS = [
  "When to use",
  "Scaffold",
  "Wire",
  "Test",
  "Rollback",
  "Links",
];

const COLLECTIONS = [
  { name: "snippets", allowPascalCase: true },
  { name: "components", allowPascalCase: true },
  { name: "flows", allowPascalCase: true },
  { name: "scripts", allowPascalCase: false },
];

const EXECUTABLE_PREFIXES = [
  "pnpm ",
  "corepack pnpm ",
  "node ",
  "npm ",
  "npx ",
  "git ",
  "cp ",
  "mkdir ",
  "rm ",
  "touch ",
  "bash ",
  "./",
];

const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/readme-lint.mjs [options]

Options:
  --help              Show this help message
  --dry-run           Preview mode without making changes (default: true)
  --yes               Execute mode (confirms execution)
  --cwd <path>        Working directory (default: process.cwd())
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)

Description:
  Validates developer README files to keep them thin and template-first:
  - Required headings: ${REQUIRED_HEADINGS.join(", ")}
  - Word count ≤ ${WORDS_LIMIT}
  - Scaffold section references /templates/<name>@vX.Y
  - Owner line present (_Owner: @handle)
  - Executable steps use repo scripts or local binaries

Tripwires:
  - Missing scaffold_ref → warning (non-blocking)
  - Missing README in collection → warning

Exit codes:
  0  - Success (errors=0)
  11 - Validation failed (errors>0)
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");

function normalizeWhitespace(text) {
  return text.replace(/\r\n/g, "\n");
}

function stripCodeBlocks(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "");
}

function countWords(markdown) {
  const withoutCode = stripCodeBlocks(markdown);
  return withoutCode
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean).length;
}

function extractSections(markdown) {
  const sections = new Map();
  const lines = normalizeWhitespace(markdown).split("\n");
  let currentHeading = null;
  let buffer = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)/);
    if (headingMatch) {
      if (currentHeading) {
        sections.set(currentHeading, buffer.join("\n").trim());
      }
      currentHeading = headingMatch[1].trim();
      buffer = [];
    } else if (currentHeading) {
      buffer.push(line);
    }
  }

  if (currentHeading) {
    sections.set(currentHeading, buffer.join("\n").trim());
  }

  return sections;
}

function hasExecutableBlock(section) {
  const codeBlocks = section.match(/```(?:bash|sh)\n([\s\S]*?)```/g);
  if (!codeBlocks) return false;
  return codeBlocks.some((block) => {
    const lines = block
      .replace(/```(?:bash|sh)\n/, "")
      .replace(/```$/, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return false;

    const [firstLine] = lines;
    return EXECUTABLE_PREFIXES.some((prefix) => firstLine.startsWith(prefix));
  });
}

function findScaffoldRef(section) {
  if (!section) return null;
  const match = section.match(/scaffold_ref:\s*(\S+)/);
  return match ? match[1].trim() : null;
}

async function readCollections(root) {
  const items = [];

  for (const collection of COLLECTIONS) {
    const collectionPath = path.join(root, collection.name);
    try {
      const stats = await stat(collectionPath);
      if (!stats.isDirectory()) continue;
    } catch {
      continue;
    }

    const entries = await readdir(collectionPath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith("_")) continue;
      if (!collection.allowPascalCase && /^[A-Z]/.test(entry.name)) continue;

      const readmePath = path.join(collectionPath, entry.name, "README.md");

      items.push({
        collection: collection.name,
        unit: entry.name,
        readmePath,
      });
    }
  }

  return items;
}

async function validateReadme(root, target) {
  const errors = [];
  const warnings = [];
  let wordCount = 0;
  let scaffoldRef = null;

  try {
    const content = await readFile(target.readmePath, "utf-8");
    const normalized = normalizeWhitespace(content);
    const sections = extractSections(normalized);
    scaffoldRef = findScaffoldRef(sections.get("Scaffold"));
    wordCount = countWords(normalized);

    for (const heading of REQUIRED_HEADINGS) {
      if (!sections.has(heading)) {
        errors.push(`Missing required heading: "${heading}"`);
      }
    }

    if (wordCount > WORDS_LIMIT) {
      errors.push(`Word count ${wordCount} exceeds limit of ${WORDS_LIMIT}`);
    }

    const scaffoldSection = sections.get("Scaffold");
    if (scaffoldSection) {
      if (!hasExecutableBlock(scaffoldSection)) {
        errors.push("Scaffold section must include bash/sh code block");
      }
      if (!scaffoldRef) {
        warnings.push("Missing scaffold_ref comment (non-blocking)");
      } else if (!/^\/templates\/[a-z0-9-]+@v?\d+\.\d+/.test(scaffoldRef)) {
        warnings.push(`Invalid scaffold_ref format: ${scaffoldRef}`);
      } else {
        const scaffoldDir = scaffoldRef.split("@")[0] || scaffoldRef;
        const targetPath = path.join(root, scaffoldDir.replace(/^\//, ""));
        try {
          const templateStats = await stat(targetPath);
          if (!templateStats.isDirectory()) {
            warnings.push(
              `scaffold_ref path is not a directory: ${scaffoldRef}`,
            );
          }
        } catch {
          warnings.push(`scaffold_ref path not found: ${scaffoldRef}`);
        }
      }
    }

    for (const heading of ["Test", "Rollback"]) {
      const section = sections.get(heading);
      if (section && !hasExecutableBlock(section)) {
        errors.push(`${heading} section must include executable command`);
      }
    }

    const ownerLine = normalized
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .pop();

    if (!ownerLine || !ownerLine.startsWith("_Owner: @")) {
      errors.push("Missing owner line (expected '_Owner: @handle')");
    }
  } catch {
    warnings.push("README missing");
  }

  return {
    ...target,
    wordCount,
    scaffoldRef,
    errors,
    warnings,
  };
}

(async () => {
  try {
    const root = await repoRoot(args.cwd);
    const targets = await readCollections(root);

    if (targets.length === 0) {
      succeed({
        output: args.output,
        ok: true,
        message: "No READMEs to validate",
        checked: 0,
      });
      return;
    }

    const results = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const target of targets) {
      const result = await validateReadme(root, target);
      results.push(result);
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;

      logger.debug(
        `Checked ${target.collection}/${target.unit}: ${result.errors.length} errors, ${result.warnings.length} warnings`,
      );
    }

    const data = {
      ok: totalErrors === 0,
      checked: results.length,
      errors: totalErrors,
      warnings: totalWarnings,
      results: results.map((item) => ({
        collection: item.collection,
        unit: item.unit,
        readmePath: path.relative(root, item.readmePath),
        wordCount: item.wordCount,
        scaffoldRef: item.scaffoldRef,
        errors: item.errors,
        warnings: item.warnings,
      })),
    };

    if (totalErrors > 0) {
      fail({
        exitCode: 11,
        message: "README validation failed",
        output: args.output,
        error: data,
        script: "readme-lint",
      });
    } else {
      succeed({
        output: args.output,
        script: "readme-lint",
        message: "README validation passed",
        ...data,
      });
    }
  } catch (error) {
    fail({
      exitCode: 11,
      message: error.message,
      output: args.output,
      script: "readme-lint",
      error: { stack: error.stack },
    });
  }
})();
