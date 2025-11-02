#!/usr/bin/env node
/**
 * duplicate-guard.mjs
 * @since 2025-11-02
 * @version 0.1.0
 * Enforce one branch/PR per ID at a time
 *
 * Policy requirement: Only one open branch and PR per ID allowed
 * Example: If ARCH-123 has open PR, cannot create feat/ARCH-123-v2
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
  ghCommand,
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
Usage: pnpm duplicate:guard [--branch <name>]

Options:
  --branch <name>       Branch name to check (default: current branch)
  --dry-run             Included for contract completeness (default)
  --yes                 Execute mode (no effect, read-only)
  --output <format>     json|text (default: text)
  --log-level <level>   trace|debug|info|warn|error
  --cwd <path>          Working directory
  --report              Emit machine-readable JSON summary

Policy Requirement:
  Only one open branch and PR per ID at a time.
  Example: Cannot have feat/ARCH-123-fix and fix/ARCH-123-update simultaneously.

Exit Codes:
  0  = No duplicates found
  13 = Duplicate branches or PRs detected
  1  = Other error
    `);
    process.exit(0);
  }

  const flags = FLAG_SCHEMA.parse(rawFlags);
  const logLevel = resolveLogLevel(flags.logLevel);
  const log = new Logger("duplicate-guard", logLevel);
  const root = flags.cwd || (await repoRoot());

  try {
    await verifyGhTokenScopes();

    const config = await loadLifecycleConfig(root);
    const branchName = flags.branch || (await getCurrentBranch(root));

    log.debug(`Checking for duplicates of branch: ${branchName}`);

    // Extract ID from current branch
    const branchId = extractBranchId(branchName, config, log);
    if (!branchId) {
      log.warn(`Cannot extract ID from branch: ${branchName}`);
      // Not an error - might be a non-lifecycle branch
      return exit(0, "Branch not lifecycle-compliant, skipping", flags);
    }

    log.debug(`Branch ID: ${branchId}`);

    // Get all open PRs
    const repoInfo = await getRepoInfo();
    const openPRs = await getOpenPullRequests(repoInfo.owner, repoInfo.repo);

    log.debug(`Found ${openPRs.length} open PRs`);

    // Find PRs for this ID
    const duplicatePRs = openPRs.filter((pr) => {
      const prId = extractIdFromBranchOrTitle(
        pr.headRefName,
        pr.title,
        config,
        log,
      );
      return prId === branchId && pr.headRefName !== branchName;
    });

    if (duplicatePRs.length > 0) {
      log.error(
        `Found ${duplicatePRs.length} other open PR(s) for ID ${branchId}:`,
      );
      for (const pr of duplicatePRs) {
        log.error(`  - PR #${pr.number}: ${pr.title} (${pr.headRefName})`);
      }
      log.error("Policy requires only one open branch/PR per ID");
      return exit(13, `Duplicate PRs found for ${branchId}`, flags);
    }

    log.info(`✓ No duplicate branches/PRs for ID ${branchId}`);
    return exit(0, "No duplicates found", flags);
  } catch (error) {
    log.error(`Failed to check for duplicates: ${error.message}`);
    if (logLevel === "trace" || logLevel === "debug") {
      log.trace(error.stack);
    }
    return exit(1, error.message, flags);
  }
})();

/**
 * Get all open pull requests
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Array>} List of open PRs
 */
async function getOpenPullRequests(owner, repo) {
  const result = await ghCommand(
    [
      "pr",
      "list",
      "--repo",
      `${owner}/${repo}`,
      "--state",
      "open",
      "--json",
      "number,title,headRefName",
      "--limit",
      "1000",
    ],
    { json: false }, // --json already in args
  );

  return JSON.parse(result.stdout);
}

/**
 * Extract ID from branch name or PR title
 * @param {string} branch - Branch name
 * @param {string} title - PR title
 * @param {object} config - Lifecycle config
 * @param {Logger} log - Logger instance
 * @returns {string|null} ID or null if not found
 */
function extractIdFromBranchOrTitle(branch, title, config, log) {
  // Try branch first
  const branchId = extractBranchId(branch, config, log);
  if (branchId) return branchId;

  // Fallback to PR title
  const titleMatch = title.match(/^\[([A-Z]+-[A-Za-z0-9]+)\]/);
  if (titleMatch) return titleMatch[1];

  return null;
}

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
      check: "duplicate-guard",
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
