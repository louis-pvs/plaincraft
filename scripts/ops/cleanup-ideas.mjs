#!/usr/bin/env node
/**
 * cleanup-ideas.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Clean up and archive orphaned or completed idea files
 *
 * Scans idea files and archives those with closed issues.
 * Supports filtering by issue number and preview mode.
 */

import path from "node:path";
import { readFile, rename, mkdir } from "node:fs/promises";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, repoRoot } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";
import { getIssue } from "../_lib/github.mjs";
import { findIdeaFiles } from "../_lib/ideas.mjs";

const SCRIPT_NAME = "cleanup-ideas";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  issueNumber: z.number().optional(),
  execute: z.boolean().default(false),
});

/**
 * Extract issue number from idea file content
 * @param {string} filePath - Path to idea file
 * @returns {Promise<number|null>} Issue number or null
 */
async function extractIssueNumber(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    const issueMatch = content.match(/Issue:\s*#?(\d+)/i);
    return issueMatch ? parseInt(issueMatch[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * Archive idea file to _archive/YYYY/
 * @param {string} filePath - Path to idea file
 * @param {string} root - Repository root
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Archive info
 */
async function archiveFile(filePath, root, dryRun, log) {
  const year = new Date().getFullYear();
  const filename = path.basename(filePath);
  const archiveDir = path.join(root, "ideas", "_archive", year.toString());
  const archivePath = path.join(archiveDir, filename);

  if (dryRun) {
    log.info(`[DRY-RUN] Would archive: ${filename}`);
    return {
      filename,
      archived: false,
      archivePath: `ideas/_archive/${year}/${filename}`,
    };
  }

  // Create archive directory
  await mkdir(archiveDir, { recursive: true });

  // Move file
  await rename(filePath, archivePath);
  log.info(`Archived: ${filename} → ideas/_archive/${year}/`);

  return {
    filename,
    archived: true,
    archivePath: `ideas/_archive/${year}/${filename}`,
  };
}

/**
 * Process single idea file
 * @param {string} filePath - Path to idea file
 * @param {string} filename - Filename
 * @param {object} args - Arguments
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Result
 */
async function processIdeaFile(filePath, filename, args, log) {
  log.debug(`Processing: ${filename}`);

  // Extract issue number
  const issueNumber = await extractIssueNumber(filePath);
  if (!issueNumber) {
    log.warn(`${filename}: No issue number found in metadata`);
    return { status: "skipped", filename, reason: "no-issue-number" };
  }

  // Filter by specific issue if requested
  if (args.issueNumber && issueNumber !== args.issueNumber) {
    return { status: "skipped", filename, reason: "filtered" };
  }

  log.debug(`${filename}: Issue #${issueNumber}`);

  // Check if issue is closed
  const issue = await getIssue(issueNumber);
  if (!issue) {
    log.warn(`${filename}: Issue #${issueNumber} not found`);
    return {
      status: "skipped",
      filename,
      reason: "issue-not-found",
      issueNumber,
    };
  }

  if (issue.state !== "closed") {
    log.info(`${filename}: Issue #${issueNumber} still open`);
    return {
      status: "skipped",
      filename,
      reason: "issue-open",
      issueNumber,
    };
  }

  log.info(
    `${filename}: Issue #${issueNumber} closed (${issue.stateReason || "completed"})`,
  );

  // Archive the file
  const root = await repoRoot(args.cwd);
  const archiveInfo = await archiveFile(filePath, root, args.dryRun, log);

  return {
    status: "archived",
    filename,
    issueNumber,
    stateReason: issue.stateReason,
    ...archiveInfo,
  };
}

/**
 * Execute cleanup workflow
 * @param {object} args - Parsed arguments
 * @param {Logger} log - Logger instance
 * @returns {Promise<object>} Results
 */
async function executeCleanup(args, log) {
  const root = await repoRoot(args.cwd);
  const ideasDir = path.join(root, "ideas");

  log.info(`Scanning ideas directory: ${ideasDir}`);

  const ideaFiles = await findIdeaFiles(ideasDir);

  if (ideaFiles.length === 0) {
    return {
      total: 0,
      archived: 0,
      skipped: 0,
      errors: 0,
      files: [],
    };
  }

  log.info(`Found ${ideaFiles.length} idea file(s)`);

  const results = {
    total: ideaFiles.length,
    archived: 0,
    skipped: 0,
    errors: 0,
    files: [],
  };

  for (const filename of ideaFiles) {
    const filePath = path.join(ideasDir, filename);

    try {
      const result = await processIdeaFile(filePath, filename, args, log);
      results.files.push(result);

      if (result.status === "archived") {
        results.archived++;
      } else if (result.status === "skipped") {
        results.skipped++;
      }
    } catch (error) {
      log.error(`Error processing ${filename}: ${error.message}`);
      results.errors++;
      results.files.push({
        status: "error",
        filename,
        reason: error.message,
      });
    }
  }

  return results;
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  try {
    const args = ArgsSchema.parse({
      ...flags,
      dryRun: !flags.execute,
      issueNumber: flags.issue ? parseInt(flags.issue, 10) : undefined,
    });

    if (args.help) {
      console.log(`
Usage: ${SCRIPT_NAME} [options]

Clean up and archive idea files for closed issues.

Options:
  --help              Show this help message
  --dry-run           Preview without archiving (default)
  --yes               Execute mode (confirms execution, overrides --dry-run)
  --execute           Actually archive files (disables dry-run)
  --output <fmt>      Output format: text (default), json
  --log-level <lvl>   Log level: error, warn, info (default), debug, trace
  --cwd <path>        Working directory (default: current)
  --issue <number>    Only process specific issue number

Examples:
  ${SCRIPT_NAME}                        # Preview what would be archived
  ${SCRIPT_NAME} --execute               # Actually archive files
  ${SCRIPT_NAME} --issue 42              # Only process issue #42
  ${SCRIPT_NAME} --execute --issue 42    # Archive idea for issue #42

Exit codes:
  0  - Success (all processed)
  1  - Some errors occurred
  2  - No idea files found
  10 - Precondition failed (gh not authenticated)
  11 - Validation failed

Note: By default runs in dry-run mode for safety. Use --execute to actually
archive files.
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

    // Execute cleanup
    const results = await executeCleanup(args, log);

    if (results.total === 0) {
      succeed({
        script: SCRIPT_NAME,
        message: "No idea files found",
        exitCode: 2,
        output: args.output,
        data: results,
      });
    }

    if (args.dryRun && results.archived > 0) {
      log.info(
        `\n💡 Run with --execute to actually archive ${results.archived} file(s)`,
      );
    }

    if (!args.dryRun && results.archived > 0) {
      log.info("\n✅ Cleanup complete! Review changes and commit:");
      log.info("   git add ideas/_archive");
      log.info('   git commit -m "chore: archive completed idea files"');
    }

    if (results.errors > 0) {
      fail({
        script: SCRIPT_NAME,
        message: `${results.archived} archived, ${results.errors} errors`,
        exitCode: 1,
        output: args.output,
        data: results,
      });
    }

    succeed({
      script: SCRIPT_NAME,
      message: args.dryRun
        ? `Preview: ${results.archived} would be archived`
        : `Archived ${results.archived} file(s)`,
      output: args.output,
      data: results,
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

    log.error("Failed to cleanup ideas:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
