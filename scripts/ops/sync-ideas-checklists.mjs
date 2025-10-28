#!/usr/bin/env node
/**
 * sync-ideas-checklists.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Sync acceptance checklists from idea files to GitHub Issues
 *
 * Updates GitHub issue bodies with latest acceptance checklists from corresponding
 * idea files. Useful for keeping issues in sync after checklist changes.
 */

import path from "node:path";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, repoRoot } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";
import { updateIssue } from "../_lib/github.mjs";
import { findIdeaFiles, extractChecklistItems } from "../_lib/ideas.mjs";

const SCRIPT_NAME = "sync-ideas-checklists";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  filter: z.string().optional(),
  force: z.boolean().default(false),
});

/**
 * Find issue by ticket ID (idea filename without extension)
 * @param {string} ticketId - Ticket ID (e.g., "U-bridge-intro")
 * @returns {Promise<object|null>} Issue or null
 */
async function findIssueByTicketId(ticketId) {
  try {
    const { stdout } = await execCommand("gh", [
      "issue",
      "list",
      "--search",
      ticketId,
      "--json",
      "number,title,body",
      "--limit",
      "10",
    ]);

    const issues = JSON.parse(stdout);

    // Find exact match in title
    const match = issues.find(
      (issue) =>
        issue.title.includes(`[${ticketId}]`) ||
        issue.title.startsWith(`${ticketId}:`) ||
        issue.title.includes(ticketId),
    );

    return match || null;
  } catch {
    return null;
  }
}

/**
 * Update issue body with new checklist
 * @param {number} issueNumber - Issue number
 * @param {string} currentBody - Current issue body
 * @param {Array<string>} newChecklist - New checklist items
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<boolean>} Success
 */
async function updateIssueChecklist(
  issueNumber,
  currentBody,
  newChecklist,
  dryRun,
  log,
) {
  // Build checklist section
  const checklistSection = `## Acceptance Checklist\n\n${newChecklist
    .map((item) => `- [ ] ${item}`)
    .join("\n")}`;

  let updatedBody;
  if (currentBody && currentBody.includes("## Acceptance Checklist")) {
    // Replace existing checklist
    updatedBody = currentBody.replace(
      /## Acceptance Checklist[\s\S]*?(?=\n##|\n$|$)/,
      checklistSection,
    );
  } else {
    // Append checklist
    updatedBody = `${currentBody || ""}\n\n${checklistSection}`;
  }

  if (dryRun) {
    log.info(`[DRY-RUN] Would update issue #${issueNumber}`);
    log.debug(`Checklist items: ${newChecklist.length}`);
    return true;
  }

  try {
    await updateIssue(issueNumber, { body: updatedBody });
    log.info(`Updated issue #${issueNumber}`);
    return true;
  } catch (error) {
    log.error(`Failed to update issue #${issueNumber}: ${error.message}`);
    return false;
  }
}

/**
 * Sync single idea file to its issue
 * @param {string} filePath - Path to idea file
 * @param {string} filename - Filename
 * @param {object} args - Arguments
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Result
 */
async function syncIdeaFile(filePath, filename, args, log) {
  log.debug(`Processing: ${filename}`);

  // Extract ticket ID from filename
  const ticketId = filename.replace(/\.md$/, "");

  // Read file and extract checklist
  const content = await readFile(filePath, "utf-8");
  const checklist = extractChecklistItems(content);

  if (checklist.length === 0) {
    log.warn(`No checklist found in ${filename}`);
    return { status: "skipped", filename, reason: "no-checklist" };
  }

  log.debug(`Found ${checklist.length} checklist items`);

  // Find matching issue
  const issue = await findIssueByTicketId(ticketId);
  if (!issue) {
    log.warn(`No matching issue found for ${ticketId}`);
    return { status: "skipped", filename, reason: "no-issue" };
  }

  log.info(`Found issue #${issue.number}: ${issue.title}`);

  // Check if checklist is already up to date
  if (!args.force && issue.body) {
    const currentChecklist = extractChecklistItems(issue.body);
    if (
      currentChecklist.length === checklist.length &&
      currentChecklist.every((item, idx) => item === checklist[idx])
    ) {
      log.info(`Issue #${issue.number} already up to date`);
      return {
        status: "skipped",
        filename,
        reason: "up-to-date",
        issueNumber: issue.number,
      };
    }
  }

  // Update issue
  const success = await updateIssueChecklist(
    issue.number,
    issue.body || "",
    checklist,
    args.dryRun,
    log,
  );

  return {
    status: success ? "synced" : "failed",
    filename,
    issueNumber: issue.number,
    checklistCount: checklist.length,
  };
}

/**
 * Execute sync workflow
 * @param {object} args - Parsed arguments
 * @param {Logger} log - Logger instance
 * @returns {Promise<object>} Results
 */
async function executeSyncWorkflow(args, log) {
  const root = await repoRoot(args.cwd);
  const ideasDir = path.join(root, "ideas");

  log.info(`Scanning ideas directory: ${ideasDir}`);

  const ideaFiles = await findIdeaFiles(ideasDir, args.filter);

  if (ideaFiles.length === 0) {
    return {
      total: 0,
      synced: 0,
      failed: 0,
      skipped: 0,
      files: [],
    };
  }

  log.info(`Found ${ideaFiles.length} idea file(s)`);

  const results = {
    total: ideaFiles.length,
    synced: 0,
    failed: 0,
    skipped: 0,
    files: [],
  };

  for (const filename of ideaFiles) {
    const filePath = path.join(ideasDir, filename);

    try {
      const result = await syncIdeaFile(filePath, filename, args, log);
      results.files.push(result);

      if (result.status === "synced") {
        results.synced++;
      } else if (result.status === "failed") {
        results.failed++;
      } else if (result.status === "skipped") {
        results.skipped++;
      }
    } catch (error) {
      log.error(`Error processing ${filename}: ${error.message}`);
      results.failed++;
      results.files.push({
        status: "failed",
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
    const args = ArgsSchema.parse(flags);

    if (args.help) {
      console.log(`
Usage: ${SCRIPT_NAME} [options]

Sync acceptance checklists from idea files to GitHub Issues.

Options:
  --help              Show this help message
  --dry-run           Preview without updating issues
  --output <fmt>      Output format: text (default), json
  --log-level <lvl>   Log level: error, warn, info (default), debug, trace
  --cwd <path>        Working directory (default: current)
  --filter <pattern>  Only process files matching pattern
  --force             Update even if checklist appears unchanged

Examples:
  ${SCRIPT_NAME}                        # Sync all idea files
  ${SCRIPT_NAME} --dry-run               # Preview changes
  ${SCRIPT_NAME} --filter U-              # Only sync unit ideas
  ${SCRIPT_NAME} --force                 # Force update all

Exit codes:
  0  - Success (all synced)
  1  - Some updates failed
  2  - No idea files found
  10 - Precondition failed (gh not authenticated)
  11 - Validation failed
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

    // Execute sync
    const results = await executeSyncWorkflow(args, log);

    if (results.total === 0) {
      succeed({
        script: SCRIPT_NAME,
        message: args.filter
          ? `No idea files matching: ${args.filter}`
          : "No idea files found",
        exitCode: 2,
        output: args.output,
        data: results,
      });
    }

    if (results.failed > 0) {
      fail({
        script: SCRIPT_NAME,
        message: `${results.synced} synced, ${results.failed} failed`,
        exitCode: 1,
        output: args.output,
        data: results,
      });
    }

    succeed({
      script: SCRIPT_NAME,
      message: `Successfully synced ${results.synced} idea(s)`,
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

    log.error("Failed to sync checklists:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
