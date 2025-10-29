#!/usr/bin/env node
/**
 * ideas-to-issues.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Convert idea files to GitHub Issues with proper labels and checklists
 *
 * Reads idea files from /ideas directory and creates corresponding GitHub Issues.
 * Supports parent-child relationships and sub-issues with task lists.
 */

import path from "node:path";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, repoRoot } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";
import { createIssue, getIssue, updateIssue } from "../_lib/github.mjs";
import {
  findIdeaFiles,
  validateIdeaFile,
  extractChecklistItems,
  extractSubIssues,
} from "../_lib/ideas.mjs";

const SCRIPT_NAME = "ideas-to-issues";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  filter: z.string().optional(),
  skipExisting: z.boolean().default(true),
});

/**
 * Generate issue body from idea file
 * @param {object} validation - Validation result from validateIdeaFile
 * @param {string} content - Full file content
 * @param {string} sourceFile - Source file path
 * @returns {string} Issue body
 */
function generateIssueBody(validation, content, sourceFile) {
  const sections = [];

  // Extract Purpose
  const purposeMatch = content.match(/Purpose:\s*(.+?)(?:\n|$)/i);
  if (purposeMatch) {
    sections.push(`**Purpose:** ${purposeMatch[1].trim()}\n`);
  }

  // Extract Problem section
  const problemMatch = content.match(/## Problem\s*([\s\S]*?)(?=\n##|\n$)/);
  if (problemMatch) {
    sections.push(`## Problem\n\n${problemMatch[1].trim()}\n`);
  }

  // Extract Proposal section
  const proposalMatch = content.match(/## Proposal\s*([\s\S]*?)(?=\n##|\n$)/);
  if (proposalMatch) {
    sections.push(`## Proposal\n\n${proposalMatch[1].trim()}\n`);
  }

  // Add Acceptance Checklist
  const checklist = extractChecklistItems(content);
  if (checklist.length > 0) {
    sections.push(`## Acceptance Checklist\n\n`);
    checklist.forEach((item) => {
      sections.push(`- [ ] ${item}\n`);
    });
    sections.push("\n");
  }

  // Add source file footer
  sections.push(`---\n\n*Source: \`${sourceFile}\`*`);

  return sections.join("\n");
}

/**
 * Get labels for idea type
 * @param {string} type - Idea type
 * @param {string} lane - Lane (A, B, C, D)
 * @returns {Array<string>} Labels
 */
const LANE_LABELS = {
  A: "lane-A",
  B: "lane-B",
  C: "lane-C",
  D: "lane-D",
};

function getLabelsForIdea(type, lane) {
  const labels = [];

  if (type) {
    labels.push(`type:${type}`);
  }

  if (lane) {
    const normalizedLane =
      typeof lane === "string" ? lane.trim().toUpperCase() : lane;
    const fallbackLane =
      typeof normalizedLane === "string"
        ? normalizedLane.toLowerCase()
        : normalizedLane;
    const laneLabel = LANE_LABELS[normalizedLane] || `lane-${fallbackLane}`;
    labels.push(laneLabel);
  }

  return labels;
}

/**
 * Check if issue already exists with exact title match
 * @param {string} title - Issue title
 * @returns {Promise<number|null>} Existing issue number or null
 */
async function findExistingIssue(title) {
  try {
    const { stdout } = await execCommand("gh", [
      "issue",
      "list",
      "--search",
      title,
      "--json",
      "number,title",
      "--limit",
      "10",
    ]);

    const results = JSON.parse(stdout);
    const exact = results.find((issue) => issue.title === title);
    return exact ? exact.number : null;
  } catch {
    return null;
  }
}

/**
 * Update parent issue with sub-issues task list
 * @param {number} parentNumber - Parent issue number
 * @param {Array<object>} children - Child issues
 * @param {Logger} log - Logger
 */
async function updateParentWithChildren(parentNumber, children, log) {
  try {
    const parent = await getIssue(parentNumber);
    if (!parent) {
      log.warn(`Parent issue #${parentNumber} not found`);
      return;
    }

    const existingBody = parent.body || "";
    const subIssuesRegex = /##\s*Sub-Issues\s*([\s\S]*?)(?=\n##|\n$|$)/i;

    const previousStatuses = new Map();
    const existingSectionMatch = existingBody.match(subIssuesRegex);
    if (existingSectionMatch && existingSectionMatch[1]) {
      const lines = existingSectionMatch[1].split("\n");
      for (const line of lines) {
        const statusMatch = line.match(/- \[(x|\s)\]\s+#(\d+)/i);
        if (statusMatch) {
          const issueId = parseInt(statusMatch[2], 10);
          if (!Number.isNaN(issueId)) {
            previousStatuses.set(
              issueId,
              statusMatch[1].trim().toLowerCase() === "x",
            );
          }
        }
      }
    }

    // Build task list
    const taskList = children
      .map((child) => {
        const issueNumber = Number(child.number);
        const isComplete =
          !Number.isNaN(issueNumber) && previousStatuses.get(issueNumber);
        const checkbox = isComplete ? "x" : " ";
        return `- [${checkbox}] #${child.number} ${child.title}`;
      })
      .join("\n");

    const sectionHeader = "## Sub-Issues";
    const sectionContent =
      taskList.length > 0
        ? `${sectionHeader}\n\n${taskList}`
        : `${sectionHeader}\n`;

    let updatedBody;
    if (subIssuesRegex.test(existingBody)) {
      updatedBody = existingBody.replace(subIssuesRegex, sectionContent);
    } else {
      const trimmed = existingBody.trimEnd();
      updatedBody =
        trimmed.length > 0
          ? `${trimmed}\n\n${sectionContent}`
          : `${sectionContent}`;
    }

    if (!updatedBody.endsWith("\n")) {
      updatedBody += "\n";
    }

    await updateIssue(parentNumber, { body: updatedBody });
    log.info(
      `Updated parent issue #${parentNumber} with ${children.length} sub-issues`,
    );
  } catch (error) {
    log.warn(`Failed to update parent issue: ${error.message}`);
  }
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
  const { readFile } = await import("node:fs/promises");

  log.debug(`Processing: ${filename}`);

  // Validate idea file
  const validation = await validateIdeaFile(filePath);

  if (!validation.valid) {
    log.error(`Invalid idea file: ${filename}`);
    validation.errors.forEach((err) => log.error(`  - ${err}`));
    return { status: "invalid", filename };
  }

  const { metadata } = validation;
  if (!metadata.title) {
    log.warn(`Skipping ${filename}: No title`);
    return { status: "skipped", filename, reason: "no title" };
  }

  if (!metadata.lane) {
    log.warn(`Skipping ${filename}: No lane`);
    return { status: "skipped", filename, reason: "no lane" };
  }

  // Check for existing issue
  if (args.skipExisting) {
    const existing = await findExistingIssue(metadata.title);
    if (existing) {
      log.info(`Skipping ${filename}: Issue #${existing} already exists`);
      return {
        status: "skipped",
        filename,
        reason: "exists",
        issueNumber: existing,
      };
    }
  }

  if (args.dryRun) {
    log.info(`[DRY-RUN] Would create issue: ${metadata.title}`);
    return { status: "dry-run", filename, title: metadata.title };
  }

  // Read full content for body generation
  const content = await readFile(filePath, "utf-8");
  const sourceFile = `/ideas/${filename}`;

  // Generate issue body
  const body = generateIssueBody(validation, content, sourceFile);
  const labels = getLabelsForIdea(validation.type, metadata.lane);

  // Create issue
  try {
    const issueUrl = await createIssue(metadata.title, body, false, labels);
    const issueNumber = issueUrl
      ? parseInt(issueUrl.split("/").pop(), 10)
      : null;

    if (issueNumber) {
      log.info(`Created issue #${issueNumber}: ${metadata.title}`);

      // Process sub-issues
      const subIssues = extractSubIssues(content);
      const childIssues = [];

      if (subIssues.length > 0) {
        log.info(`Processing ${subIssues.length} sub-issue(s)...`);

        for (const subIssue of subIssues) {
          const subResult = await processSubIssue(
            subIssue,
            issueNumber,
            args,
            log,
          );
          if (subResult && subResult.issueNumber) {
            childIssues.push({
              number: subResult.issueNumber,
              title: subResult.title,
            });
          }
        }

        // Update parent with children
        if (childIssues.length > 0) {
          await updateParentWithChildren(issueNumber, childIssues, log);
        }
      }

      return {
        status: "created",
        filename,
        issueNumber,
        title: metadata.title,
        childCount: childIssues.length,
      };
    }

    return { status: "failed", filename, reason: "creation failed" };
  } catch (error) {
    log.error(`Failed to create issue: ${error.message}`);
    return { status: "failed", filename, reason: error.message };
  }
}

/**
 * Process sub-issue
 * @param {object} subIssue - Sub-issue data
 * @param {number} parentNumber - Parent issue number
 * @param {object} args - Arguments
 * @param {Logger} log - Logger
 * @returns {Promise<object|null>} Result
 */
async function processSubIssue(subIssue, parentNumber, args, log) {
  const root = await repoRoot(args.cwd);
  const ideasDir = path.join(root, "ideas");

  try {
    // Find idea file for sub-issue
    const files = await findIdeaFiles(ideasDir, subIssue.id);
    if (files.length === 0) {
      log.warn(`  No idea file found for: ${subIssue.id}`);
      return null;
    }

    const filePath = path.join(ideasDir, files[0]);
    const result = await processIdeaFile(filePath, files[0], args, log);

    if (result.status === "created") {
      log.info(`  Created sub-issue #${result.issueNumber}: ${result.title}`);
      return result;
    } else if (result.status === "skipped" && result.issueNumber) {
      log.info(`  Sub-issue already exists: #${result.issueNumber}`);
      return result;
    }

    return null;
  } catch (error) {
    log.error(`  Error processing sub-issue ${subIssue.id}: ${error.message}`);
    return null;
  }
}

/**
 * Execute ideas to issues conversion
 * @param {object} args - Parsed arguments
 * @param {Logger} log - Logger instance
 * @returns {Promise<object>} Results
 */
async function executeConversion(args, log) {
  const root = await repoRoot(args.cwd);
  const ideasDir = path.join(root, "ideas");

  log.info(`Scanning ideas directory: ${ideasDir}`);

  const ideaFiles = await findIdeaFiles(ideasDir, args.filter);

  if (ideaFiles.length === 0) {
    return {
      total: 0,
      created: 0,
      failed: 0,
      skipped: 0,
      invalid: 0,
      files: [],
    };
  }

  log.info(`Found ${ideaFiles.length} idea file(s)`);

  const results = {
    total: ideaFiles.length,
    created: 0,
    failed: 0,
    skipped: 0,
    invalid: 0,
    files: [],
  };

  for (const filename of ideaFiles) {
    const filePath = path.join(ideasDir, filename);
    const result = await processIdeaFile(filePath, filename, args, log);

    results.files.push(result);

    if (result.status === "created") {
      results.created++;
    } else if (result.status === "failed") {
      results.failed++;
    } else if (result.status === "skipped") {
      results.skipped++;
    } else if (result.status === "invalid") {
      results.invalid++;
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

Convert idea files from /ideas directory to GitHub Issues.

Options:
  --help              Show this help message
  --dry-run           Preview without creating issues
  --yes               Execute mode (confirms execution, overrides --dry-run)
  --output <fmt>      Output format: text (default), json
  --log-level <lvl>   Log level: error, warn, info (default), debug, trace
  --cwd <path>        Working directory (default: current)
  --filter <pattern>  Only process files matching pattern
  --skip-existing     Skip ideas with existing issues (default: true)

Examples:
  ${SCRIPT_NAME}                        # Process all idea files
  ${SCRIPT_NAME} --dry-run               # Preview what would be created
  ${SCRIPT_NAME} --filter U-              # Only process unit ideas
  ${SCRIPT_NAME} --output json            # JSON output for CI

Exit codes:
  0  - Success (all issues created)
  1  - Some issues failed
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

    // Execute conversion
    const results = await executeConversion(args, log);

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
        message: `${results.created} created, ${results.failed} failed`,
        exitCode: 1,
        output: args.output,
        data: results,
      });
    }

    succeed({
      script: SCRIPT_NAME,
      message: `Successfully processed ${results.created} idea(s)`,
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

    log.error("Failed to convert ideas:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
