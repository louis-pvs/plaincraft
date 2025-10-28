/**
 * changelog.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Shared utilities for changelog workflows.
 */

import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";

/**
 * Get markdown summary files from the temporary directory.
 * @param {string} root - Repository root.
 * @param {string} [tmpDir="_tmp"] - Relative tmp directory path.
 * @returns {Promise<string[]>} Sorted absolute file paths.
 */
export async function getSummaryFiles(root, tmpDir = "_tmp") {
  const targetDir = path.resolve(root, tmpDir);
  if (!existsSync(targetDir)) {
    return [];
  }

  const entries = await readdir(targetDir);
  return entries
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(targetDir, file))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Parse a summary markdown file into a structured object.
 * @param {string} filePath - Absolute file path.
 * @returns {Promise<object>} Parsed summary info.
 */
export async function parseSummaryFile(filePath) {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");

  const titleLine = lines.find((line) => line.startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s+/, "").trim() : "Changes";

  return {
    title,
    content: content.trim(),
    filePath,
  };
}

/**
 * Parse summary files in bulk.
 * @param {string[]} filePaths - Paths to markdown files.
 * @returns {Promise<Array<{title: string, content: string, filePath: string}>>}
 */
export async function parseSummaryFiles(filePaths) {
  return Promise.all(filePaths.map((filePath) => parseSummaryFile(filePath)));
}

/**
 * Generate a changelog entry for a version and set of summaries.
 * @param {object} options - Options.
 * @param {string} options.version - Target version string.
 * @param {string} options.date - Release date (YYYY-MM-DD).
 * @param {Array<{title: string, content: string}>} options.summaries - Summaries to include.
 * @returns {string} Markdown changelog entry.
 */
export function generateVersionEntry({ version, date, summaries }) {
  let entry = `## [${version}] - ${date}\n\n`;

  for (const summary of summaries) {
    entry += `### ${summary.title}\n\n`;
    const contentWithoutTitle = summary.content
      .replace(/^#\s+.*\n\n?/, "")
      .trim();
    entry += `${contentWithoutTitle}\n\n`;
  }

  return entry.trimEnd() + "\n";
}

/**
 * Deduplicate a changelog by merging duplicate version sections.
 * @param {string} changelog - Existing changelog content.
 * @returns {string} Deduplicated changelog.
 */
export function deduplicateChangelog(changelog) {
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

  for (const block of blocks) {
    const match = block.match(/^## \[([^\]]+)]/);
    if (!match) {
      continue;
    }
    const version = match[1];
    if (!versionMap.has(version)) {
      versionMap.set(version, block);
      order.push(version);
    } else {
      const merged = mergeVersionEntries(versionMap.get(version), block);
      versionMap.set(version, merged.trim());
    }
  }

  const mergedEntries = order
    .map((version) => versionMap.get(version).trim())
    .join("\n\n");

  return `${header}\n\n${mergedEntries}\n`.trimEnd() + "\n";
}

/**
 * Merge two version entries section by section.
 * @param {string} existingEntry - Existing version block.
 * @param {string} incomingEntry - New version block.
 * @returns {string} Merged version block.
 */
export function mergeVersionEntries(existingEntry, incomingEntry) {
  const { header, sections: existingSections } = splitSections(existingEntry);
  const { sections: incomingSections } = splitSections(incomingEntry);

  const sectionMap = new Map();

  for (const section of existingSections) {
    const heading = section.split("\n")[0];
    sectionMap.set(heading, section);
  }

  for (const section of incomingSections) {
    const heading = section.split("\n")[0];
    if (sectionMap.has(heading)) {
      const combined = combineSection(sectionMap.get(heading), section);
      sectionMap.set(heading, combined);
    } else {
      sectionMap.set(heading, section.trim());
    }
  }

  const mergedBody = Array.from(sectionMap.values())
    .map((section) => section.trim())
    .filter(Boolean)
    .join("\n\n");

  return mergedBody ? `${header}\n\n${mergedBody}\n` : `${header}\n`;
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
  const [, ...incomingBodyLines] = incomingLines;
  const incomingBody = incomingBodyLines.join("\n").trim();

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

/**
 * Insert a version entry into the changelog, merging duplicates when present.
 * @param {string} existingChangelog - Current changelog contents.
 * @param {string} newEntry - Generated entry to insert.
 * @param {string} version - Version identifier.
 * @returns {string} Updated changelog contents.
 */
export function insertVersionEntry(existingChangelog, newEntry, version) {
  if (!existingChangelog) {
    return `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${newEntry.trimEnd()}\n`;
  }

  let sanitizedChangelog = deduplicateChangelog(existingChangelog);
  const versionPattern = new RegExp(
    `^## \\[${version.replace(/\./g, "\\.")}\\]`,
    "m",
  );

  if (versionPattern.test(sanitizedChangelog)) {
    const blockRegex = new RegExp(
      `## \\[${version.replace(
        /\./g,
        "\\.",
      )}\\][\\s\\S]*?(?=\n## \\[|$)`,
      "m",
    );
    const match = sanitizedChangelog.match(blockRegex);

    if (match) {
      const mergedBlock = mergeVersionEntries(match[0], newEntry).trim();
      const updated = sanitizedChangelog.replace(
        blockRegex,
        `${mergedBlock}\n`,
      );
      return deduplicateChangelog(updated).trimEnd() + "\n";
    }

    return `${sanitizedChangelog.trimEnd()}\n\n${newEntry.trimEnd()}\n`;
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
    return `${sanitizedChangelog.trimEnd()}\n\n${newEntry.trimEnd()}\n`;
  }

  const before = lines.slice(0, insertIndex).join("\n");
  const after = lines.slice(insertIndex).join("\n");
  const combined = `${before}\n${newEntry.trimEnd()}\n\n${after}`;
  return deduplicateChangelog(combined).trimEnd() + "\n";
}
