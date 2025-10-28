#!/usr/bin/env node
/**
 * manual-update-pr-checkboxes.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Update checkboxes in PR body for Acceptance Checklist and Related Issue sections
 *
 * Manually check/uncheck specific checklist items in PR body by index.
 * Useful for marking completed acceptance criteria or related issues.
 */

import { z } from "zod";
import { Logger, parseFlags, fail, succeed } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";

const SCRIPT_NAME = "manual-update-pr-checkboxes";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  prNumber: z.number(),
  acceptance: z.array(z.number()).default([]),
  related: z.array(z.number()).default([]),
});

/**
 * Update checkboxes in section by index
 * @param {string} section - Section content
 * @param {Array<number>} checkedIndexes - 1-indexed positions to check
 * @returns {string} Updated section
 */
function updateCheckboxesInSection(section, checkedIndexes) {
  let idx = 0;
  return section.replace(/- \[.\] /g, () => {
    idx++;
    return checkedIndexes.includes(idx) ? "- [x] " : "- [ ] ";
  });
}

/**
 * Update PR body checkboxes
 * @param {number} prNumber - PR number
 * @param {Array<number>} acceptance - Acceptance checklist indexes to check
 * @param {Array<number>} related - Related issue indexes to check
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Result
 */
async function updatePRCheckboxes(prNumber, acceptance, related, dryRun, log) {
  log.info(`Fetching PR #${prNumber}...`);

  // Fetch PR body
  const { stdout } = await execCommand("gh", [
    "pr",
    "view",
    prNumber.toString(),
    "--json",
    "body",
    "-q",
    ".body",
  ]);
  let body = stdout;

  const changes = {
    acceptance: 0,
    related: 0,
  };

  // Update Acceptance Checklist
  if (acceptance.length > 0) {
    log.debug(`Updating acceptance checkboxes: ${acceptance.join(", ")}`);
    body = body.replace(
      /(# Acceptance Checklist\n+)([\s\S]*?)(\n+---|\n+#|$)/,
      (match, header, section, tail) => {
        const updated = updateCheckboxesInSection(section, acceptance);
        if (updated !== section) changes.acceptance = acceptance.length;
        return `${header}${updated}${tail}`;
      },
    );
  }

  // Update Related Issue checkboxes
  if (related.length > 0) {
    log.debug(`Updating related issue checkboxes: ${related.join(", ")}`);
    body = body.replace(
      /(# Related Issue\n+)([\s\S]*?)(\n+#|$)/,
      (match, header, section, tail) => {
        const updated = updateCheckboxesInSection(section, related);
        if (updated !== section) changes.related = related.length;
        return `${header}${updated}${tail}`;
      },
    );
  }

  if (dryRun) {
    log.info("[DRY-RUN] Would update PR body");
    log.debug("Updated body preview:");
    log.debug(body.slice(0, 300) + "...");
    return { prNumber, changes, updated: false };
  }

  // Update PR body
  await execCommand("gh", ["pr", "edit", prNumber.toString(), "--body", body]);
  log.info(`Updated PR #${prNumber}`);

  return { prNumber, changes, updated: true };
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
Usage: ${SCRIPT_NAME} <pr-number> [options]

Update checkboxes in PR body for Acceptance Checklist and Related Issue sections.

Options:
  --help                    Show this help message
  --dry-run                 Preview without updating
  --yes               Execute mode (confirms execution, overrides --dry-run)
  --output <fmt>            Output format: text (default), json
  --log-level <lvl>         Log level: error, warn, info (default), debug, trace
  --cwd <path>              Working directory (default: current)
  --acceptance <indexes>    Comma-separated 1-indexed positions to check
  --related <indexes>       Comma-separated 1-indexed positions to check

Examples:
  ${SCRIPT_NAME} 123 --acceptance 1,3          # Check items 1 and 3 in Acceptance Checklist
  ${SCRIPT_NAME} 123 --related 1               # Check item 1 in Related Issue
  ${SCRIPT_NAME} 123 --acceptance 1,2,3        # Check multiple items

Exit codes:
  0  - Success (checkboxes updated)
  10 - Precondition failed (gh not authenticated)
  11 - Validation failed
`);
    process.exit(0);
  }

  try {
    // Parse PR number from positional arg
    const prNumber = parseInt(flags._?.[0], 10);
    if (!prNumber || isNaN(prNumber)) {
      throw new Error("PR number required as first argument");
    }

    // Parse acceptance and related indexes
    const acceptance = flags.acceptance
      ? flags.acceptance
          .toString()
          .split(",")
          .map((n) => parseInt(n.trim(), 10))
      : [];
    const related = flags.related
      ? flags.related
          .toString()
          .split(",")
          .map((n) => parseInt(n.trim(), 10))
      : [];

    const args = ArgsSchema.parse({
      ...flags,
      prNumber,
      acceptance,
      related,
    });

    // Validate at least one checkbox list provided
    if (args.acceptance.length === 0 && args.related.length === 0) {
      throw new Error(
        "At least one checkbox list required (--acceptance or --related)",
      );
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

    // Update checkboxes
    const result = await updatePRCheckboxes(
      args.prNumber,
      args.acceptance,
      args.related,
      args.dryRun,
      log,
    );

    if (!result.updated && !args.dryRun) {
      succeed({
        script: SCRIPT_NAME,
        message: "No changes needed",
        exitCode: 2,
        output: args.output,
        data: result,
      });
    }

    succeed({
      script: SCRIPT_NAME,
      message: `Updated PR #${result.prNumber} checkboxes`,
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

    log.error("Failed to update checkboxes:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
