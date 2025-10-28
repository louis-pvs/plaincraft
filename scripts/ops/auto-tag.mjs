#!/usr/bin/env node
/**
 * auto-tag.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Auto-tag releases based on version changes
 *
 * Creates git tags and GitHub releases from version changes.
 * Automatically generates release notes from CHANGELOG.md.
 */

import { readFile } from "node:fs/promises";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, readJSON } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";

const SCRIPT_NAME = "auto-tag";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  version: z.string().optional(),
  createRelease: z.boolean().default(false),
  push: z.boolean().default(false),
});

/**
 * Get current version from package.json
 * @returns {Promise<string>} Version
 */
async function getCurrentVersion() {
  const pkg = await readJSON("package.json");
  return pkg.version;
}

/**
 * Check if tag exists
 * @param {string} tag - Tag name
 * @returns {Promise<boolean>} Tag exists
 */
async function tagExists(tag) {
  try {
    await execCommand("git", ["rev-parse", tag]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract release notes from CHANGELOG.md
 * @param {string} version - Version
 * @param {Logger} log - Logger
 * @returns {Promise<string>} Release notes
 */
async function extractReleaseNotes(version, log) {
  try {
    const changelog = await readFile("CHANGELOG.md", "utf-8");
    const lines = changelog.split("\n");

    let inVersion = false;
    const notes = [];

    for (const line of lines) {
      if (
        line.match(new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\]`))
      ) {
        inVersion = true;
        continue;
      }

      if (inVersion && line.startsWith("## [")) {
        break;
      }

      if (inVersion) {
        notes.push(line);
      }
    }

    return notes.join("\n").trim();
  } catch (error) {
    log.warn(`Could not read CHANGELOG.md: ${error.message}`);
    return "";
  }
}

/**
 * Create git tag
 * @param {string} version - Version
 * @param {string} message - Tag message
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Result
 */
async function createTag(version, message, dryRun, log) {
  const tag = `v${version}`;

  if (await tagExists(tag)) {
    log.warn(`Tag ${tag} already exists`);
    return { tag, existed: true, created: false };
  }

  if (dryRun) {
    log.info(`[DRY-RUN] Would create tag: ${tag}`);
    log.debug(`Message: ${message.slice(0, 100)}...`);
    return { tag, existed: false, created: false };
  }

  try {
    await execCommand("git", ["tag", "-a", tag, "-m", message]);
    log.info(`Created tag: ${tag}`);
    return { tag, existed: false, created: true };
  } catch (error) {
    throw new Error(`Failed to create tag: ${error.message}`);
  }
}

/**
 * Push tags to remote
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<void>}
 */
async function pushTags(dryRun, log) {
  if (dryRun) {
    log.info("[DRY-RUN] Would push tags to remote");
    return;
  }

  try {
    await execCommand("git", ["push", "origin", "--tags"]);
    log.info("Pushed tags to remote");
  } catch (error) {
    throw new Error(`Failed to push tags: ${error.message}`);
  }
}

/**
 * Create GitHub release
 * @param {string} version - Version
 * @param {string} notes - Release notes
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Result
 */
async function createRelease(version, notes, dryRun, log) {
  const tag = `v${version}`;

  // Check gh CLI availability
  try {
    await execCommand("gh", ["--version"]);
  } catch {
    log.warn("GitHub CLI not available, skipping release creation");
    log.info("Install with: brew install gh");
    return { created: false, reason: "gh-cli-not-available" };
  }

  try {
    await execCommand("gh", ["auth", "status"]);
  } catch {
    log.warn("GitHub CLI not authenticated, skipping release creation");
    log.info("Authenticate with: gh auth login");
    return { created: false, reason: "gh-cli-not-authenticated" };
  }

  if (dryRun) {
    log.info(`[DRY-RUN] Would create GitHub release: ${tag}`);
    log.debug(`Release notes length: ${notes.length} chars`);
    return { created: false, tag, reason: "dry-run" };
  }

  try {
    await execCommand("gh", [
      "release",
      "create",
      tag,
      "--title",
      `Release ${version}`,
      "--notes",
      notes,
    ]);
    log.info(`Created GitHub release: ${tag}`);
    return { created: true, tag };
  } catch (error) {
    throw new Error(`Failed to create release: ${error.message}`);
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

Auto-tag releases based on version changes.

Options:
  --help                    Show this help message
  --dry-run                 Preview without creating tags
  --output <fmt>            Output format: text (default), json
  --log-level <lvl>         Log level: error, warn, info (default), debug, trace
  --cwd <path>              Working directory (default: current)
  --version <ver>           Specific version to tag (default: from package.json)
  --create-release          Create GitHub release
  --push                    Push tags to remote

Examples:
  ${SCRIPT_NAME}                           # Tag current version
  ${SCRIPT_NAME} --version 0.2.0           # Tag specific version
  ${SCRIPT_NAME} --create-release          # Tag and create release
  ${SCRIPT_NAME} --create-release --push   # Tag, release, and push

Exit codes:
  0  - Success (tag created)
  1  - Failed to create tag
  2  - Tag already exists
  10 - Precondition failed

Prerequisites:
  - Git repository with CHANGELOG.md
  - GitHub CLI (gh) for release creation (optional)
`);
      process.exit(0);
    }

    log.info("Auto-tagging script");

    // Get version
    const version = args.version || (await getCurrentVersion());
    log.info(`Version: ${version}`);

    // Extract release notes
    const notes = await extractReleaseNotes(version, log);
    if (!notes) {
      log.warn("No release notes found in CHANGELOG.md");
    }

    // Create tag
    const tagResult = await createTag(
      version,
      `Release ${version}\n\n${notes}`,
      args.dryRun,
      log,
    );

    if (tagResult.existed) {
      succeed({
        script: SCRIPT_NAME,
        message: `Tag ${tagResult.tag} already exists`,
        exitCode: 2,
        output: args.output,
        data: { version, tag: tagResult.tag, existed: true },
      });
    }

    // Push tags if requested
    if (args.push && tagResult.created) {
      await pushTags(args.dryRun, log);
    }

    // Create GitHub release if requested
    let releaseResult = null;
    if (args.createRelease) {
      releaseResult = await createRelease(version, notes, args.dryRun, log);
    }

    succeed({
      script: SCRIPT_NAME,
      message: `Auto-tagging complete: ${tagResult.tag}`,
      output: args.output,
      data: {
        version,
        tag: tagResult.tag,
        created: tagResult.created,
        pushed: args.push && tagResult.created,
        release: releaseResult,
      },
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

    log.error("Auto-tagging failed:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
