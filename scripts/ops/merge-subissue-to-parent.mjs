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
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, repoRoot } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";
import { getIssue, getPR, updatePR, updateIssue } from "../_lib/github.mjs";
import { loadIdeaFile, findIdeaFiles } from "../_lib/ideas.mjs";

const SCRIPT_NAME = "merge-subissue-to-parent";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  subIssueNumber: z.number(),
  skipCleanup: z.boolean().default(false),
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
    const root = await repoRoot();
    const ideasDir = join(root, "ideas");
    const bodyText = body || "";

    log.debug(`Searching for idea file for issue #${issueNumber}`);

    // Method 1: Check body for source reference
    let match = bodyText.match(/Source:\s*`([^`]+)`/);
    if (match) {
      const filePath = match[1];
      const normalized = filePath.startsWith("/ideas/")
        ? filePath.slice(1)
        : join("ideas", filePath);
      const fullPath = join(root, normalized);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 2: Check for "See /ideas/..." reference
    match = bodyText.match(/See\s+\/ideas\/([^\s]+\.md)/);
    if (match) {
      const fullPath = join(ideasDir, match[1]);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 3: Derive from title
    const titleMatch = title.match(/^([A-Z]+-[a-z0-9-]+)/i);
    if (titleMatch) {
      const fullPath = join(ideasDir, `${titleMatch[1]}.md`);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 4: Search all idea files
    const allIdeas = await findIdeaFiles(ideasDir);
    for (const ideaFilename of allIdeas) {
      const absolutePath = join(ideasDir, ideaFilename);
      const parsed = await loadIdeaFile(absolutePath);
      if (parsed.metadata.issue === issueNumber) return absolutePath;
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
    const parsed = await loadIdeaFile(ideaFilePath);
    return parsed.metadata.parentIssue ?? null;
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
async function findWorktree(branchName) {
  const root = await repoRoot();
  const worktreeName = `plaincraft-${branchName.replace(/\//g, "-")}`;
  const worktreePath = resolve(root, "..", worktreeName);

  return existsSync(worktreePath) ? worktreePath : null;
}

async function findParentPullRequestNumber(parentIssueNumber, log) {
  try {
    const { stdout } = await execCommand("gh", [
      "pr",
      "list",
      "--state",
      "open",
      "--search",
      `Closes #${parentIssueNumber}`,
      "--json",
      "number,title",
      "--limit",
      "5",
    ]);

    const prs = JSON.parse(stdout);
    if (Array.isArray(prs) && prs.length > 0) {
      return prs[0].number;
    }
  } catch (error) {
    log.debug(
      `Unable to query parent PR for issue #${parentIssueNumber}: ${error.message}`,
    );
  }

  return null;
}

function buildProgressSection(subIssuesContent) {
  const lines = subIssuesContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const taskLines = lines.filter((line) => /^- \[[x\s]\]/i.test(line));
  const completed = taskLines.filter((line) => /^- \[[x]\]/i.test(line)).length;
  const total = taskLines.length;

  const sectionLines = ["## Sub-Issues Progress", ""];

  if (total > 0) {
    sectionLines.push(`**Progress:** ${completed} / ${total} complete`, "");
  }

  if (lines.length > 0) {
    sectionLines.push(lines.join("\n"));
  } else {
    sectionLines.push("_No sub-issues tracked yet._");
  }

  return sectionLines.join("\n");
}

export async function updateParentIssueChecklist(
  parentIssueNumber,
  subIssueNumber,
  log,
  { dryRun = false } = {},
) {
  try {
    const parentIssue = await getIssue(parentIssueNumber);
    const body = parentIssue?.body || "";
    const subIssuesRegex = /##\s*Sub-Issues\s*([\s\S]*?)(?=\n##|\n$|$)/i;
    const match = body.match(subIssuesRegex);

    if (!match || !match[1]) {
      log.info(
        `Parent issue #${parentIssueNumber} has no Sub-Issues section to update`,
      );
      return { updated: false, reason: "no-section" };
    }

    const sectionContent = match[1];
    const lineRegex = new RegExp(
      `(- \\[[x\\s]\\]\\s+#${subIssueNumber}\\b[^\\n]*)`,
      "i",
    );

    if (!lineRegex.test(sectionContent)) {
      log.info(
        `No checklist entry found for sub-issue #${subIssueNumber} in parent issue #${parentIssueNumber}`,
      );
      return { updated: false, reason: "no-line" };
    }

    const updatedSection = sectionContent.replace(lineRegex, (line) =>
      line.replace(/\[[x\s]\]/i, "[x]"),
    );

    if (updatedSection === sectionContent) {
      log.debug(
        `Checklist already marked complete for #${subIssueNumber} in parent issue #${parentIssueNumber}`,
      );
      return { updated: false, reason: "no-change" };
    }

    const normalizedSection = updatedSection.trim();
    const replacement = `## Sub-Issues\n\n${normalizedSection}`;
    let nextBody = body.replace(subIssuesRegex, replacement);

    if (!nextBody.endsWith("\n")) {
      nextBody += "\n";
    }

    if (dryRun) {
      log.info(
        `[DRY-RUN] Would mark sub-issue #${subIssueNumber} complete in parent issue #${parentIssueNumber}`,
      );
      return { updated: false, reason: "dry-run" };
    }

    await updateIssue(parentIssueNumber, { body: nextBody });
    log.info(
      `Marked sub-issue #${subIssueNumber} complete in parent issue #${parentIssueNumber}`,
    );
    return { updated: true };
  } catch (error) {
    log.warn(
      `Failed to update parent issue #${parentIssueNumber}: ${error.message}`,
    );
    return { updated: false, reason: "error", error: error.message };
  }
}

export async function updateParentPullRequest(
  parentIssueNumber,
  subIssueNumber,
  log,
  { dryRun = false } = {},
) {
  try {
    const prNumber = await findParentPullRequestNumber(parentIssueNumber, log);

    if (!prNumber) {
      log.info(`No open PR found for parent issue #${parentIssueNumber}`);
      return { updated: false, prNumber: null, reason: "no-pr" };
    }

    const parentIssue = await getIssue(parentIssueNumber);
    const body = parentIssue?.body || "";
    const subIssuesMatch = body.match(
      /##\s*Sub-Issues\s*([\s\S]*?)(?=\n##|\n$|$)/i,
    );

    if (!subIssuesMatch || !subIssuesMatch[1].trim()) {
      log.info(
        `Parent issue #${parentIssueNumber} has no Sub-Issues section to sync`,
      );
      return { updated: false, prNumber, reason: "no-section" };
    }

    const progressSection = buildProgressSection(subIssuesMatch[1]);
    const parentPR = await getPR(prNumber);
    const currentBody = parentPR?.body || "";

    const progressRegex =
      /##\s*Sub-Issues Progress\s*([\s\S]*?)(?=\n##|\n$|$)/i;

    let nextBody;
    if (progressRegex.test(currentBody)) {
      nextBody = currentBody.replace(progressRegex, progressSection);
    } else if (/##\s*Acceptance Checklist/i.test(currentBody)) {
      nextBody = currentBody.replace(
        /##\s*Acceptance Checklist/i,
        `${progressSection}\n\n## Acceptance Checklist`,
      );
    } else if (/\n---/.test(currentBody)) {
      nextBody = currentBody.replace(/\n---/, `\n\n${progressSection}\n\n---`);
    } else {
      const trimmed = currentBody.trimEnd();
      nextBody =
        trimmed.length > 0
          ? `${trimmed}\n\n${progressSection}`
          : progressSection;
    }

    if (!nextBody.endsWith("\n")) {
      nextBody += "\n";
    }

    if (nextBody === currentBody) {
      log.debug(`Parent PR #${prNumber} already reflects latest progress`);
      return { updated: false, prNumber, reason: "no-change" };
    }

    if (dryRun) {
      log.info(
        `[DRY-RUN] Would update parent PR #${prNumber} with sub-issue progress from #${subIssueNumber}`,
      );
      return { updated: false, prNumber, reason: "dry-run" };
    }

    await updatePR(prNumber, { body: nextBody });
    log.info(
      `Updated parent PR #${prNumber} with sub-issue progress after merging #${subIssueNumber}`,
    );
    return { updated: true, prNumber };
  } catch (error) {
    log.warn(
      `Failed to update parent PR for issue #${parentIssueNumber}: ${error.message}`,
    );
    return {
      updated: false,
      prNumber: null,
      reason: "error",
      error: error.message,
    };
  }
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
  const parentWorktree = await findWorktree(parentBranch);
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
    const checklistUpdate = await updateParentIssueChecklist(
      parentIssueNumber,
      subIssueNumber,
      log,
      { dryRun: true },
    );
    const progressUpdate = await updateParentPullRequest(
      parentIssueNumber,
      subIssueNumber,
      log,
      {
        dryRun: true,
      },
    );
    return {
      subIssueNumber,
      parentIssueNumber,
      subBranch,
      parentBranch,
      parentWorktree,
      checklistUpdate,
      progressUpdate,
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
    log.info("Automation follow-up:");
    log.info("  - Updating parent issue checklist");
    const checklistUpdate = await updateParentIssueChecklist(
      parentIssueNumber,
      subIssueNumber,
      log,
    );
    log.info("  - Refreshing parent PR progress");
    const progressUpdate = await updateParentPullRequest(
      parentIssueNumber,
      subIssueNumber,
      log,
    );

    return {
      subIssueNumber,
      parentIssueNumber,
      subBranch,
      parentBranch,
      parentWorktree,
      checklistUpdate,
      progressUpdate,
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
 * Cleanup branch worktree after successful merge
 * @param {string} branch - Branch to clean up
 * @param {string|undefined} cwd - Working directory override
 * @param {Logger} log - Logger
 * @returns {Promise<{success: boolean, data?: unknown, error?: string}>}
 */
async function cleanupWorktree(branch, cwd, log) {
  if (!branch) {
    return { success: false, error: "No branch provided for cleanup" };
  }

  log.info(`Cleaning up worktree for ${branch}...`);

  try {
    const root = await repoRoot(cwd);
    const { stdout } = await execCommand(
      "node",
      ["scripts/ops/remove-worktree.mjs", branch, "--yes", "--output", "json"],
      { cwd: root },
    );

    let data;
    try {
      data = stdout.trim() ? JSON.parse(stdout) : undefined;
    } catch {
      data = { raw: stdout };
    }

    log.info(`Worktree cleanup complete for ${branch}`);
    return { success: true, data };
  } catch (error) {
    log.warn(
      `Worktree cleanup for ${branch} failed: ${error.message}. Please run manually if needed.`,
    );
    return { success: false, error: error.message };
  }
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  // Show help first, before any validation
  if (flags.help) {
    console.log(`
Usage: ${SCRIPT_NAME} <sub-issue-number> [options]

Merge sub-issue changes to parent issue branch.

Options:
  --help                    Show this help message
  --dry-run                 Preview without merging
  --skip-cleanup            Do not remove sub-issue worktree after merge
  --output <fmt>            Output format: text (default), json
  --log-level <lvl>         Log level: error, warn, info (default), debug, trace
  --cwd <path>              Working directory (default: current)

Examples:
  ${SCRIPT_NAME} 123                    # Merge sub-issue #123 to parent
  ${SCRIPT_NAME} 123 --dry-run          # Preview merge

Exit codes:
  0  - Success (merged)
  10 - Precondition failed (gh not authenticated)
  11 - Validation failed
`);
    process.exit(0);
  }

  try {
    // Parse sub-issue number from positional arg
    const subIssueNumber = parseInt(flags._?.[0], 10);
    if (!subIssueNumber || isNaN(subIssueNumber)) {
      throw new Error("Sub-issue number required as first argument");
    }

    const args = ArgsSchema.parse({
      ...flags,
      subIssueNumber,
      skipCleanup: flags.skipCleanup ?? false,
    });

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

    if (result.merged && !args.skipCleanup) {
      const cleanup = await cleanupWorktree(result.subBranch, args.cwd, log);
      result.cleanup = cleanup;
    }

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

const entryUrl =
  typeof process.argv[1] === "string"
    ? pathToFileURL(process.argv[1]).href
    : null;

if (entryUrl === import.meta.url) {
  main();
}
