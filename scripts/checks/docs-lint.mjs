#!/usr/bin/env node
/**
 * docs-lint.mjs
 * @since 2025-10-28
 * @version 1.0.0
 * Summary: Validate guide compliance with documentation governance rules
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";

const GUIDES_DIR = path.join(process.cwd(), "guides");
const TEMPLATES_DIR = path.join(process.cwd(), "templates");
const WORD_LIMIT = 600;
const GUIDE_LIMIT = 12;
const REQUIRED_FRONTMATTER_KEYS = [
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

/**
 * Parse CLI arguments
 */
function parseFlags() {
  const { values } = parseArgs({
    options: {
      files: { type: "string", multiple: true },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(`
docs-lint.mjs - Validate guide compliance

USAGE:
  node scripts/checks/docs-lint.mjs [OPTIONS]

OPTIONS:
  --files <file>...  Check specific files (can be repeated)
  --json             Output JSON format
  --help             Show this help

EXAMPLES:
  node scripts/checks/docs-lint.mjs
  node scripts/checks/docs-lint.mjs --files guide-workflow.md
  node scripts/checks/docs-lint.mjs --json

EXIT CODES:
  0  - All checks passed
  11 - Validation failed (lint errors)
`);
    process.exit(0);
  }

  return values;
}

/**
 * Extract frontmatter from markdown content
 */
function extractFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = {};
  const lines = frontmatterMatch[1].split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      frontmatter[key] = value.trim();
    }
  }

  return frontmatter;
}

/**
 * Count words in markdown content (excluding frontmatter and code blocks)
 */
function countWords(content) {
  // Remove frontmatter
  let text = content.replace(/^---\n[\s\S]*?\n---\n/, "");

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, "");

  // Remove inline code
  text = text.replace(/`[^`]+`/g, "");

  // Remove markdown syntax
  text = text.replace(/[#*_[\]()]/g, "");

  // Count words
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return words.length;
}

/**
 * Detect essay patterns (paragraphs > 5 lines)
 */
function detectEssayPatterns(content) {
  // Remove frontmatter
  let text = content.replace(/^---\n[\s\S]*?\n---\n/, "");

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, "");

  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/);

  const longParagraphs = [];
  for (const para of paragraphs) {
    const lines = para
      .trim()
      .split("\n")
      .filter((l) => l.trim().length > 0);
    if (lines.length > 5) {
      longParagraphs.push({
        lines: lines.length,
        preview: para.substring(0, 50) + "...",
      });
    }
  }

  return longParagraphs;
}

/**
 * Check if scaffold_ref points to existing template
 */
function validateScaffoldRef(scaffoldRef) {
  if (!scaffoldRef) {
    return { valid: false, error: "scaffold_ref is missing" };
  }

  // Parse scaffold_ref format: /templates/name@version or /templates/name
  const match = scaffoldRef.match(/^\/templates\/([^@]+)(@.+)?$/);
  if (!match) {
    return {
      valid: false,
      error: "scaffold_ref must be in format /templates/<name>[@version]",
    };
  }

  const templateName = match[1];
  const templatePath = path.join(TEMPLATES_DIR, templateName);

  if (!existsSync(templatePath)) {
    return {
      valid: false,
      error: `Template directory does not exist: ${templatePath}`,
    };
  }

  return { valid: true };
}

/**
 * Check if TTL has expired
 */
function checkTTL(created, ttlDays) {
  if (!created || !ttlDays) {
    return { expired: false, remaining: null };
  }

  const createdDate = new Date(created);
  const expiryDate = new Date(createdDate);
  expiryDate.setDate(expiryDate.getDate() + parseInt(ttlDays));

  const now = new Date();
  const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

  return {
    expired: daysRemaining <= 0,
    remaining: daysRemaining,
    expiryDate: expiryDate.toISOString().split("T")[0],
  };
}

/**
 * Validate a single guide file
 */
async function validateGuide(filePath) {
  const errors = [];
  const warnings = [];

  try {
    const content = await readFile(filePath, "utf-8");

    // Check 1: Frontmatter presence
    const frontmatter = extractFrontmatter(content);
    if (!frontmatter) {
      errors.push("Missing frontmatter block");
      return { errors, warnings }; // Can't continue without frontmatter
    }

    // Check 2: Required keys
    for (const key of REQUIRED_FRONTMATTER_KEYS) {
      if (!frontmatter[key]) {
        errors.push(`Missing required frontmatter key: ${key}`);
      }
    }

    // Check 3: ID format
    if (frontmatter.id && !frontmatter.id.startsWith("guide-")) {
      errors.push(`ID must start with "guide-": ${frontmatter.id}`);
    }

    // Check 4: scaffold_ref validation
    if (frontmatter.scaffold_ref) {
      const scaffoldCheck = validateScaffoldRef(frontmatter.scaffold_ref);
      if (!scaffoldCheck.valid) {
        errors.push(scaffoldCheck.error);
      }
    }

    // Check 5: TTL expiration
    const ttlCheck = checkTTL(frontmatter.created, frontmatter.ttl_days);
    if (ttlCheck.expired) {
      errors.push(
        `TTL expired (expired on ${ttlCheck.expiryDate}, ${Math.abs(ttlCheck.remaining)} days ago)`,
      );
    } else if (ttlCheck.remaining !== null && ttlCheck.remaining <= 14) {
      warnings.push(
        `TTL expiring soon (${ttlCheck.remaining} days remaining, expires ${ttlCheck.expiryDate})`,
      );
    }

    // Check 6: Word count
    const wordCount = countWords(content);
    if (wordCount > WORD_LIMIT) {
      errors.push(`Word count exceeds limit: ${wordCount}/${WORD_LIMIT} words`);
    }

    // Check 7: Essay patterns
    const longParagraphs = detectEssayPatterns(content);
    if (longParagraphs.length > 0) {
      warnings.push(
        `Found ${longParagraphs.length} paragraph(s) >5 lines (consider breaking into lists/steps)`,
      );
    }

    // Check 8: Executable code blocks
    const codeBlocks = content.match(/```bash\n([\s\S]*?)```/g);
    if (codeBlocks) {
      for (const block of codeBlocks) {
        const commands = block.match(/```bash\n([\s\S]*?)```/)[1].trim();
        if (commands.includes("TODO") || commands.includes("[TODO]")) {
          warnings.push("Found TODO placeholders in code blocks");
        }
      }
    }

    return { errors, warnings, wordCount, ttl: ttlCheck };
  } catch (error) {
    errors.push(`Failed to read file: ${error.message}`);
    return { errors, warnings };
  }
}

/**
 * Get all guide files
 */
async function getGuideFiles(specificFiles = null) {
  if (specificFiles && specificFiles.length > 0) {
    return specificFiles.map((f) => path.join(GUIDES_DIR, f));
  }

  const files = await readdir(GUIDES_DIR);
  const guideFiles = [];

  for (const file of files) {
    if (file.startsWith("guide-") && file.endsWith(".md")) {
      guideFiles.push(path.join(GUIDES_DIR, file));
    }
  }

  return guideFiles;
}

/**
 * Main execution
 */
async function main() {
  const args = parseFlags();

  try {
    const guideFiles = await getGuideFiles(args.files);
    const results = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    // Validate each guide
    for (const filePath of guideFiles) {
      const fileName = path.basename(filePath);
      const result = await validateGuide(filePath);

      results.push({
        file: fileName,
        errors: result.errors || [],
        warnings: result.warnings || [],
        wordCount: result.wordCount,
        ttl: result.ttl,
      });

      totalErrors += (result.errors || []).length;
      totalWarnings += (result.warnings || []).length;
    }

    // Check guide count limit
    const totalGuides = guideFiles.length;
    if (totalGuides > GUIDE_LIMIT) {
      totalErrors++;
      results.push({
        file: "LIMIT_CHECK",
        errors: [
          `Guide count exceeds limit: ${totalGuides}/${GUIDE_LIMIT} guides`,
        ],
        warnings: [],
      });
    }

    const ok = totalErrors === 0;

    // Output
    if (args.json) {
      console.log(
        JSON.stringify(
          {
            ok,
            totalGuides,
            guideLimit: GUIDE_LIMIT,
            totalErrors,
            totalWarnings,
            results,
          },
          null,
          2,
        ),
      );
    } else {
      console.log("\n📝 Documentation Governance - Guide Linting");
      console.log("═".repeat(60));
      console.log(
        `\nTotal Guides: ${totalGuides}/${GUIDE_LIMIT} (${Math.round((totalGuides / GUIDE_LIMIT) * 100)}% capacity)`,
      );
      console.log(`Total Errors: ${totalErrors}`);
      console.log(`Total Warnings: ${totalWarnings}\n`);

      for (const result of results) {
        if (result.errors.length === 0 && result.warnings.length === 0) {
          console.log(`✓ ${result.file}`);
          if (result.wordCount) {
            console.log(
              `  Words: ${result.wordCount}/${WORD_LIMIT} (${Math.round((result.wordCount / WORD_LIMIT) * 100)}% capacity)`,
            );
          }
        } else {
          console.log(
            `\n${result.errors.length > 0 ? "✗" : "⚠"} ${result.file}`,
          );

          if (result.wordCount) {
            console.log(
              `  Words: ${result.wordCount}/${WORD_LIMIT} (${Math.round((result.wordCount / WORD_LIMIT) * 100)}% capacity)`,
            );
          }

          if (result.errors.length > 0) {
            console.log("\n  Errors:");
            for (const error of result.errors) {
              console.log(`    • ${error}`);
            }
          }

          if (result.warnings.length > 0) {
            console.log("\n  Warnings:");
            for (const warning of result.warnings) {
              console.log(`    • ${warning}`);
            }
          }
        }
      }

      console.log("\n" + "═".repeat(60));
      if (ok) {
        console.log("✓ All checks passed\n");
      } else {
        console.log(
          `✗ ${totalErrors} error(s) found - guide compliance violated\n`,
        );
      }
    }

    process.exit(ok ? 0 : 11);
  } catch (error) {
    if (args.json) {
      console.error(
        JSON.stringify({
          ok: false,
          error: error.message,
        }),
      );
    } else {
      console.error(`\n✗ Error: ${error.message}\n`);
    }
    process.exit(11);
  }
}

main();
