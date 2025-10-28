#!/usr/bin/env node
/**
 * prepare-gh.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Prepare local environment for GitHub CLI workflows
 *
 * Checks gh CLI installation, authentication, and repository access.
 * Provides setup instructions if needed.
 */

import { z } from "zod";
import { execa } from "execa";
import { Logger, parseFlags, fail, succeed } from "../_lib/core.mjs";

const SCRIPT_NAME = "prepare-gh";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  fix: z.boolean().default(false),
});

/**
 * Check if gh CLI is installed
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Result
 */
async function checkGhInstalled(log) {
  try {
    const { stdout } = await execa("gh", ["--version"]);
    const version = stdout.split("\n")[0];
    log.info("GitHub CLI installed");
    log.debug(version);
    return { installed: true, version };
  } catch {
    log.error("GitHub CLI not installed");
    log.info("Install instructions:");
    log.info("  macOS: brew install gh");
    log.info("  Linux: See https://cli.github.com/manual/installation");
    return { installed: false };
  }
}

/**
 * Check if gh CLI is authenticated
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Result
 */
async function checkGhAuth(log) {
  try {
    const { stdout } = await execa("gh", ["auth", "status"]);
    const lines = stdout.split("\n");
    const accountLine = lines.find((line) => line.includes("Logged in to"));
    log.info("GitHub CLI authenticated");
    if (accountLine) {
      log.debug(accountLine.trim());
    }
    return { authenticated: true, account: accountLine };
  } catch {
    log.error("GitHub CLI not authenticated");
    log.info("Authentication required:");
    log.info("  Run: gh auth login");
    log.info("  Follow prompts to authenticate via web browser or token");
    return { authenticated: false };
  }
}

/**
 * Check repository access
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Result
 */
async function checkRepoAccess(log) {
  try {
    const { stdout } = await execa("gh", [
      "repo",
      "view",
      "--json",
      "nameWithOwner",
    ]);
    const data = JSON.parse(stdout);
    log.info("Repository access verified");
    log.debug(data.nameWithOwner);
    return { hasAccess: true, repo: data.nameWithOwner };
  } catch {
    log.warn("Could not verify repository access");
    log.info("Make sure you're in a git repository and have access");
    return { hasAccess: false };
  }
}

/**
 * Test CI monitoring commands
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Result
 */
async function testCiCommands(log) {
  log.info("Testing CI monitoring commands...");

  try {
    const { stdout } = await execa("gh", [
      "run",
      "list",
      "--limit",
      "1",
      "--json",
      "name,status,conclusion",
    ]);
    const data = JSON.parse(stdout);

    if (data && data.length > 0) {
      log.info("CI monitoring works");
      log.debug(`Latest run: ${data[0].name} - ${data[0].status}`);
      return { ciWorks: true, latestRun: data[0] };
    } else {
      log.info("No workflow runs found (repo may be new)");
      return { ciWorks: true, latestRun: null };
    }
  } catch (error) {
    log.warn(`CI monitoring command failed: ${error.message}`);
    return { ciWorks: false, error: error.message };
  }
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

Prepare local environment for GitHub CLI workflows.

Options:
  --help                    Show this help message
  --dry-run           Preview mode without making changes (default: true)
  --yes               Execute mode (confirms execution)
  --output <fmt>            Output format: text (default), json
  --log-level <lvl>         Log level: error, warn, info (default), debug, trace
  --cwd <path>              Working directory (default: current)
  --fix                     Attempt to fix issues (interactive)

Checks:
  1. GitHub CLI (gh) installed
  2. GitHub CLI authenticated
  3. Repository access
  4. CI monitoring commands work

Examples:
  ${SCRIPT_NAME}                           # Check environment
  ${SCRIPT_NAME} --output json             # JSON output

Exit codes:
  0  - All checks passed
  1  - Setup incomplete
  10 - GitHub CLI not installed
  11 - GitHub CLI not authenticated

Prerequisites:
  - Git repository
  - GitHub CLI (gh) - install from https://cli.github.com

Available CI Commands:
  pnpm ci:check       - Check latest CI status
  pnpm ci:watch       - Watch CI status (auto-refresh)
  pnpm pr:generate    - Generate PR title/body from changelog

Manual Commands:
  gh run list                         - List all workflow runs
  gh run view <run-id>                - View specific run
  gh run watch                        - Watch current run
  gh workflow run <workflow.yml>      - Trigger workflow
`);
      process.exit(0);
    }

    log.info("GitHub CLI environment check");

    const results = {
      installed: false,
      authenticated: false,
      repoAccess: false,
      ciWorks: false,
    };

    // Check installation
    const installCheck = await checkGhInstalled(log);
    results.installed = installCheck.installed;

    if (!installCheck.installed) {
      fail({
        script: SCRIPT_NAME,
        message: "GitHub CLI not installed",
        exitCode: 10,
        output: args.output,
        data: results,
      });
    }

    // Check authentication
    const authCheck = await checkGhAuth(log);
    results.authenticated = authCheck.authenticated;

    if (!authCheck.authenticated) {
      fail({
        script: SCRIPT_NAME,
        message: "GitHub CLI not authenticated",
        exitCode: 11,
        output: args.output,
        data: results,
      });
    }

    // Check repo access
    const repoCheck = await checkRepoAccess(log);
    results.repoAccess = repoCheck.hasAccess;

    // Test CI commands
    if (repoCheck.hasAccess) {
      const ciCheck = await testCiCommands(log);
      results.ciWorks = ciCheck.ciWorks;
    }

    const allPassed =
      results.installed &&
      results.authenticated &&
      results.repoAccess &&
      results.ciWorks;

    if (allPassed) {
      log.info("All checks passed - GitHub CLI ready!");
      succeed({
        script: SCRIPT_NAME,
        message: "GitHub CLI ready",
        output: args.output,
        data: results,
      });
    } else {
      log.warn("Setup incomplete - follow instructions above");
      fail({
        script: SCRIPT_NAME,
        message: "Setup incomplete",
        exitCode: 1,
        output: args.output,
        data: results,
      });
    }
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

    log.error("Environment check failed:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
