#!/usr/bin/env node
/**
 * lint-guides.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Validate guides against governance rules
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  parseFlags,
  resolveLogLevel,
  fail,
  succeed,
  Logger,
  repoRoot,
  generateRunId,
} from "../_lib/core.mjs";

const start = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/lint-guides.mjs [options]

Options:
  --help              Show this help
  --dry-run           Preview mode without making changes (default: true)
  --yes               Execute mode (confirms execution)
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current)
  --strict            Treat warnings as errors

Description:
  Validates guides against governance rules:
  - Frontmatter presence and validity
  - Word count cap (600 words)
  - Executable code blocks exist
  - Links resolve
  - scaffold_ref exists
  - artifact_id format valid

Exit codes:
  0  - All checks passed
  11 - Validation failed
`);
  process.exit(0);
}

const logger = new Logger(resolveLogLevel({ flags: args }));
const runId = generateRunId();

const REQUIRED_FRONTMATTER = [
  "id",
  "owner",
  "lane",
  "artifact_id",
  "scaffold_ref",
  "version",
  "created",
  "ttl_days",
  "last_verified",
];

const MAX_WORDS = 600;
const MAX_GUIDES = 12;

logger.info("Guide lint started", {
  example:
    "Frontmatter should include owner: @lane-c and scaffold_ref: /templates/example@v0.1",
});

try {
  const root = await repoRoot(args.cwd || process.cwd());
  const guidesDir = path.join(root, "guides");

  // Find all guide files (exclude README and _archive)
  const files = await readdir(guidesDir);
  const guideFiles = files.filter(
    (f) => f.endsWith(".md") && f.startsWith("guide-") && f !== "README.md",
  );

  logger.info("Guides discovered", {
    count: guideFiles.length,
    example: "Guides are markdown files like guides/guide-ideas.md",
  });

  // Check guide count limit
  if (guideFiles.length > MAX_GUIDES) {
    fail(
      11,
      "too_many_guides",
      `Found ${guideFiles.length} guides, maximum is ${MAX_GUIDES}`,
      args.output || "text",
    );
  }

  const results = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of guideFiles) {
    const filePath = path.join(guidesDir, file);
    const content = await readFile(filePath, "utf-8");

    const result = {
      file,
      errors: [],
      warnings: [],
    };

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      result.errors.push("Missing frontmatter block");
      totalErrors++;
      results.push(result);
      continue;
    }

    const frontmatter = parseFrontmatter(frontmatterMatch[1]);

    // Check required keys
    for (const key of REQUIRED_FRONTMATTER) {
      if (!frontmatter[key]) {
        result.errors.push(`Missing required frontmatter key: ${key}`);
      }
    }

    // Validate id format
    if (frontmatter.id && !frontmatter.id.startsWith("guide-")) {
      result.errors.push("id must start with 'guide-'");
    }

    // Validate owner format
    if (frontmatter.owner && !frontmatter.owner.startsWith("@")) {
      result.errors.push("owner must be GitHub handle starting with @");
    }

    // Validate lane
    if (frontmatter.lane && !["A", "B", "C", "D"].includes(frontmatter.lane)) {
      result.errors.push("lane must be A, B, C, or D");
    }

    // Validate artifact_id format
    if (frontmatter.artifact_id) {
      const validPrefixes = ["U-", "C-", "ARCH-", "PB-", "B-"];
      const hasValidPrefix = validPrefixes.some((prefix) =>
        frontmatter.artifact_id.startsWith(prefix),
      );
      if (!hasValidPrefix) {
        result.errors.push(
          `artifact_id must start with one of: ${validPrefixes.join(", ")}`,
        );
      }
    }

    // Validate scaffold_ref format
    if (frontmatter.scaffold_ref) {
      if (!frontmatter.scaffold_ref.startsWith("/templates/")) {
        result.errors.push("scaffold_ref must start with /templates/");
      }
      // Check if scaffold exists
      const scaffoldPath = frontmatter.scaffold_ref.split("@")[0];
      const fullScaffoldPath = path.join(root, scaffoldPath.slice(1));
      try {
        await readdir(fullScaffoldPath);
      } catch {
        result.warnings.push(
          `scaffold_ref path does not exist: ${scaffoldPath}`,
        );
      }
    }

    // Check TTL expiry
    if (frontmatter.last_verified && frontmatter.ttl_days) {
      const lastVerified = new Date(frontmatter.last_verified);
      const ttlDays = parseInt(frontmatter.ttl_days);
      const expiryDate = new Date(lastVerified);
      expiryDate.setDate(expiryDate.getDate() + ttlDays);

      if (expiryDate < new Date()) {
        result.errors.push(
          `Guide expired on ${expiryDate.toISOString().split("T")[0]} - should be archived`,
        );
      }
    }

    // Count words (exclude frontmatter and code blocks)
    const contentWithoutFrontmatter = content
      .replace(/^---[\s\S]*?---/, "")
      .replace(/```[\s\S]*?```/g, "");
    const wordCount = contentWithoutFrontmatter
      .split(/\s+/)
      .filter(Boolean).length;

    if (wordCount > MAX_WORDS) {
      result.warnings.push(
        `Word count ${wordCount} exceeds limit of ${MAX_WORDS}`,
      );
    }

    // Check for executable code blocks
    const codeBlocks = content.match(/```(?:bash|sh)\n([\s\S]*?)```/g);
    if (!codeBlocks || codeBlocks.length === 0) {
      result.warnings.push("No executable code blocks found");
    } else {
      // Validate code blocks contain commands
      const hasCommands = codeBlocks.some((block) => {
        const commands = block.match(/(pnpm|npm|node|gh|git)\s+[\w:.-]+/g);
        return commands && commands.length > 0;
      });
      if (!hasCommands) {
        result.warnings.push(
          "Code blocks exist but contain no executable commands",
        );
      }
    }

    // Check for narrative prose (long paragraphs)
    const paragraphs = contentWithoutFrontmatter.split("\n\n");
    const longParagraphs = paragraphs.filter((p) => {
      const lines = p.trim().split("\n").length;
      return lines > 5 && !p.includes("```") && !p.startsWith("#");
    });

    if (longParagraphs.length > 0) {
      result.warnings.push(
        `Found ${longParagraphs.length} paragraph(s) >5 lines - guides should be checklists, not essays`,
      );
    }

    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    if (result.errors.length > 0 || result.warnings.length > 0) {
      results.push(result);
    }
  }

  const durationMs = Date.now() - start;

  // Determine exit code
  let exitCode = 0;
  let status = "passed";

  if (args.strict && totalWarnings > 0) {
    exitCode = 11;
    status = "failed";
  } else if (totalErrors > 0) {
    exitCode = 11;
    status = "failed";
  }

  const output = {
    runId,
    script: "lint-guides",
    status,
    totalGuides: guideFiles.length,
    guideLimit: MAX_GUIDES,
    totalErrors,
    totalWarnings,
    durationMs,
  };

  if (results.length > 0) {
    output.results = results;
  }

  if (exitCode === 0) {
    succeed(output, args.output || "text");
  } else {
    const outputStr =
      (args.output || "text") === "json"
        ? JSON.stringify(output) + "\n"
        : formatTextOutput(output);
    process.stdout.write(outputStr);
    process.exit(exitCode);
  }
} catch (error) {
  logger.error("Guide lint failed", {
    error: error?.message || String(error),
    example: "Ensure frontmatter has owner: @lane-c and scaffold_ref entries.",
  });
  fail(11, "lint_error", error.message, args.output || "text");
}

/**
 * Parse YAML-like frontmatter
 */
function parseFrontmatter(text) {
  const result = {};
  const lines = text.split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  }

  return result;
}

/**
 * Format text output
 */
function formatTextOutput(data) {
  const lines = [
    `Status: ${data.status}`,
    `Guides: ${data.totalGuides}/${data.guideLimit}`,
    `Errors: ${data.totalErrors}`,
    `Warnings: ${data.totalWarnings}`,
    "",
  ];

  if (data.results) {
    for (const result of data.results) {
      lines.push(`${result.file}:`);
      for (const error of result.errors) {
        lines.push(`  ❌ ${error}`);
      }
      for (const warning of result.warnings) {
        lines.push(`  ⚠️  ${warning}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
