#!/usr/bin/env node
/**
 * Consolidate temporary summary files into CHANGELOG.md
 *
 * Reads all markdown files from _tmp/ folder and consolidates them
 * into CHANGELOG.md with proper versioning and timestamps.
 * Deletes temporary files after successful consolidation.
 *
 * Usage:
 *   node scripts/consolidate-changelog.mjs
 */

import { readdir, readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const TMP_DIR = join(ROOT, "_tmp");
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const PACKAGE_JSON = join(ROOT, "package.json");

/**
 * Get current version from package.json
 */
async function getCurrentVersion() {
  try {
    const pkg = JSON.parse(await readFile(PACKAGE_JSON, "utf-8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Read existing changelog
 */
async function readExistingChangelog() {
  if (existsSync(CHANGELOG)) {
    return await readFile(CHANGELOG, "utf-8");
  }
  return "";
}

/**
 * Get all summary files from _tmp directory
 */
async function getSummaryFiles() {
  if (!existsSync(TMP_DIR)) {
    return [];
  }

  const files = await readdir(TMP_DIR);
  return files
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => join(TMP_DIR, f));
}

/**
 * Parse summary file into structured data
 */
async function parseSummaryFile(filePath) {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");

  // Extract title from first heading
  const titleLine = lines.find((line) => line.startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s*/, "").trim() : "Changes";

  return {
    title,
    content: content.trim(),
    file: filePath.split("/").pop(),
    filePath, // Keep full path for deletion
  };
}

/**
 * Generate changelog entry
 */
function generateChangelogEntry(version, date, summaries) {
  let entry = `## [${version}] - ${date}\n\n`;

  summaries.forEach((summary) => {
    entry += `### ${summary.title}\n\n`;
    // Remove the title from content since we're using it as a header
    const contentWithoutTitle = summary.content
      .replace(/^#\s+.*\n\n?/, "")
      .trim();
    entry += `${contentWithoutTitle}\n\n`;
  });

  return entry;
}

/**
 * Insert new entry into changelog
 */
function insertIntoChangelog(existingChangelog, newEntry) {
  if (!existingChangelog) {
    return `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${newEntry}`;
  }

  // Find the position after the header
  const lines = existingChangelog.split("\n");
  let insertIndex = 0;

  // Skip past the main heading and description
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## [")) {
      insertIndex = i;
      break;
    }
  }

  if (insertIndex === 0) {
    // No existing entries, append after header
    return `${existingChangelog}\n\n${newEntry}`;
  }

  // Insert before first existing entry
  const before = lines.slice(0, insertIndex).join("\n");
  const after = lines.slice(insertIndex).join("\n");
  return `${before}\n${newEntry}\n${after}`;
}

/**
 * Main execution
 */
async function main() {
  console.log("📝 Changelog Consolidator\n");

  // Get summary files
  const summaryFiles = await getSummaryFiles();

  if (summaryFiles.length === 0) {
    console.log("⚠️  No summary files found in /_tmp folder");
    console.log("💡 Create summary files in /_tmp to consolidate");
    return;
  }

  console.log(`Found ${summaryFiles.length} summary files:`);
  summaryFiles.forEach((f) => console.log(`  - ${f.split("/").pop()}`));
  console.log();

  // Parse all summaries
  const summaries = await Promise.all(
    summaryFiles.map((f) => parseSummaryFile(f)),
  );

  // Get version and date
  const version = await getCurrentVersion();
  const date = getCurrentDate();

  console.log(`Version: ${version}`);
  console.log(`Date: ${date}\n`);

  // Read existing changelog
  const existingChangelog = await readExistingChangelog();

  // Generate new entry
  const newEntry = generateChangelogEntry(version, date, summaries);

  // Insert into changelog
  const updatedChangelog = insertIntoChangelog(existingChangelog, newEntry);

  // Write changelog
  await writeFile(CHANGELOG, updatedChangelog);

  console.log(`✅ Updated ${CHANGELOG}`);
  console.log(`\n📋 Consolidated ${summaries.length} summaries:`);
  summaries.forEach((s) => console.log(`   - ${s.title}`));

  // Delete temporary files after successful consolidation
  console.log(`\n�️  Cleaning up temporary files...`);
  for (const summary of summaries) {
    try {
      await unlink(summary.filePath);
      console.log(`   ✓ Deleted ${summary.filePath.split("/").pop()}`);
    } catch (err) {
      console.warn(
        `   ⚠ Could not delete ${summary.filePath.split("/").pop()}: ${err.message}`,
      );
    }
  }

  console.log(`\n✅ Changelog consolidation complete!`);
  console.log(`   Review ${CHANGELOG} and commit the changes`);
}

main().catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
