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
const IDEAS_DIR = join(ROOT, "ideas");
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
 * Find idea file for a given PR title or issue number
 * Tries multiple strategies to locate the corresponding idea file
 */
async function findIdeaFileForPR(prTitle) {
  if (!existsSync(IDEAS_DIR)) {
    return null;
  }

  const files = await readdir(IDEAS_DIR);
  const ideaFiles = files.filter((f) => f.endsWith(".md"));

  // Strategy 1: Extract tag from PR title (e.g., "[U-button] Add button component")
  const tagMatch = prTitle.match(/^\[([A-Z]+-[a-z-]+)\]/);
  if (tagMatch) {
    const tag = tagMatch[1];
    const exactMatch = ideaFiles.find(
      (f) => f.toLowerCase() === `${tag.toLowerCase()}.md`,
    );
    if (exactMatch) {
      return join(IDEAS_DIR, exactMatch);
    }
  }

  // Strategy 2: Fuzzy match on PR title words
  const titleWords = prTitle
    .toLowerCase()
    .replace(/^\[.*?\]\s*/, "") // Remove tag
    .split(/[\s-]+/)
    .filter((w) => w.length > 3); // Skip short words

  for (const file of ideaFiles) {
    const fileName = file.toLowerCase();
    const matchCount = titleWords.filter((word) =>
      fileName.includes(word),
    ).length;
    if (matchCount >= 2) {
      // At least 2 words match
      return join(IDEAS_DIR, file);
    }
  }

  return null;
}

/**
 * Parse idea file and extract changelog-relevant content
 */
async function parseIdeaFile(filePath) {
  const content = await readFile(filePath, "utf-8");

  // Extract title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "Changes";

  // Extract Purpose
  const purposeMatch = content.match(/Purpose:\s*(.+?)(?:\n|$)/);
  const purpose = purposeMatch ? purposeMatch[1].trim() : null;

  // Extract Problem section
  const problemMatch = content.match(/## Problem\s*([\s\S]*?)(?=\n##|\n$)/);
  const problem = problemMatch ? problemMatch[1].trim() : null;

  // Extract Acceptance Checklist
  const checklistMatch = content.match(
    /## Acceptance Checklist\s*([\s\S]*?)(?=\n##|\n$)/,
  );
  const checklist = checklistMatch
    ? checklistMatch[1]
        .split("\n")
        .filter((line) => line.trim().startsWith("- ["))
        .map((line) => line.replace(/^-\s*\[.\]\s*/, "").trim())
    : [];

  return {
    title,
    purpose,
    problem,
    checklist,
    filePath,
  };
}

/**
 * Generate changelog entry from idea file
 */
function generateChangelogFromIdea(ideaData) {
  let entry = `### ${ideaData.title}\n\n`;

  if (ideaData.purpose) {
    entry += `**Purpose:** ${ideaData.purpose}\n\n`;
  }

  if (ideaData.problem && ideaData.problem.length < 300) {
    // Include short problem descriptions
    entry += `${ideaData.problem}\n\n`;
  }

  if (ideaData.checklist && ideaData.checklist.length > 0) {
    entry += `**Changes:**\n\n`;
    ideaData.checklist.forEach((item) => {
      entry += `- ${item}\n`;
    });
    entry += `\n`;
  }

  return entry.trim();
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

function splitSections(entry) {
  const lines = entry.split("\n");
  const header = lines[0];
  const body = lines.slice(1).join("\n");
  const sections = body
    .split(/\n(?=###\s+)/)
    .map((section) => section.trim())
    .filter(Boolean);
  return { header, sections };
}

function combineSection(existingSection, incomingSection) {
  const [existingHeading, ...existingBodyLines] = existingSection.split("\n");
  const existingBody = existingBodyLines.join("\n").trim();

  const incomingLines = incomingSection.split("\n");
  incomingLines.shift();
  const incomingBody = incomingLines.join("\n").trim();

  if (!incomingBody) {
    return existingSection.trim();
  }

  if (!existingBody) {
    return `${existingHeading}\n\n${incomingBody}`.trim();
  }

  if (existingBody.includes(incomingBody)) {
    return existingSection.trim();
  }

  return `${existingHeading}\n\n${existingBody}\n\n${incomingBody}`.trim();
}

function mergeVersionEntries(existingEntry, incomingEntry) {
  const { header, sections: existingSections } = splitSections(existingEntry);
  const { sections: incomingSections } = splitSections(incomingEntry);

  const sectionMap = new Map();

  existingSections.forEach((section) => {
    const heading = section.split("\n")[0];
    sectionMap.set(heading, section);
  });

  incomingSections.forEach((section) => {
    const heading = section.split("\n")[0];
    if (sectionMap.has(heading)) {
      const combined = combineSection(sectionMap.get(heading), section);
      sectionMap.set(heading, combined);
    } else {
      sectionMap.set(heading, section.trim());
    }
  });

  const mergedBody = Array.from(sectionMap.values())
    .map((section) => section.trim())
    .filter(Boolean)
    .join("\n\n");

  return mergedBody ? `${header}\n\n${mergedBody}\n` : `${header}\n`;
}

function deduplicateVersions(changelog) {
  if (!changelog) {
    return "";
  }

  const firstVersionIndex = changelog.indexOf("## [");
  if (firstVersionIndex === -1) {
    return changelog;
  }

  const header = changelog.slice(0, firstVersionIndex).trimEnd();
  const entriesText = changelog.slice(firstVersionIndex);
  const blocks = entriesText
    .split(/\n(?=## \[)/)
    .map((block) => block.trim())
    .filter(Boolean);

  const order = [];
  const versionMap = new Map();

  blocks.forEach((block) => {
    const match = block.match(/^## \[([^\]]+)]/);
    if (!match) {
      return;
    }
    const version = match[1];
    if (!versionMap.has(version)) {
      versionMap.set(version, block);
      order.push(version);
    } else {
      console.warn(
        `\n⚠️  Duplicate changelog entry detected for version [${version}] — merging sections.`,
      );
      const merged = mergeVersionEntries(versionMap.get(version), block);
      versionMap.set(version, merged.trim());
    }
  });

  const mergedEntries = order
    .map((version) => versionMap.get(version).trim())
    .join("\n\n");

  return `${header.trim()}\n\n${mergedEntries}\n`;
}

/**
 * Insert new entry into changelog
 * Prevents duplicate version entries
 */
function insertIntoChangelog(existingChangelog, newEntry, version) {
  if (!existingChangelog) {
    return `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${newEntry}`;
  }

  // Ensure existing changelog is deduplicated before insertion
  let sanitizedChangelog = deduplicateVersions(existingChangelog);

  const versionPattern = new RegExp(
    `^## \\[${version.replace(/\./g, "\\.")}\\]`,
    "m",
  );

  if (versionPattern.test(sanitizedChangelog)) {
    console.warn(
      `\n⚠️  Warning: Version [${version}] already exists in CHANGELOG.md`,
    );
    console.warn(`   Merging new sections into existing version entry...\n`);

    const blockRegex = new RegExp(
      `## \\[${version.replace(/\./g, "\\.")}\\][\\s\\S]*?(?=\n## \\[|$)`,
      "m",
    );
    const match = sanitizedChangelog.match(blockRegex);

    if (match) {
      const mergedBlock = mergeVersionEntries(match[0], newEntry).trim();
      const updated = sanitizedChangelog.replace(
        blockRegex,
        `${mergedBlock}\n`,
      );
      return deduplicateVersions(updated).trimEnd() + "\n";
    }

    // Fallback: append entry if block not found
    return `${sanitizedChangelog.trimEnd()}\n\n${newEntry}`;
  }

  const lines = sanitizedChangelog.split("\n");
  let insertIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## [")) {
      insertIndex = i;
      break;
    }
  }

  if (insertIndex === 0) {
    return `${sanitizedChangelog.trimEnd()}\n\n${newEntry}`;
  }

  const before = lines.slice(0, insertIndex).join("\n");
  const after = lines.slice(insertIndex).join("\n");
  const combined = `${before}\n${newEntry}\n${after}`;
  return deduplicateVersions(combined).trimEnd() + "\n";
}

/**
 * Main execution
 */
async function main() {
  console.log("📝 Changelog Consolidator\n");

  // Get summary files (legacy _tmp/ workflow)
  const summaryFiles = await getSummaryFiles();

  // Check for _tmp/ folder usage (legacy workflow)
  if (summaryFiles.length > 0) {
    console.log(
      "⚠️  Warning: Using legacy _tmp/ folder workflow. Consider using idea files instead.",
    );
    console.log(`Found ${summaryFiles.length} summary files in _tmp/:\n`);
    summaryFiles.forEach((f) => console.log(`  - ${f.split("/").pop()}`));
    console.log();
  }

  // Try to find idea files for changelog generation
  // This is the new preferred workflow
  const ideaSummaries = [];

  // For now, we'll keep the _tmp/ workflow functional
  // Future enhancement: Query GitHub for recently merged PRs and find their idea files

  if (summaryFiles.length === 0 && ideaSummaries.length === 0) {
    console.log("ℹ️  No summary files found in /_tmp folder");
    console.log("💡 Create summary files in /_tmp to consolidate");
    console.log(
      "\nNote: Future versions will automatically generate from idea files",
    );
    return;
  }

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
  const existingChangelog = deduplicateVersions(await readExistingChangelog());

  // Generate new entry
  const newEntry = generateChangelogEntry(version, date, summaries);

  // Insert into changelog (with duplicate detection)
  const updatedChangelog = insertIntoChangelog(
    existingChangelog,
    newEntry,
    version,
  );

  // Write changelog
  await writeFile(CHANGELOG, updatedChangelog);

  console.log(`✅ Updated ${CHANGELOG}`);
  console.log(`\n📋 Consolidated ${summaries.length} summaries:`);
  summaries.forEach((s) => console.log(`   - ${s.title}`));

  // Delete temporary files after successful consolidation
  if (summaryFiles.length > 0) {
    console.log(`\n🗑️  Cleaning up temporary files...`);
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
  }

  console.log(`\n✅ Changelog consolidation complete!`);
  console.log(`   Review ${CHANGELOG} and commit the changes`);
}

main().catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
