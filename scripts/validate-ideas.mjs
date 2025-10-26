#!/usr/bin/env node

/**
 * Ideas Validator
 *
 * Validates idea files against required structure and naming conventions.
 *
 * Usage:
 *   node scripts/validate-ideas.mjs                 # Validate all
 *   node scripts/validate-ideas.mjs U-bridge.md     # Validate specific file
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const IDEAS_DIR = "ideas";

/**
 * Validation rules for idea files
 */
const VALIDATION_RULES = {
  unit: {
    requiredSections: [
      "Lane",
      "Contracts",
      "Props + Shape",
      "Behaviors",
      "Acceptance Checklist",
    ],
    filenamePattern: /^U-[\w-]+\.md$/,
  },
  composition: {
    requiredSections: [
      "Lane",
      "Metric Hypothesis",
      "Units In Scope",
      "Acceptance Checklist",
    ],
    filenamePattern: /^C-[\w-]+\.md$/,
  },
  bug: {
    requiredSections: ["Lane", "Expected Behavior", "Actual Behavior", "Steps"],
    filenamePattern: /^B-[\w-]+\.md$/,
  },
};

/**
 * Validate single idea file
 */
async function validateIdeaFile(filePath) {
  const filename = filePath.split("/").pop();
  const errors = [];
  const warnings = [];

  try {
    const content = await readFile(filePath, "utf-8");

    // Determine file type
    let type = null;
    if (filename.startsWith("U-")) type = "unit";
    else if (filename.startsWith("C-")) type = "composition";
    else if (filename.startsWith("B-")) type = "bug";

    if (!type) {
      errors.push("Filename must start with U-, C-, or B-");
      return { filename, valid: false, errors, warnings };
    }

    // Validate filename pattern
    const rules = VALIDATION_RULES[type];
    if (!rules.filenamePattern.test(filename)) {
      errors.push(
        `Filename doesn't match pattern: ${rules.filenamePattern.source}`,
      );
    }

    // Check for title
    if (!content.match(/^#\s+.+$/m)) {
      errors.push("Missing top-level heading (# Title)");
    }

    // Check for required sections
    for (const section of rules.requiredSections) {
      const sectionRegex = new RegExp(`^##\\s+${section}`, "m");
      if (!sectionRegex.test(content)) {
        errors.push(`Missing required section: ${section}`);
      }
    }

    // Check for lane specification
    const laneMatch = content.match(/Lane:\s*([A-D])/i);
    if (!laneMatch) {
      errors.push("Missing or invalid Lane specification (A, B, C, or D)");
    }

    // Check for acceptance checklist items
    const checklistMatch = content.match(
      /## Acceptance Checklist\s*([\s\S]*?)(?=\n##|\n$)/,
    );
    if (checklistMatch) {
      const items = checklistMatch[1]
        .split("\n")
        .filter((line) => line.trim().startsWith("- [ ]"));

      if (items.length === 0) {
        warnings.push("Acceptance Checklist is empty");
      } else if (items.length < 3) {
        warnings.push(
          `Acceptance Checklist has only ${items.length} item(s) (consider adding more)`,
        );
      }
    }

    // Check for ticket ID in title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      const title = titleMatch[1];
      const ticketPrefix = filename.substring(0, filename.indexOf("-") + 1);
      if (!title.includes(ticketPrefix)) {
        warnings.push(
          `Title doesn't include ticket ID prefix (${ticketPrefix})`,
        );
      }
    }

    return {
      filename,
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`Failed to read file: ${error.message}`);
    return { filename, valid: false, errors, warnings };
  }
}

/**
 * Get list of idea files to validate
 */
async function getIdeaFiles(filter = null) {
  try {
    const files = await readdir(IDEAS_DIR);
    const ideaFiles = files.filter((f) => f.endsWith(".md"));

    if (filter) {
      return ideaFiles.filter((f) => f === filter || f.includes(filter));
    }

    return ideaFiles;
  } catch (error) {
    console.error(`❌ Failed to read ideas directory: ${error.message}`);
    return [];
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const filter = args.find((arg) => !arg.startsWith("--"));

  console.log("🔍 Ideas Validator\n");

  const ideaFiles = await getIdeaFiles(filter);

  if (ideaFiles.length === 0) {
    console.log("ℹ️  No idea files found");
    process.exit(0);
  }

  console.log(`Validating ${ideaFiles.length} file(s)...\n`);

  const results = {
    total: 0,
    valid: 0,
    invalid: 0,
    errors: [],
  };

  for (const filename of ideaFiles) {
    const filePath = join(IDEAS_DIR, filename);
    const result = await validateIdeaFile(filePath);

    results.total++;

    if (result.valid) {
      results.valid++;
      console.log(`✅ ${filename}`);
    } else {
      results.invalid++;
      console.log(`❌ ${filename}`);
      result.errors.forEach((err) => console.log(`   - ${err}`));
      results.errors.push({
        file: filename,
        message: result.errors.join("; "),
      });
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warn) => console.log(`   ⚠️  ${warn}`));
    }
  }

  // Write JSON report for CI
  await writeFile(
    "/tmp/ideas-validation.json",
    JSON.stringify(results, null, 2),
  );

  console.log("\n📊 Summary:");
  console.log(`   Total: ${results.total}`);
  console.log(`   Valid: ${results.valid}`);
  console.log(`   Invalid: ${results.invalid}`);

  if (results.invalid > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
