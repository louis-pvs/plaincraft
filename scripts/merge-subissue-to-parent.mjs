#!/usr/bin/env node

/**
 * Merge sub-issue changes to parent issue branch
 *
 * Detects parent issue from card metadata, finds parent worktree,
 * and merges sub-issue commits to parent branch.
 *
 * Usage:
 *   node scripts/merge-subissue-to-parent.mjs <subIssueNumber>
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const REPO = process.env.GITHUB_REPOSITORY || "louis-pvs/plaincraft";
const ROOT = process.cwd();

/**
 * Find idea file for issue
 */
function findIdeaFile(issueNumber) {
  try {
    const issueData = execSync(
      `gh api repos/${REPO}/issues/${issueNumber} --jq '{title, body}'`,
      { encoding: "utf8" },
    );
    const { title, body } = JSON.parse(issueData);

    // Method 1: Check body for source reference
    let match = body.match(/Source:\s*`([^`]+)`/);
    if (match) {
      const filePath = match[1];
      return filePath.startsWith("/ideas/")
        ? resolve(ROOT, filePath.slice(1))
        : resolve(ROOT, "ideas", filePath);
    }

    // Method 2: Check for "See /ideas/..." reference
    match = body.match(/See\s+\/ideas\/([^\s]+\.md)/);
    if (match) {
      return resolve(ROOT, "ideas", match[1]);
    }

    // Method 3: Derive from title
    const titleMatch = title.match(/^([A-Z]+-[a-z0-9-]+)/i);
    if (titleMatch) {
      return resolve(ROOT, "ideas", `${titleMatch[1]}.md`);
    }

    return null;
  } catch (error) {
    console.error(`Error finding idea file:`, error.message);
    return null;
  }
}

/**
 * Extract parent issue number from card
 */
async function getParentIssue(ideaFilePath) {
  try {
    const content = await readFile(ideaFilePath, "utf-8");
    const match = content.match(/Parent:\s*#(\d+)/);
    return match ? parseInt(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Get branch name for issue
 */
function getBranchName(issueNumber) {
  try {
    const issue = execSync(
      `gh api repos/${REPO}/issues/${issueNumber} --jq '{title, labels: [.labels[].name]}'`,
      { encoding: "utf8" },
    );
    const { title } = JSON.parse(issue);

    // Convert title to branch name (e.g., "ARCH-example" -> "feat/arch-example")
    const slug = title
      .toLowerCase()
      .replace(/^\[?([a-z]+-[a-z0-9-]+)\]?.*$/i, "$1");

    return `feat/${slug}`;
  } catch (error) {
    console.error(`Error getting branch name:`, error.message);
    return null;
  }
}

/**
 * Find worktree path for branch
 */
function findWorktree(branchName) {
  const worktreeName = `plaincraft-${branchName.replace(/\//g, "-")}`;
  const worktreePath = resolve(ROOT, "..", worktreeName);

  return existsSync(worktreePath) ? worktreePath : null;
}

/**
 * Main execution
 */
async function main() {
  const subIssueNumber = process.argv[2];

  if (!subIssueNumber || isNaN(subIssueNumber)) {
    console.error(
      "Usage: node scripts/merge-subissue-to-parent.mjs <subIssueNumber>",
    );
    process.exit(1);
  }

  console.log(`\n🔍 Processing sub-issue #${subIssueNumber}...\n`);

  // Find idea file for sub-issue
  const subIdeaFile = findIdeaFile(subIssueNumber);
  if (!subIdeaFile) {
    console.error(
      `❌ Could not find idea file for sub-issue #${subIssueNumber}`,
    );
    process.exit(1);
  }
  console.log(`✓ Found sub-issue card: ${subIdeaFile.split("/").pop()}`);

  // Get parent issue
  const parentIssueNumber = await getParentIssue(subIdeaFile);
  if (!parentIssueNumber) {
    console.error(`❌ No parent issue found in card metadata`);
    console.error(`   Add "Parent: #N" to the card to enable merge-back`);
    process.exit(1);
  }
  console.log(`✓ Parent issue: #${parentIssueNumber}`);

  // Get branch names
  const subBranch = getBranchName(subIssueNumber);
  const parentBranch = getBranchName(parentIssueNumber);

  if (!subBranch || !parentBranch) {
    console.error(`❌ Could not determine branch names`);
    process.exit(1);
  }

  console.log(`✓ Sub-issue branch: ${subBranch}`);
  console.log(`✓ Parent branch: ${parentBranch}`);

  // Find parent worktree
  const parentWorktree = findWorktree(parentBranch);
  if (!parentWorktree) {
    console.error(`❌ Parent worktree not found at expected path`);
    console.error(
      `   Expected: ${resolve(ROOT, "..", `plaincraft-${parentBranch.replace(/\//g, "-")}`)}`,
    );
    console.error(
      `   Create parent worktree first with: node scripts/create-worktree-pr.mjs ${parentIssueNumber}`,
    );
    process.exit(1);
  }
  console.log(`✓ Parent worktree: ${parentWorktree}`);

  // Perform merge
  console.log(`\n🔀 Merging sub-issue changes to parent branch...\n`);

  try {
    // Fetch latest from sub-issue branch
    execSync(`git fetch origin ${subBranch}`, {
      cwd: parentWorktree,
      stdio: "inherit",
    });

    // Merge sub-issue branch into parent branch
    execSync(
      `git merge origin/${subBranch} --no-edit -m "Merge sub-issue #${subIssueNumber} into parent #${parentIssueNumber}"`,
      {
        cwd: parentWorktree,
        stdio: "inherit",
      },
    );

    // Push updated parent branch
    execSync(`git push origin ${parentBranch}`, {
      cwd: parentWorktree,
      stdio: "inherit",
    });

    console.log(
      `\n✅ Successfully merged sub-issue #${subIssueNumber} to parent #${parentIssueNumber}`,
    );
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Verify changes in parent PR`);
    console.log(
      `   2. Close sub-issue #${subIssueNumber} with reference to parent`,
    );
    console.log(
      `   3. Update parent issue task list to mark sub-issue complete`,
    );
  } catch (error) {
    console.error(`\n❌ Merge failed:`, error.message);
    console.error(`\nManual resolution required:`);
    console.error(`   cd ${parentWorktree}`);
    console.error(`   git fetch origin ${subBranch}`);
    console.error(`   git merge origin/${subBranch}`);
    console.error(`   # Resolve conflicts if any`);
    console.error(`   git push origin ${parentBranch}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
