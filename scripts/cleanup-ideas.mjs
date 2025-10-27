#!/usr/bin/env node
/**
 * Manual Idea File Cleanup Script
 *
 * Archives idea files for closed issues, with preview and dry-run support.
 *
 * Usage:
 *   node scripts/cleanup-ideas.mjs                  # Preview what would be archived
 *   node scripts/cleanup-ideas.mjs --execute        # Actually archive files
 *   node scripts/cleanup-ideas.mjs --issue 42       # Archive specific issue
 */

import { readdir, readFile, rename, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const IDEAS_DIR = "ideas";
const ARCHIVE_DIR = "ideas/_archive";

/**
 * Get all idea files
 */
async function getIdeaFiles() {
  if (!existsSync(IDEAS_DIR)) {
    return [];
  }

  const files = await readdir(IDEAS_DIR);
  return files
    .filter(
      (f) =>
        f.endsWith(".md") &&
        (f.startsWith("U-") ||
          f.startsWith("C-") ||
          f.startsWith("B-") ||
          f.startsWith("ARCH-") ||
          f.startsWith("PB-")),
    )
    .map((f) => join(IDEAS_DIR, f));
}

/**
 * Extract Issue number from idea file metadata
 */
async function getIssueNumber(filePath) {
  const content = await readFile(filePath, "utf-8");
  const issueMatch = content.match(/Issue:\s*#?(\d+)/i);
  return issueMatch ? parseInt(issueMatch[1], 10) : null;
}

/**
 * Check if issue is closed via GitHub API
 */
async function isIssueClosed(issueNumber) {
  try {
    const { stdout } = await execAsync(
      `gh issue view ${issueNumber} --json state,stateReason`,
    );
    const data = JSON.parse(stdout);
    return {
      closed: data.state === "CLOSED",
      reason: data.stateReason || "unknown",
    };
  } catch {
    return { closed: false, reason: "error" };
  }
}

/**
 * Archive idea file
 */
async function archiveIdeaFile(filePath, issueNumber, dryRun = true) {
  const filename = filePath.split("/").pop();
  const year = new Date().getFullYear();
  const archivePath = join(ARCHIVE_DIR, String(year), filename);

  if (dryRun) {
    console.log(`  [DRY RUN] Would move: ${filePath} → ${archivePath}`);
    return { archived: false, path: archivePath };
  }

  // Create archive directory
  const archiveYearDir = join(ARCHIVE_DIR, String(year));
  if (!existsSync(archiveYearDir)) {
    await mkdir(archiveYearDir, { recursive: true });
  }

  // Move file
  await rename(filePath, archivePath);
  console.log(`  ✓ Archived: ${filePath} → ${archivePath}`);

  return { archived: true, path: archivePath };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--execute");
  const specificIssue = args.find((arg) => arg.startsWith("--issue"));
  const issueNumber = specificIssue
    ? parseInt(
        specificIssue.split("=")[1] || args[args.indexOf(specificIssue) + 1],
        10,
      )
    : null;

  console.log("🗂️  Idea File Cleanup\n");

  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No files will be moved");
    console.log("   Use --execute to actually archive files\n");
  }

  const ideaFiles = await getIdeaFiles();

  if (ideaFiles.length === 0) {
    console.log("ℹ️  No idea files found");
    return;
  }

  console.log(`Found ${ideaFiles.length} idea file(s)\n`);

  const results = {
    archived: 0,
    skipped: 0,
    errors: 0,
  };

  for (const filePath of ideaFiles) {
    const filename = filePath.split("/").pop();

    try {
      // Get issue number from file
      const fileIssueNumber = await getIssueNumber(filePath);

      if (!fileIssueNumber) {
        console.log(`⏭️  ${filename}: No Issue number found in metadata`);
        results.skipped++;
        continue;
      }

      // Filter by specific issue if requested
      if (issueNumber && fileIssueNumber !== issueNumber) {
        continue;
      }

      // Check if issue is closed
      const issueState = await isIssueClosed(fileIssueNumber);

      if (!issueState.closed) {
        console.log(`⏭️  ${filename}: Issue #${fileIssueNumber} is still open`);
        results.skipped++;
        continue;
      }

      console.log(
        `📦 ${filename}: Issue #${fileIssueNumber} closed (${issueState.reason})`,
      );

      // Archive the file
      await archiveIdeaFile(filePath, fileIssueNumber, dryRun);
      results.archived++;
    } catch (err) {
      console.error(`❌ ${filename}: Error - ${err.message}`);
      results.errors++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Archived: ${results.archived}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Errors: ${results.errors}`);

  if (dryRun && results.archived > 0) {
    console.log(
      `\n💡 Run with --execute to actually archive ${results.archived} file(s)`,
    );
  }

  if (!dryRun && results.archived > 0) {
    console.log("\n✅ Cleanup complete!");
    console.log("   Review changes and commit them:");
    console.log("   git add ideas/_archive");
    console.log('   git commit -m "chore: archive completed idea files"');
  }
}

main().catch((error) => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});
