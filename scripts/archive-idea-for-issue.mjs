#!/usr/bin/env node

/**
 * Archive Idea File for Closed Issue
 *
 * Automatically archives an idea file when its corresponding GitHub issue is closed.
 * Called by the idea-lifecycle GitHub Actions workflow.
 *
 * Environment variables:
 *   - ISSUE_NUMBER: The issue number
 *   - ISSUE_TITLE: The issue title
 *   - ISSUE_STATE_REASON: Why the issue was closed (completed, not_planned, etc.)
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { access, mkdir, rename, constants } from "node:fs/promises";
import { dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

const ISSUE_NUMBER = process.env.ISSUE_NUMBER;
const ISSUE_TITLE = process.env.ISSUE_TITLE;
const ISSUE_STATE_REASON = process.env.ISSUE_STATE_REASON;

/**
 * Check if issue has a specific label
 */
async function hasLabel(issueNumber, label) {
  try {
    const { stdout } = await execAsync(
      `gh issue view ${issueNumber} --json labels --jq '.labels[].name'`,
      { cwd: ROOT_DIR },
    );
    return stdout.includes(label);
  } catch {
    return false;
  }
}

/**
 * Get issue creation and closure timestamps
 */
async function getIssueTiming(issueNumber) {
  try {
    const { stdout } = await execAsync(
      `gh issue view ${issueNumber} --json createdAt,closedAt`,
      { cwd: ROOT_DIR },
    );
    const data = JSON.parse(stdout);
    return {
      createdAt: new Date(data.createdAt),
      closedAt: new Date(data.closedAt),
    };
  } catch (error) {
    throw new Error(`Failed to get issue timing: ${error.message}`);
  }
}

/**
 * Find idea file for the given issue
 * Strategy 1: Look for "Source: /ideas/..." link in issue body
 * Strategy 2: Match issue title to idea filename
 */
async function findIdeaFile(issueNumber, issueTitle) {
  // Strategy 1: Check issue body for source link
  try {
    const { stdout } = await execAsync(
      `gh issue view ${issueNumber} --json body --jq '.body'`,
      { cwd: ROOT_DIR },
    );

    const sourceMatch = stdout.match(/Source:\s*`\/ideas\/([^`]+)`/);
    if (sourceMatch) {
      const sourceFile = join(ROOT_DIR, "ideas", sourceMatch[1]);
      try {
        await access(sourceFile, constants.F_OK);
        console.log(
          `✓ Found idea file via source link: ideas/${sourceMatch[1]}`,
        );
        return sourceFile;
      } catch {
        // File doesn't exist, try next strategy
      }
    }
  } catch {
    // Couldn't get issue body, try next strategy
  }

  // Strategy 2: Match by title
  const slug = issueTitle
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const prefixes = ["U-", "C-", "B-", "ARCH-", "PB-", ""];

  for (const prefix of prefixes) {
    const potentialPath = join(ROOT_DIR, "ideas", `${prefix}${slug}.md`);
    try {
      await access(potentialPath, constants.F_OK);
      console.log(
        `✓ Found idea file via title match: ideas/${prefix}${slug}.md`,
      );
      return potentialPath;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Archive the idea file
 */
async function archiveIdeaFile(ideaFilePath) {
  const year = new Date().getFullYear();
  const archiveDir = join(ROOT_DIR, "ideas", "_archive", year.toString());

  // Create archive directory
  await mkdir(archiveDir, { recursive: true });

  // Move file to archive
  const filename = basename(ideaFilePath);
  const archivePath = join(archiveDir, filename);

  await rename(ideaFilePath, archivePath);
  console.log(`✓ Moved to: ideas/_archive/${year}/${filename}`);

  return {
    filename,
    archivePath: `ideas/_archive/${year}/${filename}`,
    originalPath: ideaFilePath.replace(`${ROOT_DIR}/`, ""),
  };
}

/**
 * Commit and push the archive
 */
async function commitArchive(archiveInfo) {
  const commitMessage = `chore: archive idea for closed issue #${ISSUE_NUMBER} [skip ci]

Archived: ${archiveInfo.filename}
Issue: #${ISSUE_NUMBER} - ${ISSUE_TITLE}
Reason: ${ISSUE_STATE_REASON}
Archive: ${archiveInfo.archivePath}`;

  // Configure git
  await execAsync(
    'git config user.name "github-actions[bot]" && git config user.email "github-actions[bot]@users.noreply.github.com"',
    { cwd: ROOT_DIR },
  );

  // Stage files (both archive path and original path in case it still exists)
  await execAsync(
    `git add "${archiveInfo.archivePath}" "${archiveInfo.originalPath}" 2>/dev/null || true`,
    { cwd: ROOT_DIR },
  );

  // Commit
  await execAsync(`git commit -m ${JSON.stringify(commitMessage)}`, {
    cwd: ROOT_DIR,
  });

  // Push
  await execAsync("git push", { cwd: ROOT_DIR });

  console.log("✓ Committed and pushed archive");
}

/**
 * Main execution
 */
async function main() {
  console.log(`📝 Processing closed issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}`);

  // Safety check: Skip if issue has "keep-idea" label
  if (await hasLabel(ISSUE_NUMBER, "keep-idea")) {
    console.log("⏭️  Issue has 'keep-idea' label - skipping archive");
    return;
  }

  // Safety check: Only process issues closed as "completed" (merged PRs)
  if (ISSUE_STATE_REASON !== "completed") {
    console.log(
      `⏭️  Issue not closed as completed (state: ${ISSUE_STATE_REASON}) - skipping archive`,
    );
    return;
  }

  // Safety check: Issue must have been open for at least 1 hour
  const { createdAt, closedAt } = await getIssueTiming(ISSUE_NUMBER);
  const durationMs = closedAt - createdAt;
  const durationHours = durationMs / (1000 * 60 * 60);

  if (durationHours < 1) {
    console.log(
      `⏭️  Issue was open for less than 1 hour (${durationHours.toFixed(2)}h) - skipping archive`,
    );
    return;
  }

  // Find corresponding idea file
  const ideaFilePath = await findIdeaFile(ISSUE_NUMBER, ISSUE_TITLE);

  if (!ideaFilePath) {
    console.log(
      `ℹ️  No idea file found for issue #${ISSUE_NUMBER} - nothing to archive`,
    );
    return;
  }

  // Archive the file
  const archiveInfo = await archiveIdeaFile(ideaFilePath);

  // Commit and push
  await commitArchive(archiveInfo);

  console.log(`✅ Successfully archived idea file for issue #${ISSUE_NUMBER}`);
}

main().catch((error) => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
});
