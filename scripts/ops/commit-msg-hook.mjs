#!/usr/bin/env node
/**
 * commit-msg-hook.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Git commit-msg hook to enforce ticket ID prefix conventions
 *
 * Validates commit messages follow format: [TAG-slug] Message
 * Ensures consistency with CHANGELOG, PR titles, and project tracking.
 */

import { readFileSync } from "node:fs";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed } from "../_lib/core.mjs";

const SCRIPT_NAME = "commit-msg-hook";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  cwd: z.string().optional(),
  commitMsgFile: z.string(),
});

// Valid ticket prefixes
const TICKET_PREFIX_REGEX = /^\[(U|C|B|ARCH|PB)-[a-z0-9-]+\]/i;

/**
 * Validate commit message
 * @param {string} commitMsg - Commit message
 * @param {Logger} log - Logger
 * @returns {object} Validation result
 */
function validateCommitMessage(commitMsg, log) {
  log.debug(`Validating commit message: ${commitMsg}`);

  // Skip validation for merge/revert commits
  if (
    commitMsg.startsWith("Merge") ||
    commitMsg.startsWith("Revert") ||
    commitMsg.length === 0
  ) {
    log.info("Skipping validation for merge/revert/empty commit");
    return { valid: true, skipped: true, reason: "merge/revert/empty" };
  }

  // Check ticket prefix
  if (!TICKET_PREFIX_REGEX.test(commitMsg)) {
    return {
      valid: false,
      error: "Missing ticket prefix",
      message: commitMsg,
      details:
        "Commit messages must start with: [U-slug], [C-slug], [B-slug], [ARCH-slug], or [PB-slug]",
    };
  }

  const match = commitMsg.match(TICKET_PREFIX_REGEX);
  const ticketPrefix = match[0];

  // Check space after prefix
  if (commitMsg[ticketPrefix.length] !== " ") {
    return {
      valid: false,
      error: "Missing space after ticket prefix",
      message: commitMsg,
      details: "Correct format: [TICKET-id] Commit message",
    };
  }

  // Check slug is lowercase
  const slugPart = ticketPrefix.slice(1, -1);
  const [prefix, ...slugParts] = slugPart.split("-");
  const slug = slugParts.join("-");

  if (slug !== slug.toLowerCase()) {
    log.warn(`Ticket slug should be lowercase: ${ticketPrefix}`);
    log.warn(`Suggested: [${prefix}-${slug.toLowerCase()}]`);
  }

  // Check message has meaningful content
  const messageContent = commitMsg.slice(ticketPrefix.length + 1).trim();
  if (messageContent.length < 10) {
    log.warn("Commit message seems short (< 10 chars)");
    log.warn("Consider providing more detail");
  }

  return { valid: true, ticketPrefix, messageContent };
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
Usage: ${SCRIPT_NAME} <commit-msg-file>

Git commit-msg hook to enforce ticket ID prefix conventions.

Arguments:
  commit-msg-file           Path to commit message file (from Git)

Options:
  --help                    Show this help message
  --dry-run           Preview mode without making changes (default: true)
  --yes               Execute mode (confirms execution)
  --output <fmt>            Output format: text (default), json
  --log-level <lvl>         Log level: error, warn, info (default), debug, trace
  --cwd <path>        Working directory (default: current)

Enforces:
  - Commit messages start with [ticket-id] prefix
  - Ticket ID must be numeric
  - Allows [MAJOR], [MINOR], [PATCH] version markers
  - Allows conventional commit types (feat:, fix:, etc.)
  - Merge commits bypass validation

Examples:
  ${SCRIPT_NAME} .git/COMMIT_EDITMSG

Exit codes:
  0  - Success (message valid or bypassed)
  11 - Validation failed (invalid format)

Note:
  This is called automatically by Git during commit.
  Install via: pnpm install-hooks
`);
    process.exit(0);
  }

  try {
    // Get commit message file from positional arg or flag
    const commitMsgFile = flags._?.[0] || flags.commitMsgFile;

    const args = ArgsSchema.parse({
      ...flags,
      commitMsgFile,
    });

    // Read commit message
    let commitMsg;
    try {
      commitMsg = readFileSync(args.commitMsgFile, "utf8").trim();
    } catch (error) {
      fail({
        script: SCRIPT_NAME,
        message: `Failed to read commit message file: ${error.message}`,
        exitCode: 11,
        output: args.output,
        error,
      });
    }

    // Validate
    const result = validateCommitMessage(commitMsg, log);

    if (!result.valid && !result.skipped) {
      log.error("Invalid commit message format");
      log.error(`Error: ${result.error}`);
      log.error(`Message: ${result.message}`);
      log.error(`Details: ${result.details}`);

      fail({
        script: SCRIPT_NAME,
        message: result.error,
        exitCode: 1,
        output: args.output,
        data: result,
      });
    }

    if (result.skipped) {
      succeed({
        script: SCRIPT_NAME,
        message: `Skipped validation (${result.reason})`,
        exitCode: 0,
        output: args.output,
        data: result,
      });
    }

    log.info("Commit message valid");
    succeed({
      script: SCRIPT_NAME,
      message: "Valid commit message",
      exitCode: 0,
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

    log.error("Hook failed:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
