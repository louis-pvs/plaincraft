#!/usr/bin/env node
/**
 * dedupe-guides.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Detect duplicate content across guides using rolling hash similarity
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
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
Usage: node scripts/checks/dedupe-guides.mjs [options]

Options:
  --help              Show this help
  --dry-run           Preview mode without making changes (default: true)
  --yes               Execute mode (confirms execution)
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current)
  --threshold <n>     Similarity threshold percentage (default: 30)

Description:
  Detects near-duplicate content across guides using rolling hash similarity.
  Blocks guides with >30% similarity to enforce DRY principle.

Exit codes:
  0  - No duplicates found
  11 - Duplicates detected above threshold
`);
  process.exit(0);
}

const logger = new Logger(resolveLogLevel({ flags: args }));
const runId = generateRunId();
const SIMILARITY_THRESHOLD = parseInt(args.threshold) || 30;

logger.info("Guide deduplication check started", {
  threshold: SIMILARITY_THRESHOLD,
  example:
    "Aim for unique content per guide; consolidate duplicates into docs/overview.md.",
});

try {
  const root = await repoRoot(args.cwd || process.cwd());
  const guidesDir = path.join(root, "guides");

  // Find all guide files
  const files = await readdir(guidesDir);
  const guideFiles = files.filter(
    (f) => f.endsWith(".md") && f.startsWith("guide-"),
  );

  logger.info("Loaded guides", {
    count: guideFiles.length,
    example: "Example guide: guides/guide-ideas.md",
  });

  const guides = [];

  // Read and normalize all guides
  for (const file of guideFiles) {
    const filePath = path.join(guidesDir, file);
    const content = await readFile(filePath, "utf-8");

    // Remove frontmatter and code blocks for comparison
    const normalized = content
      .replace(/^---[\s\S]*?---/, "")
      .replace(/```[\s\S]*?```/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    guides.push({
      file,
      content: normalized,
      shingles: generateShingles(normalized, 5),
    });
  }

  // Compare all pairs
  const duplicates = [];

  for (let i = 0; i < guides.length; i++) {
    for (let j = i + 1; j < guides.length; j++) {
      const similarity = calculateSimilarity(
        guides[i].shingles,
        guides[j].shingles,
      );

      if (similarity >= SIMILARITY_THRESHOLD) {
        duplicates.push({
          file1: guides[i].file,
          file2: guides[j].file,
          similarity: Math.round(similarity),
        });
      }
    }
  }

  const durationMs = Date.now() - start;

  const output = {
    runId,
    script: "dedupe-guides",
    status: duplicates.length === 0 ? "passed" : "failed",
    totalGuides: guideFiles.length,
    threshold: SIMILARITY_THRESHOLD,
    duplicatesFound: duplicates.length,
    durationMs,
  };

  if (duplicates.length > 0) {
    output.duplicates = duplicates;
    const outputStr =
      (args.output || "text") === "json"
        ? JSON.stringify(output) + "\n"
        : formatTextOutput(output);
    process.stdout.write(outputStr);
    process.exit(11);
  }

  succeed(output, args.output || "text");
} catch (error) {
  logger.error("Guide deduplication failed", {
    error: error?.message || String(error),
    example: "Keep a single canonical guide and link alternatives to it.",
  });
  fail({
    exitCode: 11,
    script: "dedupe-guides",
    message: "Guide deduplication failed",
    error: error?.message || String(error),
    output: args.output || "text",
  });
}

/**
 * Generate word shingles (n-grams)
 */
function generateShingles(text, n = 5) {
  const words = text.split(/\s+/);
  const shingles = new Set();

  for (let i = 0; i <= words.length - n; i++) {
    const shingle = words.slice(i, i + n).join(" ");
    const hash = createHash("md5").update(shingle).digest("hex");
    shingles.add(hash);
  }

  return shingles;
}

/**
 * Calculate Jaccard similarity between two sets
 */
function calculateSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;

  return (intersection.size / union.size) * 100;
}

/**
 * Format text output
 */
function formatTextOutput(data) {
  const lines = [
    `Status: ${data.status}`,
    `Threshold: ${data.threshold}%`,
    `Duplicates found: ${data.duplicatesFound}`,
    "",
  ];

  if (data.duplicates) {
    lines.push("Similar guides detected:");
    for (const dup of data.duplicates) {
      lines.push(`  ${dup.file1} ↔ ${dup.file2}: ${dup.similarity}% similar`);
    }
    lines.push("");
    lines.push(
      "Action required: Merge or archive one of each pair to maintain DRY principle.",
    );
  }

  return lines.join("\n");
}
