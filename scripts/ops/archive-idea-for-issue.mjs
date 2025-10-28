#!/usr/bin/env node
/**
 * archive-idea-for-issue.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Archive idea file when corresponding GitHub issue is closed
 *
 * Automatically archives idea files to _archive/YYYY/ when issues are closed.
 * Called by GitHub Actions workflow or manually. Includes safety checks:
 * - Only archives on "completed" state
 * - Skips if "keep-idea" label present
 * - Requires issue open for at least 1 hour
 */

import path from "node:path";
import { access, mkdir, rename, constants } from "node:fs/promises";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, repoRoot } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";
import { getIssue } from "../_lib/github.mjs";
import { findIdeaFiles } from "../_lib/ideas.mjs";

const SCRIPT_NAME = "archive-idea-for-issue";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  issueNumber: z.number(),
  skipChecks: z.boolean().default(false),
  autoCommit: z.boolean().default(false),
});

/**
 * Check if issue has specific label
 * @param {number} issueNumber - Issue number
 * @param {string} label - Label to check
 * @returns {Promise<boolean>} Has label
 */
async function hasLabel(issueNumber, label) {
  try {
    const { stdout } = await execCommand("gh", [
      "issue",
      "view",
      issueNumber.toString(),
      "--json",
      "labels",
      "--jq",
      ".labels[].name",
    ]);
    return stdout.includes(label);
  } catch {
    return false;
  }
}

/**
 * Find idea file for issue
 * @param {number} issueNumber - Issue number
 * @param {object} issue - Issue object
 * @param {string} root - Repository root
 * @returns {Promise<string|null>} Idea file path or null
 */
async function findIdeaForIssue(issueNumber, issue, root) {
  const ideasDir = path.join(root, "ideas");

  // Strategy 1: Check issue body for source link
  if (issue.body) {
    const sourceMatch = issue.body.match(/Source:\s*`\/ideas\/([^`]+)`/);
    if (sourceMatch) {
      const sourceFile = path.join(ideasDir, sourceMatch[1]);
      try {
        await access(sourceFile, constants.F_OK);
        return sourceFile;
      } catch {
        // Continue to next strategy
      }
    }
  }

  // Strategy 2: Match by title
  const prefixes = ["U-", "C-", "B-", "ARCH-", "PB-"];
  const title = issue.title;

  // Try exact match if title starts with prefix
  for (const prefix of prefixes) {
    if (title.startsWith(prefix)) {
      const exactPath = path.join(ideasDir, `${title}.md`);
      try {
        await access(exactPath, constants.F_OK);
        return exactPath;
      } catch {
        // Continue
      }
      break;
    }
  }

  // Extract tag from title if present [TAG]
  const tagMatch = title.match(/^\[?([A-Z]+-[a-z-]+)\]?/i);
  if (tagMatch) {
    const tag = tagMatch[1];
    const files = await findIdeaFiles(ideasDir, tag);
    if (files.length > 0) {
      return path.join(ideasDir, files[0]);
    }
  }

  return null;
}

/**
 * Archive idea file to _archive/YYYY/
 * @param {string} ideaFilePath - Path to idea file
 * @param {string} root - Repository root
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Archive info
 */
async function archiveIdeaFile(ideaFilePath, root, dryRun, log) {
  const year = new Date().getFullYear();
  const archiveDir = path.join(root, "ideas", "_archive", year.toString());
  const filename = path.basename(ideaFilePath);
  const archivePath = path.join(archiveDir, filename);

  if (dryRun) {
    log.info(`[DRY-RUN] Would archive: ${filename}`);
    log.info(`[DRY-RUN] Destination: ideas/_archive/${year}/${filename}`);
    return {
      filename,
      archivePath: `ideas/_archive/${year}/${filename}`,
      originalPath: path.relative(root, ideaFilePath),
    };
  }

  // Create archive directory
  await mkdir(archiveDir, { recursive: true });

  // Move file to archive
  await rename(ideaFilePath, archivePath);
  log.info(`Archived to: ideas/_archive/${year}/${filename}`);

  return {
    filename,
    archivePath: `ideas/_archive/${year}/${filename}`,
    originalPath: path.relative(root, ideaFilePath),
  };
}

/**
 * Commit and push archive
 * @param {object} archiveInfo - Archive information
 * @param {number} issueNumber - Issue number
 * @param {object} issue - Issue object
 * @param {string} root - Repository root
 * @param {Logger} log - Logger
 */
async function commitArchive(archiveInfo, issueNumber, issue, root, log) {
  const commitMessage = `chore: archive idea for closed issue #${issueNumber} [skip ci]

Archived: ${archiveInfo.filename}
Issue: #${issueNumber} - ${issue.title}
Reason: ${issue.stateReason || "completed"}
Archive: ${archiveInfo.archivePath}`;

  log.info("Committing archive...");

  // Configure git
  await execCommand("git", ["config", "user.name", "github-actions[bot]"], {
    cwd: root,
  });
  await execCommand(
    "git",
    ["config", "user.email", "github-actions[bot]@users.noreply.github.com"],
    { cwd: root },
  );

  // Stage files
  try {
    await execCommand("git", ["add", archiveInfo.archivePath], { cwd: root });
    await execCommand("git", ["add", archiveInfo.originalPath], { cwd: root });
  } catch {
    // Ignore errors - file might not exist
  }

  // Commit
  await execCommand("git", ["commit", "-m", commitMessage], { cwd: root });

  // Push
  await execCommand("git", ["push"], { cwd: root });

  log.info("Committed and pushed archive");
}

/**
 * Execute archive workflow
 * @param {object} args - Parsed arguments
 * @param {Logger} log - Logger instance
 * @returns {Promise<object>} Result
 */
async function executeArchive(args, log) {
  const root = await repoRoot(args.cwd);

  log.info(`Processing issue #${args.issueNumber}`);

  // Get issue details
  const issue = await getIssue(args.issueNumber);
  if (!issue) {
    throw new Error(`Issue #${args.issueNumber} not found`);
  }

  log.info(`Issue: ${issue.title}`);
  log.debug(`State: ${issue.state}, Reason: ${issue.stateReason || "N/A"}`);

  // Safety checks (unless skipped)
  if (!args.skipChecks) {
    // Check for keep-idea label
    if (await hasLabel(args.issueNumber, "keep-idea")) {
      log.info("Issue has 'keep-idea' label - skipping archive");
      return {
        status: "skipped",
        reason: "keep-idea-label",
        issueNumber: args.issueNumber,
      };
    }

    // Check state reason
    if (issue.stateReason !== "completed" && issue.state === "closed") {
      log.info(`Issue not closed as completed - skipping archive`);
      return {
        status: "skipped",
        reason: "not-completed",
        issueNumber: args.issueNumber,
        stateReason: issue.stateReason,
      };
    }

    // Check minimum open duration (1 hour)
    if (issue.createdAt && issue.closedAt) {
      const created = new Date(issue.createdAt);
      const closed = new Date(issue.closedAt);
      const durationMs = closed - created;
      const durationHours = durationMs / (1000 * 60 * 60);

      if (durationHours < 1) {
        log.info(
          `Issue open for less than 1 hour (${durationHours.toFixed(2)}h) - skipping`,
        );
        return {
          status: "skipped",
          reason: "too-short",
          issueNumber: args.issueNumber,
          durationHours: durationHours.toFixed(2),
        };
      }
    }
  }

  // Find idea file
  const ideaFilePath = await findIdeaForIssue(args.issueNumber, issue, root);
  if (!ideaFilePath) {
    log.warn(`No idea file found for issue #${args.issueNumber}`);
    return {
      status: "skipped",
      reason: "no-idea-file",
      issueNumber: args.issueNumber,
    };
  }

  log.info(`Found idea file: ${path.basename(ideaFilePath)}`);

  // Archive the file
  const archiveInfo = await archiveIdeaFile(
    ideaFilePath,
    root,
    args.dryRun,
    log,
  );

  // Auto-commit if enabled
  if (args.autoCommit && !args.dryRun) {
    await commitArchive(archiveInfo, args.issueNumber, issue, root, log);
  }

  return {
    status: "archived",
    issueNumber: args.issueNumber,
    archiveInfo,
    committed: args.autoCommit,
  };
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
Usage: ${SCRIPT_NAME} <issue-number> [options]

Archive idea file when corresponding GitHub issue is closed.

Options:
  --help              Show this help message
  --dry-run           Preview without archiving
  --output <fmt>      Output format: text (default), json
  --log-level <lvl>   Log level: error, warn, info (default), debug, trace
  --cwd <path>        Working directory (default: current)
  --skip-checks       Skip safety checks (keep-idea label, duration, state)
  --auto-commit       Automatically commit and push archive

Environment Variables:
  ISSUE_NUMBER        Issue number (alternative to argument)
  GITHUB_ACTIONS      If set, enables auto-commit

Examples:
  ${SCRIPT_NAME} 42                     # Archive idea for issue #42
  ${SCRIPT_NAME} 42 --dry-run            # Preview archive
  ${SCRIPT_NAME} 42 --auto-commit        # Archive and commit
  ${SCRIPT_NAME} 42 --skip-checks        # Skip safety checks

Exit codes:
  0  - Success (archived)
  2  - Noop (skipped, already archived, keep-idea label)
  10 - Precondition failed (gh not authenticated)
  11 - Validation failed
`);
    process.exit(0);
  }

  try {
    // Check for environment variables (GitHub Actions mode)
    const envIssueNumber = process.env.ISSUE_NUMBER;
    const issueNumber = envIssueNumber
      ? parseInt(envIssueNumber, 10)
      : parseInt(flags._?.[0], 10);

    if (!issueNumber || isNaN(issueNumber)) {
      throw new Error(
        "Issue number required (as argument or ISSUE_NUMBER env var)",
      );
    }

    const args = ArgsSchema.parse({
      ...flags,
      issueNumber,
      autoCommit: flags.autoCommit || !!process.env.GITHUB_ACTIONS,
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

    // Execute archive
    const result = await executeArchive(args, log);

    if (result.status === "skipped") {
      succeed({
        script: SCRIPT_NAME,
        message: `Skipped: ${result.reason}`,
        exitCode: 2,
        output: args.output,
        data: result,
      });
    }

    succeed({
      script: SCRIPT_NAME,
      message: `Successfully archived idea for issue #${result.issueNumber}`,
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

    log.error("Failed to archive idea:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
