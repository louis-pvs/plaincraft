#!/usr/bin/env node
/**
 * setup-labels.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Creates or updates repository lane labels
 *
 * Creates standard lane labels (A, B, C, D) for issue tracking workflow.
 * Safe to run repeatedly - will update existing labels.
 */

import { z } from "zod";
import { Logger, parseFlags, fail, succeed } from "../_lib/core.mjs";
import { isGhAuthenticated, createLabel } from "../_lib/github.mjs";

const SCRIPT_NAME = "setup-labels";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
});

// Lane labels configuration
const LANE_LABELS = [
  {
    name: "lane:A",
    color: "0E8A16",
    description: "Lane A - Discovery & Design",
  },
  {
    name: "lane:B",
    color: "1D76DB",
    description: "Lane B - Active Development",
  },
  {
    name: "lane:C",
    color: "FBCA04",
    description: "Lane C - Review & QA",
  },
  {
    name: "lane:D",
    color: "D93F0B",
    description: "Lane D - Done",
  },
];

/**
 * Setup repository lane labels
 * @param {object} args - Parsed arguments
 * @param {Logger} log - Logger instance
 * @returns {Promise<object>} Result with created/updated labels
 */
async function setupLabels(args, log) {
  const results = {
    created: [],
    updated: [],
    skipped: [],
  };

  // Check GitHub authentication
  const isAuthenticated = await isGhAuthenticated();
  if (!isAuthenticated) {
    throw new Error("GitHub CLI not authenticated. Run: gh auth login");
  }

  log.info(`Setting up ${LANE_LABELS.length} lane labels...`);

  for (const label of LANE_LABELS) {
    if (args.dryRun) {
      log.info(
        `[DRY-RUN] Would create/update label: ${label.name} (${label.color})`,
      );
      results.created.push(label.name);
      continue;
    }

    try {
      await createLabel(label.name, label.color, label.description);
      log.debug(`Created/updated label: ${label.name}`);
      results.created.push(label.name);
    } catch (error) {
      log.warn(`Failed to create label ${label.name}: ${error.message}`);
      results.skipped.push({ label: label.name, error: error.message });
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

Creates or updates repository lane labels (A, B, C, D).

Options:
  --help           Show this help message
  --dry-run        Preview changes without creating labels
  --yes               Execute mode (confirms execution, overrides --dry-run)
  --output <fmt>   Output format: text (default), json
  --log-level <lvl> Log level: error, warn, info (default), debug, trace
  --cwd <path>     Working directory (default: current)

Examples:
  ${SCRIPT_NAME}                    # Create/update all lane labels
  ${SCRIPT_NAME} --dry-run           # Preview what would be created
  ${SCRIPT_NAME} --output json       # JSON output for automation

Exit codes:
  0  - Success (labels created/updated)
  2  - No-op (all labels already exist)
  10 - Precondition failed (gh not authenticated)
  11 - Validation failed (invalid arguments)
`);
      process.exit(0);
    }

    // Run setup
    const results = await setupLabels(args, log);

    // Check if anything was done
    const totalActions = results.created.length + results.updated.length;
    if (totalActions === 0 && results.skipped.length === 0) {
      succeed({
        script: SCRIPT_NAME,
        message: "No labels to create",
        exitCode: 2,
        output: args.output,
        data: results,
      });
    }

    succeed({
      script: SCRIPT_NAME,
      message: `Successfully processed ${totalActions} label(s)`,
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

    if (error.message.includes("not authenticated")) {
      fail({
        script: SCRIPT_NAME,
        message: error.message,
        exitCode: 10,
        output: flags.output || "text",
        error,
      });
    }

    log.error("Failed to setup labels:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
