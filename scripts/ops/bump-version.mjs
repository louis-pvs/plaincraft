#!/usr/bin/env node
/**
 * bump-version.mjs
 * @since 2025-10-28
 * @version 1.0.0
 * Summary: Bump package.json version based on semantic versioning and commit analysis.
 */

import path from "node:path";
import { appendFile } from "node:fs/promises";
import { z } from "zod";
import {
  parseFlags,
  fail,
  succeed,
  Logger,
  repoRoot,
  generateRunId,
  readJSON,
  writeJSON,
} from "../_lib/core.mjs";
import { getRecentCommits } from "../_lib/git.mjs";

const ArgsSchema = z.object({
  bumpType: z.enum(["major", "minor", "patch"]).optional(),
  yes: z.boolean().default(false),
  dryRun: z.boolean().default(true),
  output: z.enum(["json", "text"]).default("text"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  cwd: z.string().default(process.cwd()),
  help: z.boolean().default(false),
  commitCount: z.number().default(10),
});

const start = Date.now();
const rawArgs = parseFlags(process.argv.slice(2));

if (rawArgs.help) {
  console.log(`
Usage: node scripts/ops/bump-version.mjs [bump-type] [options]

Arguments:
  bump-type           Force bump type: major|minor|patch (optional, auto-detect if omitted)

Options:
  --yes, -y           Execute the version bump (default: dry-run)
  --dry-run           Preview changes without writing (default: true)
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current)
  --commit-count <n>  Number of commits to analyze (default: 10)
  --help, -h          Show this help

Bump Detection Rules:
  major: [MAJOR], BREAKING CHANGE, or breaking: in commit message
  minor: [MINOR], feat:, or feature: in commit message
  patch: [PATCH], fix:, or default if no other markers found

Examples:
  node scripts/ops/bump-version.mjs                    # Auto-detect and preview
  node scripts/ops/bump-version.mjs --yes              # Auto-detect and execute
  node scripts/ops/bump-version.mjs major --yes        # Force major bump
  node scripts/ops/bump-version.mjs --output json      # Output as JSON

Exit codes:
  0  - Success
  2  - Noop (no change needed)
  10 - Precondition failed (not in repo, no package.json)
  11 - Validation failed
`);
  process.exit(0);
}

// Prepare args for validation
const argsForValidation = {
  bumpType: rawArgs._[0],
  yes: rawArgs.yes,
  dryRun: rawArgs.dryRun,
  output: rawArgs.output,
  logLevel: rawArgs.logLevel,
  cwd: rawArgs.cwd,
  help: rawArgs.help,
  commitCount: parseInt(rawArgs.commitCount) || 10,
};

const parsed = ArgsSchema.safeParse(argsForValidation);
if (!parsed.success) {
  fail(11, "validation_error", parsed.error.format(), rawArgs.output);
}

const args = parsed.data;
const logger = new Logger(args.logLevel);
const runId = generateRunId();

logger.info("Starting version bump");

// Preflight checks
async function preflight(root) {
  const packageJsonPath = path.join(root, "package.json");

  try {
    await readJSON(packageJsonPath);
  } catch {
    fail(
      10,
      "precondition_failed",
      "package.json not found or invalid",
      args.output,
    );
  }
}

/**
 * Detect bump type from commit messages
 */
function detectBumpType(commits) {
  const hasBreaking = commits.some(
    (msg) =>
      msg.includes("[MAJOR]") ||
      msg.includes("BREAKING CHANGE") ||
      msg.toLowerCase().includes("breaking:"),
  );

  const hasFeature = commits.some(
    (msg) =>
      msg.includes("[MINOR]") ||
      msg.includes("feat:") ||
      msg.includes("feature:"),
  );

  if (hasBreaking) return "major";
  if (hasFeature) return "minor";
  return "patch";
}

/**
 * Bump semantic version
 */
function bumpVersion(currentVersion, bumpType) {
  const parts = currentVersion.split(".").map(Number);
  const [major, minor, patch] = parts;

  switch (bumpType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

try {
  const root = await repoRoot(args.cwd);
  await preflight(root);

  const packageJsonPath = path.join(root, "package.json");
  const packageData = await readJSON(packageJsonPath);
  const currentVersion = packageData.version;

  logger.info(`Current version: ${currentVersion}`);

  // Determine bump type
  let bumpType = args.bumpType;
  let detectionReason = "forced";

  if (!bumpType) {
    logger.debug(`Analyzing last ${args.commitCount} commits`);
    const commits = await getRecentCommits(args.commitCount, root);
    bumpType = detectBumpType(commits);
    detectionReason = "auto-detected";
    logger.info(`Detected bump type: ${bumpType}`);
    logger.debug(`Based on commits: ${commits.slice(0, 3).join(", ")}`);
  }

  const newVersion = bumpVersion(currentVersion, bumpType);
  logger.info(`New version: ${newVersion}`);

  // Build the plan
  const plan = {
    action: "bump_version",
    currentVersion,
    newVersion,
    bumpType,
    detectionReason,
    file: path.relative(root, packageJsonPath),
  };

  // Check if version actually changed
  if (currentVersion === newVersion) {
    succeed(
      {
        runId,
        script: "bump-version",
        noop: true,
        reason: "Version already at target",
        currentVersion,
        durationMs: Date.now() - start,
      },
      args.output,
    );
    process.exit(2);
  }

  // Dry run or execute
  if (args.dryRun || !args.yes) {
    succeed(
      {
        runId,
        script: "bump-version",
        dryRun: true,
        plan,
        durationMs: Date.now() - start,
      },
      args.output,
    );
    process.exit(2);
  }

  // Execute the bump
  packageData.version = newVersion;
  await writeJSON(packageJsonPath, packageData);

  logger.info(`Updated ${packageJsonPath}`);

  // Set output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    try {
      await appendFile(process.env.GITHUB_OUTPUT, `version=${newVersion}\n`);
      await appendFile(
        process.env.GITHUB_OUTPUT,
        `old_version=${currentVersion}\n`,
      );
      logger.debug(`Set GitHub output: version=${newVersion}`);
    } catch (error) {
      logger.warn(`Could not write to GITHUB_OUTPUT: ${error.message}`);
    }
  }

  succeed(
    {
      runId,
      script: "bump-version",
      currentVersion,
      newVersion,
      bumpType,
      file: path.relative(root, packageJsonPath),
      durationMs: Date.now() - start,
    },
    args.output,
  );
} catch (error) {
  logger.error("Version bump failed:", error.message);
  fail(11, "execution_error", error.message, args.output);
}
