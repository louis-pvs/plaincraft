#!/usr/bin/env node
/**
 * post-checkout.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Git post-checkout hook for automated project setup
 *
 * Runs automatically after git checkout to:
 * 1. Install/update dependencies with pnpm
 * 2. Set local git config from package.json author
 * 3. Publish branch to remote if not already published
 *
 * Can be run manually or via git hooks.
 */

import path from "node:path";
import { z } from "zod";
import {
  Logger,
  parseFlags,
  fail,
  succeed,
  repoRoot,
  readJSON,
} from "../_lib/core.mjs";
import { getCurrentBranch, execCommand } from "../_lib/git.mjs";

const SCRIPT_NAME = "post-checkout";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  skipInstall: z.boolean().default(false),
  skipConfig: z.boolean().default(false),
  skipPublish: z.boolean().default(false),
});

/**
 * Check if branch exists on remote
 * @param {string} branchName - Branch name
 * @param {string} cwd - Working directory
 * @returns {Promise<boolean>} Exists on remote
 */
async function branchExistsOnRemote(branchName, cwd) {
  try {
    const { stdout } = await execCommand(
      "git",
      ["ls-remote", "--heads", "origin", branchName],
      { cwd },
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Install dependencies with pnpm
 * @param {string} root - Repository root
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<boolean>} Success
 */
async function installDependencies(root, dryRun, log) {
  log.info("Installing dependencies...");

  if (dryRun) {
    log.info("[DRY-RUN] Would run: pnpm install");
    return true;
  }

  try {
    // Pass through SKIP_SIMPLE_GIT_HOOKS to prevent hook setup issues in worktrees
    const env = process.env.SKIP_SIMPLE_GIT_HOOKS
      ? { ...process.env }
      : process.env;

    await execCommand("pnpm", ["install"], { cwd: root, env });
    log.info("Dependencies installed");
    return true;
  } catch (error) {
    log.error(`Failed to install dependencies: ${error.message}`);
    return false;
  }
}

/**
 * Set git config from package.json author
 * @param {object} author - Author object from package.json
 * @param {string} root - Repository root
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<boolean>} Success
 */
async function setGitConfig(author, root, dryRun, log) {
  log.info("Setting git config...");

  if (!author || !author.name || !author.email) {
    log.warn("No author info in package.json, skipping git config");
    return false;
  }

  if (dryRun) {
    log.info(`[DRY-RUN] Would set user.name: ${author.name}`);
    log.info(`[DRY-RUN] Would set user.email: ${author.email}`);
    return true;
  }

  try {
    // Set local (repository-specific) git config
    await execCommand(
      "git",
      ["config", "--local", "--replace-all", "user.name", author.name],
      { cwd: root },
    );
    log.debug(`Set user.name: ${author.name}`);

    await execCommand(
      "git",
      ["config", "--local", "--replace-all", "user.email", author.email],
      { cwd: root },
    );
    log.debug(`Set user.email: ${author.email}`);

    log.info("Git config set");
    return true;
  } catch (error) {
    log.error(`Failed to set git config: ${error.message}`);
    return false;
  }
}

/**
 * Publish branch to remote
 * @param {string} branchName - Branch name
 * @param {string} root - Repository root
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<boolean>} Success
 */
async function publishBranch(branchName, root, dryRun, log) {
  log.info("Publishing branch to remote...");

  try {
    // Check if branch exists on remote
    const exists = await branchExistsOnRemote(branchName, root);

    if (exists) {
      log.info(`Branch '${branchName}' already exists on remote`);
      return true;
    }

    if (dryRun) {
      log.info(`[DRY-RUN] Would push branch: ${branchName}`);
      return true;
    }

    // Push branch and set upstream
    await execCommand("git", ["push", "-u", "origin", branchName], {
      cwd: root,
    });
    log.info(`Branch '${branchName}' published to origin`);
    return true;
  } catch (error) {
    log.error(`Failed to publish branch: ${error.message}`);
    return false;
  }
}

/**
 * Execute post-checkout workflow
 * @param {object} args - Parsed arguments
 * @param {Logger} log - Logger instance
 * @returns {Promise<object>} Results
 */
async function executePostCheckout(args, log) {
  const root = await repoRoot(args.cwd);

  log.info("Post-checkout setup starting...");

  // Get package.json
  const pkgPath = path.join(root, "package.json");
  const pkg = await readJSON(pkgPath);

  // Get current branch
  const currentBranch = await getCurrentBranch(root);
  log.info(`Current branch: ${currentBranch}`);

  // Check if protected branch
  const protectedBranches = ["main", "develop", "master"];
  const isProtected = protectedBranches.includes(currentBranch);

  const results = {
    branch: currentBranch,
    isProtected,
    install: { success: false, skipped: false },
    config: { success: false, skipped: false },
    publish: { success: false, skipped: false },
  };

  // 1. Install dependencies
  if (args.skipInstall) {
    log.info("Skipping dependency installation (--skip-install)");
    results.install.skipped = true;
  } else {
    results.install.success = await installDependencies(root, args.dryRun, log);
  }

  // 2. Set git config
  if (args.skipConfig) {
    log.info("Skipping git config (--skip-config)");
    results.config.skipped = true;
  } else {
    results.config.success = await setGitConfig(
      pkg.author,
      root,
      args.dryRun,
      log,
    );
  }

  // 3. Publish branch (skip for protected branches)
  if (args.skipPublish) {
    log.info("Skipping branch publish (--skip-publish)");
    results.publish.skipped = true;
  } else if (isProtected) {
    log.info(`Skipping branch publish (protected branch: ${currentBranch})`);
    results.publish.skipped = true;
  } else {
    results.publish.success = await publishBranch(
      currentBranch,
      root,
      args.dryRun,
      log,
    );
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

Git post-checkout hook for automated project setup.

Automatically runs after git checkout to:
  1. Install/update dependencies with pnpm
  2. Set local git config from package.json author
  3. Publish branch to remote if not already published

Options:
  --help              Show this help message
  --dry-run           Preview without executing
  --yes               Execute mode (confirms execution, overrides --dry-run)
  --output <fmt>      Output format: text (default), json
  --log-level <lvl>   Log level: error, warn, info (default), debug, trace
  --cwd <path>        Working directory (default: current)
  --skip-install      Skip dependency installation
  --skip-config       Skip git config setup
  --skip-publish      Skip branch publishing

Environment Variables:
  SKIP_SIMPLE_GIT_HOOKS  If set, prevents git hook setup issues in worktrees

Examples:
  ${SCRIPT_NAME}                        # Run full post-checkout setup
  ${SCRIPT_NAME} --dry-run               # Preview what would be done
  ${SCRIPT_NAME} --skip-install          # Only config and publish
  ${SCRIPT_NAME} --skip-publish          # Only install and config

Exit codes:
  0  - Success (all steps completed)
  1  - Some steps failed
  10 - Precondition failed (not in git repo)
  11 - Validation failed

Note: Protected branches (main, develop, master) skip branch publishing.
`);
      process.exit(0);
    }

    // Execute post-checkout workflow
    const results = await executePostCheckout(args, log);

    // Check for failures
    const failures = [];
    if (!results.install.success && !results.install.skipped) {
      failures.push("install");
    }
    if (!results.config.success && !results.config.skipped) {
      failures.push("config");
    }
    if (!results.publish.success && !results.publish.skipped) {
      failures.push("publish");
    }

    if (failures.length > 0) {
      fail({
        script: SCRIPT_NAME,
        message: `Some steps failed: ${failures.join(", ")}`,
        exitCode: 1,
        output: args.output,
        data: results,
      });
    }

    succeed({
      script: SCRIPT_NAME,
      message: "Post-checkout setup complete",
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

    log.error("Post-checkout setup failed:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
