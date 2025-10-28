#!/usr/bin/env node
/**
 * merge-subissue-to-parent.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Merge sub-issue changes to parent issue branch
 *
 * Detects parent issue from card metadata, finds parent worktree,
 * and merges sub-issue commits to parent branch.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, repoRoot } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";
import { getIssue } from "../_lib/github.mjs";
import { parseIdeaFile, findIdeaFiles } from "../_lib/ideas.mjs";

const SCRIPT_NAME = "merge-subissue-to-parent";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  subIssueNumber: z.number(),
});

/**
 * Find idea file for issue
 * @param {number} issueNumber - Issue number
 * @param {Logger} log - Logger
 * @returns {Promise<string|null>} Idea file path
 */
async function findIdeaFile(issueNumber, log) {
  try {
    const issue = await getIssue(issueNumber);
    const { title, body } = issue;

    log.debug(`Searching for idea file for issue #${issueNumber}`);

    // Method 1: Check body for source reference
    let match = body.match(/Source:\s*`([^`]+)`/);
    if (match) {
      const filePath = match[1];
      const fullPath = filePath.startsWith("/ideas/")
        ? resolve(repoRoot(), filePath.slice(1))
        : resolve(repoRoot(), "ideas", filePath);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 2: Check for "See /ideas/..." reference
    match = body.match(/See\s+\/ideas\/([^\s]+\.md)/);
    if (match) {
      const fullPath = resolve(repoRoot(), "ideas", match[1]);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 3: Derive from title
    const titleMatch = title.match(/^([A-Z]+-[a-z0-9-]+)/i);
    if (titleMatch) {
      const fullPath = resolve(repoRoot(), "ideas", `${titleMatch[1]}.md`);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 4: Search all idea files
    const allIdeas = await findIdeaFiles();
    for (const ideaPath of allIdeas) {
      const parsed = await parseIdeaFile(ideaPath);
      if (parsed.metadata.issue === issueNumber) return ideaPath;
    }

    return null;
  } catch (error) {
    log.error(`Error finding idea file: ${error.message}`);
    return null;
  }
}

/**
 * Extract parent issue number from card
 * @param {string} ideaFilePath - Path to idea file
 * @param {Logger} log - Logger
 * @returns {Promise<number|null>} Parent issue number
 */
async function getParentIssue(ideaFilePath, log) {
  try {
    const parsed = await parseIdeaFile(ideaFilePath);
    const parentMatch = parsed.content.match(/Parent:\s*#(\d+)/);
    return parentMatch ? parseInt(parentMatch[1], 10) : null;
  } catch (error) {
    log.error(`Error parsing idea file: ${error.message}`);
    return null;
  }
}

/**
 * Get branch name for issue
 * @param {number} issueNumber - Issue number
 * @param {Logger} log - Logger
 * @returns {Promise<string|null>} Branch name
 */
async function getBranchName(issueNumber, log) {
  try {
    const issue = await getIssue(issueNumber);
    const { title } = issue;

    // Convert title to branch name (e.g., "ARCH-example" -> "feat/arch-example")
    const slug = title
      .toLowerCase()
      .replace(/^\[?([a-z]+-[a-z0-9-]+)\]?.*$/i, "$1");

    return `feat/${slug}`;
  } catch (error) {
    log.error(`Error getting branch name: ${error.message}`);
    return null;
  }
}

/**
 * Find worktree path for branch
 * @param {string} branchName - Branch name
 * @returns {string|null} Worktree path
 */
function findWorktree(branchName) {
  const root = repoRoot();
  const worktreeName = `plaincraft-${branchName.replace(/\//g, "-")}`;
  const worktreePath = resolve(root, "..", worktreeName);

  return existsSync(worktreePath) ? worktreePath : null;
}

/**
 * Merge sub-issue to parent
 * @param {number} subIssueNumber - Sub-issue number
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Result
 */
async function mergeSubIssueToParent(subIssueNumber, dryRun, log) {
  log.info(`Processing sub-issue #${subIssueNumber}...`);

  // Find idea file for sub-issue
  const subIdeaFile = await findIdeaFile(subIssueNumber, log);
  if (!subIdeaFile) {
    throw new Error(
      `Could not find idea file for sub-issue #${subIssueNumber}`,
    );
  }
  log.info(`Found sub-issue card: ${subIdeaFile.split("/").pop()}`);

  // Get parent issue
  const parentIssueNumber = await getParentIssue(subIdeaFile, log);
  if (!parentIssueNumber) {
    throw new Error(
      `No parent issue found in card metadata. Add "Parent: #N" to the card to enable merge-back.`,
    );
  }
  log.info(`Parent issue: #${parentIssueNumber}`);

  // Get branch names
  const subBranch = await getBranchName(subIssueNumber, log);
  const parentBranch = await getBranchName(parentIssueNumber, log);

  if (!subBranch || !parentBranch) {
    throw new Error("Could not determine branch names");
  }

  log.info(`Sub-issue branch: ${subBranch}`);
  log.info(`Parent branch: ${parentBranch}`);

  // Find parent worktree
  const parentWorktree = findWorktree(parentBranch);
  if (!parentWorktree) {
    const expectedPath = resolve(
      repoRoot(),
      "..",
      `plaincraft-${parentBranch.replace(/\//g, "-")}`,
    );
    throw new Error(
      `Parent worktree not found at expected path: ${expectedPath}\nCreate parent worktree first with: create-worktree-pr.mjs ${parentIssueNumber}`,
    );
  }
  log.info(`Parent worktree: ${parentWorktree}`);

  if (dryRun) {
    log.info("[DRY-RUN] Would merge sub-issue changes to parent branch");
    log.info(`  Fetch: origin/${subBranch}`);
    log.info(`  Merge: origin/${subBranch} → ${parentBranch}`);
    log.info(`  Push: origin/${parentBranch}`);
    return {
      subIssueNumber,
      parentIssueNumber,
      subBranch,
      parentBranch,
      parentWorktree,
      merged: false,
    };
  }

  // Perform merge
  log.info("Merging sub-issue changes to parent branch...");

  try {
    // Fetch latest from sub-issue branch
    await execCommand("git", ["fetch", "origin", subBranch], {
      cwd: parentWorktree,
    });

    // Merge sub-issue branch into parent branch
    await execCommand(
      "git",
      [
        "merge",
        `origin/${subBranch}`,
        "--no-edit",
        "-m",
        `Merge sub-issue #${subIssueNumber} into parent #${parentIssueNumber}`,
      ],
      { cwd: parentWorktree },
    );

    // Push updated parent branch
    await execCommand("git", ["push", "origin", parentBranch], {
      cwd: parentWorktree,
    });

    log.info(
      `Successfully merged sub-issue #${subIssueNumber} to parent #${parentIssueNumber}`,
    );
    log.info("Next steps:");
    log.info("  1. Verify changes in parent PR");
    log.info(
      `  2. Close sub-issue #${subIssueNumber} with reference to parent`,
    );
    log.info("  3. Update parent issue task list to mark sub-issue complete");

    return {
      subIssueNumber,
      parentIssueNumber,
      subBranch,
      parentBranch,
      parentWorktree,
      merged: true,
    };
  } catch (error) {
    log.error("Merge failed:", error.message);
    log.error("Manual resolution required:");
    log.error(`  cd ${parentWorktree}`);
    log.error(`  git fetch origin ${subBranch}`);
    log.error(`  git merge origin/${subBranch}`);
    log.error("  # Resolve conflicts if any");
    log.error(`  git push origin ${parentBranch}`);
    throw error;
  }
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  try {
    // Parse sub-issue number from positional arg
    const subIssueNumber = parseInt(flags._?.[0], 10);
    if (!subIssueNumber || isNaN(subIssueNumber)) {
      throw new Error("Sub-issue number required as first argument");
    }

    const args = ArgsSchema.parse({
      ...flags,
      subIssueNumber,
    });

    if (args.help) {
      console.log(`
Usage: ${SCRIPT_NAME} <sub-issue-number> [options]

Merge sub-issue changes to parent issue branch.

Options:
  --help                    Show this help message
  --dry-run                 Preview without merging
  --output <fmt>            Output format: text (default), json
  --log-level <lvl>         Log level: error, warn, info (default), debug, trace
  --cwd <path>              Working directory (default: current)

Examples:
  ${SCRIPT_NAME} 123                    # Merge sub-issue #123 to parent
  ${SCRIPT_NAME} 123 --dry-run          # Preview merge

Exit codes:
  0  - Success (merged)
  1  - Failed to merge
  10 - Precondition failed (no parent worktree, gh not authenticated)
  11 - Validation failed (no parent issue metadata)

Prerequisites:
  - Parent worktree must exist (create with create-worktree-pr.mjs)
  - Sub-issue card must have "Parent: #N" metadata
  - GitHub CLI must be authenticated

Note: This script performs a non-fast-forward merge and pushes to origin.
`);
      process.exit(0);
    }

    // Check gh CLI
    try {
      await execCommand("gh", ["--version"]);
    } catch {
      fail({
        script: SCRIPT_NAME,
        message: "GitHub CLI (gh) not installed",
        exitCode: 10,
        output: args.output,
      });
    }

    // Merge sub-issue
    const result = await mergeSubIssueToParent(
      args.subIssueNumber,
      args.dryRun,
      log,
    );

    succeed({
      script: SCRIPT_NAME,
      message: result.merged
        ? `Merged sub-issue #${result.subIssueNumber} to parent #${result.parentIssueNumber}`
        : "Dry run completed",
      output: args.output,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error("Validation error:", error.errors);
      fail({
        script: SCRIPT_NAME,
        message: "Invalid arguments",
        exitCode: 11,
        output: flags.output || "text",
        error,
      });
    }

    log.error("Failed to merge:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
