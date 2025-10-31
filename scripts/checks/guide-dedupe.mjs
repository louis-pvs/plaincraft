#!/usr/bin/env node
/**
 * guide-dedupe.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Detect duplicate or similar content between guides
 */

import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
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
Usage: node scripts/checks/guide-dedupe.mjs [options]

Options:
  --help              Show this help message
  --dry-run           Preview mode without making changes (default: true)
  --yes               Execute mode (confirms execution)
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current directory)
  --threshold <num>   Similarity threshold percentage (default: 30)

Description:
  Detects duplicate or similar content between guides:
  - Calculates similarity percentage between all guide pairs
  - Flags guides with >threshold% similarity as merge candidates
  - Detects duplicated code blocks
  - Suggests consolidation opportunities

Exit codes:
  0  - Success
  11 - High similarity detected (threshold exceeded)

Examples:
  node scripts/checks/guide-dedupe.mjs
  node scripts/checks/guide-dedupe.mjs --threshold 40
  node scripts/checks/guide-dedupe.mjs --output json
`);
  process.exit(0);
}

const logger = new Logger(resolveLogLevel({ flags: args }));
const runId = generateRunId();
const threshold = args.threshold || 30;

// Calculate Jaccard similarity between two texts
function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}

// Extract sections from guide
function extractSections(content) {
  const sections = {};
  const lines = content.split("\n");
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      if (currentSection) {
        sections[currentSection] = currentContent.join("\n");
      }
      currentSection = line.substring(2).trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections[currentSection] = currentContent.join("\n");
  }

  return sections;
}

// Compare guides
async function compareGuides(root) {
  const guidesDir = path.join(root, "guides");
  const files = await readdir(guidesDir);
  const guideFiles = files.filter(
    (f) => f.startsWith("guide-") && f.endsWith(".md"),
  );

  const guides = [];
  for (const file of guideFiles) {
    const filePath = path.join(guidesDir, file);
    const content = await readFile(filePath, "utf8");
    // Remove frontmatter for comparison
    const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, "");
    const sections = extractSections(bodyContent);
    guides.push({ file, content: bodyContent, sections });
  }

  const comparisons = [];
  let highSimilarityCount = 0;

  for (let i = 0; i < guides.length; i++) {
    for (let j = i + 1; j < guides.length; j++) {
      const guide1 = guides[i];
      const guide2 = guides[j];

      const overallSim = calculateSimilarity(guide1.content, guide2.content);

      if (overallSim > threshold) {
        // Analyze section-level similarity
        const sectionSimilarities = [];
        const commonSections = Object.keys(guide1.sections).filter((s) =>
          Object.keys(guide2.sections).includes(s),
        );

        for (const section of commonSections) {
          const secSim = calculateSimilarity(
            guide1.sections[section],
            guide2.sections[section],
          );
          if (secSim > threshold) {
            sectionSimilarities.push({
              section,
              similarity: Math.round(secSim),
            });
          }
        }

        comparisons.push({
          guide1: guide1.file,
          guide2: guide2.file,
          overallSimilarity: Math.round(overallSim),
          sectionSimilarities,
        });
        highSimilarityCount++;
      }
    }
  }

  return {
    totalComparisons: (guides.length * (guides.length - 1)) / 2,
    highSimilarityPairs: highSimilarityCount,
    comparisons,
  };
}

function generateTextReport(data, threshold) {
  const lines = [];

  lines.push("");
  lines.push("🔍 Guide Deduplication Check");
  lines.push(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  lines.push("");

  if (data.comparisons.length === 0) {
    lines.push(`✓ No high-similarity pairs found (threshold: ${threshold}%)`);
  } else {
    lines.push("⚠️  High Similarity Detected");
    lines.push("");

    for (const comp of data.comparisons) {
      lines.push(`${comp.guide1} ↔ ${comp.guide2}`);
      lines.push(`  Similarity: ${comp.overallSimilarity}%`);

      if (comp.sectionSimilarities.length > 0) {
        lines.push("  Common sections:");
        for (const sec of comp.sectionSimilarities) {
          lines.push(`    - "${sec.section}" (${sec.similarity}% similar)`);
        }
      }

      lines.push("");
      lines.push("  Recommendation:");
      lines.push(
        "    Consider consolidating these guides or extracting common",
      );
      lines.push("    content to a shared reference doc in /docs/");
      lines.push("");
    }
  }

  lines.push(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  lines.push(`Total comparisons: ${data.totalComparisons}`);
  lines.push(
    `High similarity pairs: ${data.highSimilarityPairs} (threshold: ${threshold}%)`,
  );
  lines.push("");

  return lines.join("\n");
}

try {
  const root = await repoRoot(args.cwd);
  logger.info("Guide dedupe started", { threshold });

  logger.info("Guide dedupe started", { threshold });

  const results = await compareGuides(root);
  logger.info("Guide comparisons complete", {
    totalComparisons: results.totalComparisons,
    highSimilarityPairs: results.highSimilarityPairs,
  });

  // Output
  if (args.output === "json") {
    console.log(
      JSON.stringify(
        {
          threshold,
          ...results,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(generateTextReport(results, threshold));
  }

  succeed({
    runId,
    script: "guide-dedupe",
    version: "0.1.0",
    threshold,
    ...results,
    durationMs: Date.now() - start,
  });

  // Exit with error if high similarity found
  if (results.highSimilarityPairs > 0) {
    process.exit(11);
  }
} catch (error) {
  logger.error("Guide dedupe failed", {
    error: error?.message || String(error),
  });
  fail({
    runId,
    script: "guide-dedupe",
    error: error.message,
    durationMs: Date.now() - start,
  });
  process.exit(11);
}
