#!/usr/bin/env node
/**
 * sync-issue-to-card.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Sync GitHub Issue content back to idea card files
 *
 * Fetches issue data and updates corresponding idea file with latest content.
 * Updates sections like Problem, Proposal, Acceptance Checklist, etc.
 */

import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, repoRoot } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";
import { getIssue } from "../_lib/github.mjs";
import { findIdeaFiles } from "../_lib/ideas.mjs";

const SCRIPT_NAME = "sync-issue-to-card";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  issueNumber: z.number(),
});

/**
 * Find idea file for issue
 * @param {number} issueNumber - Issue number
 * @param {object} issue - Issue object
 * @param {string} root - Repository root
 * @returns {Promise<string|null>} Idea file path or null
 */
async function findIdeaForIssue(issueNumber, issue, root) {
  const ideasDir = path.join(root, "ideas");

  // Method 1: Look for source reference in issue body
  if (issue.body) {
    const sourceMatch = issue.body.match(/Source:\s*`([^`]+)`/);
    if (sourceMatch) {
      const sourcePath = sourceMatch[1];
      const filePath = sourcePath.startsWith("/ideas/")
        ? path.join(root, sourcePath.slice(1))
        : path.join(ideasDir, sourcePath);
      return filePath;
    }

    // Method 2: Look for "See /ideas/..." reference
    const seeMatch = issue.body.match(/See\s+\/ideas\/([^\s]+\.md)/);
    if (seeMatch) {
      return path.join(ideasDir, seeMatch[1]);
    }
  }

  // Method 3: Derive from title
  const titleMatch = issue.title.match(/^([A-Z]+-[a-z0-9-]+)/i);
  if (titleMatch) {
    const slug = titleMatch[1];
    const files = await findIdeaFiles(ideasDir, slug);
    if (files.length > 0) {
      return path.join(ideasDir, files[0]);
    }
  }

  return null;
}

/**
 * Parse issue body into sections
 * @param {string} body - Issue body
 * @returns {object} Sections map
 */
function parseIssueSections(body) {
  const sections = {};

  // Split by ## headers
  const parts = body.split(/^##\s+/m);

  for (let i = 1; i < parts.length; i++) {
    const [header, ...contentLines] = parts[i].split("\n");
    const sectionName = header.trim();
    const sectionContent = contentLines.join("\n").trim();

    // Normalize section names
    const normalizedName = sectionName
      .toLowerCase()
      .replace(/acceptance\s+checklist/i, "acceptance")
      .replace(/sub-issues/i, "subissues");

    sections[normalizedName] = sectionContent;
  }

  return sections;
}

/**
 * Update idea file with issue content
 * @param {string} filePath - Path to idea file
 * @param {object} issue - Issue data
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<boolean>} Success
 */
async function updateIdeaFile(filePath, issue, dryRun, log) {
  try {
    const content = await readFile(filePath, "utf-8");
    const sections = parseIssueSections(issue.body || "");

    let updatedContent = content;

    // Update issue number in metadata
    const issueMetadata = `Issue: #${issue.number}`;

    if (/^Issue:\s*#?\d+/m.test(updatedContent)) {
      // Update existing Issue line
      updatedContent = updatedContent.replace(
        /^Issue:\s*#?\d+/m,
        issueMetadata,
      );
    } else {
      // Insert Issue line after Purpose or Parent
      const insertMatch = updatedContent.match(/^(Purpose:.*$|Parent:.*$)/m);
      if (insertMatch) {
        const insertPos = insertMatch.index + insertMatch[0].length;
        updatedContent =
          updatedContent.slice(0, insertPos) +
          "\n" +
          issueMetadata +
          updatedContent.slice(insertPos);
      }
    }

    // Section header mappings
    const sectionHeaders = {
      purpose: "Purpose",
      problem: "Problem",
      proposal: "Proposal",
      acceptance: "Acceptance Checklist",
      subissues: "Sub-Issues",
    };

    // Update each section
    for (const [sectionKey, sectionContent] of Object.entries(sections)) {
      const headerName = sectionHeaders[sectionKey];
      if (!headerName) continue;

      // Skip metadata sections
      if (["details", "source"].includes(sectionKey)) continue;

      // Replace section content
      const sectionRegex = new RegExp(
        `^## ${headerName}\\s*([\\s\\S]*?)(?=\\n##|$)`,
        "m",
      );

      if (sectionRegex.test(updatedContent)) {
        updatedContent = updatedContent.replace(
          sectionRegex,
          `## ${headerName}\n\n${sectionContent}\n`,
        );
      }
    }

    if (dryRun) {
      log.info(`[DRY-RUN] Would update: ${path.basename(filePath)}`);
      log.debug("Updated content preview:");
      log.debug(updatedContent.slice(0, 200) + "...");
      return true;
    }

    await writeFile(filePath, updatedContent, "utf-8");
    log.info(`Updated: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    log.error(`Failed to update idea file: ${error.message}`);
    return false;
  }
}

/**
 * Execute sync workflow
 * @param {object} args - Parsed arguments
 * @param {Logger} log - Logger instance
 * @returns {Promise<object>} Result
 */
async function executeSyncWorkflow(args, log) {
  const root = await repoRoot(args.cwd);

  log.info(`Syncing issue #${args.issueNumber} to idea card...`);

  // Get issue data
  const issue = await getIssue(args.issueNumber);
  if (!issue) {
    throw new Error(`Issue #${args.issueNumber} not found`);
  }

  log.info(`Issue: ${issue.title}`);

  // Find idea file
  const ideaFilePath = await findIdeaForIssue(args.issueNumber, issue, root);
  if (!ideaFilePath) {
    throw new Error(`No idea file found for issue #${args.issueNumber}`);
  }

  log.info(`Found idea file: ${path.basename(ideaFilePath)}`);

  // Update idea file
  const success = await updateIdeaFile(ideaFilePath, issue, args.dryRun, log);

  return {
    issueNumber: args.issueNumber,
    issueTitle: issue.title,
    ideaFile: path.basename(ideaFilePath),
    updated: success,
  };
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  try {
    // Parse issue number from positional arg
    const issueNumber = parseInt(flags._?.[0], 10);
    if (!issueNumber || isNaN(issueNumber)) {
      throw new Error("Issue number required as first argument");
    }

    const args = ArgsSchema.parse({
      ...flags,
      issueNumber,
    });

    if (args.help) {
      console.log(`
Usage: ${SCRIPT_NAME} <issue-number> [options]

Sync GitHub Issue content back to idea card file.

Fetches issue data and updates corresponding idea file with latest:
  - Issue number in metadata
  - Problem section
  - Proposal section
  - Acceptance Checklist
  - Sub-Issues

Options:
  --help              Show this help message
  --dry-run           Preview without updating
  --output <fmt>      Output format: text (default), json
  --log-level <lvl>   Log level: error, warn, info (default), debug, trace
  --cwd <path>        Working directory (default: current)

Examples:
  ${SCRIPT_NAME} 42                     # Sync issue #42 to idea card
  ${SCRIPT_NAME} 42 --dry-run            # Preview changes
  ${SCRIPT_NAME} 42 --output json        # JSON output

Exit codes:
  0  - Success (idea file updated)
  1  - Failed to update
  2  - Idea file not found
  10 - Precondition failed (gh not authenticated)
  11 - Validation failed

Note: Finds idea file by:
  1. Source reference in issue body
  2. "See /ideas/..." link in body
  3. Title pattern matching
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
    const result = await executeSyncWorkflow(args, log);

    if (!result.updated) {
      fail({
        script: SCRIPT_NAME,
        message: "Failed to update idea file",
        exitCode: 1,
        output: args.output,
        data: result,
      });
    }

    succeed({
      script: SCRIPT_NAME,
      message: `Synced issue #${result.issueNumber} to ${result.ideaFile}`,
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

    if (error.message.includes("not found")) {
      fail({
        script: SCRIPT_NAME,
        message: error.message,
        exitCode: 2,
        output: flags.output || "text",
      });
    }

    log.error("Failed to sync issue:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
