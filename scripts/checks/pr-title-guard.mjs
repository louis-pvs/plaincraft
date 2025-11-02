#!/usr/bin/env node
/**
 * pr-title-guard.mjs
 * @since 2025-11-02
 * @version 0.1.0
 * Enforce PR title format: [ID] Title
 *
 * Policy requirement: PR title must start with [ID] matching the branch ID
 * Example: [ARCH-123] Add Guardrails Suite
 */

import { z } from "zod";
import {
  parseFlags,
  resolveLogLevel,
  fail,
  succeed,
  repoRoot,
  now,
  Logger,
} from "../_lib/core.mjs";
import { getCurrentBranch } from "../_lib/git.mjs";
import { loadLifecycleConfig } from "../_lib/lifecycle.mjs";
import {
  getRepoInfo,
  findPullRequestByBranch,
  verifyGhTokenScopes,
} from "../_lib/github.mjs";

const FLAG_SCHEMA = z.object({
  branch: z.string().optional(),
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.string().optional(),
  logLevel: z.string().optional(),
  cwd: z.string().optional(),
  report: z.boolean().default(false),
});

(async () => {
  const rawFlags = parseFlags(process.argv.slice(2));

  if (rawFlags.help) {
    console.log(`
Usage: pnpm pr:title-guard [--branch <name>]

Options:
  --branch <name>       Branch name to check (default: current branch)
  --dry-run             Included for contract completeness (default)
  --yes                 Execute mode (no effect, read-only)
  --output <format>     json|text (default: text)
  --log-level <level>   trace|debug|info|warn|error
  --cwd <path>          Working directory
  --report              Emit machine-readable JSON summary

Policy Requirement:
  PR title must follow pattern [ID] Title where ID matches the branch ID.
  Example: Branch "feat/ARCH-123-add-guardrails" → Title "[ARCH-123] Add Guardrails Suite"

Exit Codes:
  0  = Valid PR title
  12 = Invalid PR title format or mismatch
  1  = Other error
    `);
    process.exit(0);
  }

  const flags = FLAG_SCHEMA.parse(rawFlags);
  const logLevel = resolveLogLevel(flags.logLevel);
  const log = new Logger("pr-title-guard", logLevel);
  const root = flags.cwd || (await repoRoot());

  try {
    await verifyGhTokenScopes();

    const config = await loadLifecycleConfig(root);
    const branchName = flags.branch || (await getCurrentBranch(root));

    log.debug(`Checking PR title for branch: ${branchName}`);

    // Extract ID from branch
    const branchId = extractBranchId(branchName, config, log);
    if (!branchId) {
      log.error(`Cannot extract ID from branch: ${branchName}`);
      return exit(12, "Branch format invalid", flags);
    }

    log.debug(`Branch ID: ${branchId}`);

    // Get PR for this branch
    const repoInfo = await getRepoInfo();
    const pr = await findPullRequestByBranch(
      repoInfo.owner,
      repoInfo.repo,
      branchName,
    );

    if (!pr) {
      log.warn(`No PR found for branch: ${branchName}`);
      // Not an error - branch may not have PR yet
      return exit(0, "No PR exists for branch", flags);
    }

    log.debug(`Found PR #${pr.number}: ${pr.title}`);

    // Validate PR title format
    const titleMatch = pr.title.match(/^\[([^\]]+)\]\s+(.+)$/);
    if (!titleMatch) {
      log.error(`PR title does not match pattern [ID] Title: "${pr.title}"`);
      log.error(`Expected pattern: ${config.pullRequests.titlePattern}`);
      return exit(12, "PR title format invalid", flags);
    }

    const [, titleId, titleText] = titleMatch;

    // Validate ID matches branch
    if (titleId !== branchId) {
      log.error(
        `PR title ID "${titleId}" does not match branch ID "${branchId}"`,
      );
      log.error(`Branch: ${branchName}`);
      log.error(`PR title: ${pr.title}`);
      return exit(12, "PR title ID mismatch", flags);
    }

    // Validate title is not empty
    if (!titleText || titleText.trim().length === 0) {
      log.error("PR title text is empty after [ID] prefix");
      return exit(12, "PR title text empty", flags);
    }

    log.info(`✓ PR title valid: ${pr.title}`);
    return exit(0, "PR title valid", flags);
  } catch (error) {
    log.error(`Failed to validate PR title: ${error.message}`);
    if (logLevel === "trace" || logLevel === "debug") {
      log.trace(error.stack);
    }
    return exit(1, error.message, flags);
  }
})();

/**
 * Extract ID from branch name
 * @param {string} branch - Branch name (e.g. feat/ARCH-123-slug)
 * @param {object} config - Lifecycle config
 * @param {Logger} log - Logger instance
 * @returns {string|null} ID or null if invalid
 */
function extractBranchId(branch, config, log) {
  // Validate branch format first
  if (!config.branches.regex.test(branch)) {
    log.debug(`Branch does not match pattern: ${config.branches.pattern}`);
    return null;
  }

  // Extract ID from type/ID-slug format
  const parts = branch.split("/");
  if (parts.length !== 2) {
    log.debug("Branch does not have expected type/ID-slug structure");
    return null;
  }

  const [, branchIdSlug] = parts;
  const idMatch = branchIdSlug.match(/^([A-Z]+-[A-Za-z0-9]+)-/);

  if (!idMatch) {
    log.debug("Cannot extract ID from branch ID-slug portion");
    return null;
  }

  return idMatch[1];
}

/**
 * Exit with appropriate code and optional report
 * @param {number} code - Exit code
 * @param {string} message - Status message
 * @param {object} flags - Parsed flags
 * @returns {never}
 */
function exit(code, message, flags) {
  if (flags.report) {
    const report = {
      timestamp: now(),
      check: "pr-title-guard",
      status: code === 0 ? "pass" : "fail",
      exitCode: code,
      message,
    };

    if (flags.output === "json") {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(JSON.stringify(report));
    }
  }

  if (code === 0) {
    succeed(message);
  } else {
    fail(message, code);
  }
}
