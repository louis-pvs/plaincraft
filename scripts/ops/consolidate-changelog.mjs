#!/usr/bin/env node
/**
 * consolidate-changelog.mjs
 * @since 2025-10-28
 * @version 1.0.0
 * Summary: Consolidate temporary changelog summaries into CHANGELOG.md with guardrails.
 */

import path from "node:path";
import { existsSync } from "node:fs";
import { readFile, unlink } from "node:fs/promises";
import { z } from "zod";
import {
  parseFlags,
  Logger,
  repoRoot,
  fail,
  succeed,
  generateRunId,
  readJSON,
  atomicWrite,
} from "../_lib/core.mjs";
import {
  getSummaryFiles,
  parseSummaryFiles,
  generateVersionEntry,
  insertVersionEntry,
  deduplicateChangelog,
} from "../_lib/changelog.mjs";

const SCRIPT_NAME = "consolidate-changelog";

const rawArgs = parseFlags();

if (rawArgs.help) {
  printHelp();
  process.exit(0);
}

const ArgsSchema = z.object({
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  cwd: z.string().min(1),
  tmpDir: z.string().default("_tmp"),
  changelog: z.string().default("CHANGELOG.md"),
  packageJson: z.string().default("package.json"),
  keepTemp: z.boolean().default(false),
  version: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
    .optional(),
});

const argsForValidation = {
  dryRun: coerceBoolean(rawArgs.dryRun, true),
  yes: coerceBoolean(rawArgs.yes, false),
  output: rawArgs.output,
  logLevel: rawArgs.logLevel,
  cwd: rawArgs.cwd || process.cwd(),
  tmpDir: rawArgs["tmp-dir"] || rawArgs.tmpDir,
  changelog: rawArgs.changelog,
  packageJson: rawArgs["package-json"] || rawArgs.packageJson,
  keepTemp: coerceBoolean(rawArgs["keep-temp"], false),
  version: rawArgs.version,
  date: rawArgs.date,
};

const parsed = ArgsSchema.safeParse(argsForValidation);
if (!parsed.success) {
  fail({
    exitCode: 11,
    message: "validation_error",
    error: parsed.error.format(),
    output: rawArgs.output || "text",
    script: SCRIPT_NAME,
  });
}

const args = parsed.data;
const logger = new Logger(args.logLevel);
const runId = generateRunId();
const start = Date.now();

async function main() {
  const root = await repoRoot(args.cwd);
  const changelogPath = path.resolve(root, args.changelog);
  const packageJsonPath = path.resolve(root, args.packageJson);

  logger.info(`Using repo root: ${root}`);
  logger.debug(`Changelog path: ${changelogPath}`);
  logger.debug(`Temp directory: ${path.resolve(root, args.tmpDir)}`);

  const summaryFiles = await getSummaryFiles(root, args.tmpDir);

  if (summaryFiles.length === 0) {
    logger.warn("No summary files detected; exiting with noop.");
    succeed({
      output: args.output,
      script: SCRIPT_NAME,
      runId,
      noop: true,
      dryRun: args.dryRun,
      message: "No summary files found",
      changelogPath: path.relative(root, changelogPath),
      durationMs: Date.now() - start,
    });
  }

  const summaries = await parseSummaryFiles(summaryFiles);
  const summaryTitles = summaries.map((summary) => summary.title);
  summaryFiles.forEach((filePath) =>
    logger.info(`Found summary: ${path.relative(root, filePath)}`),
  );

  const version = await resolveVersion(packageJsonPath, args.version);
  const releaseDate = args.date || getCurrentDate();

  logger.info(`Preparing changelog entry for version ${version}`);
  logger.debug(`Release date: ${releaseDate}`);

  const existingChangelog = await readChangelogSafe(changelogPath);
  const dedupedChangelog = deduplicateChangelog(existingChangelog);

  const newEntry = generateVersionEntry({
    version,
    date: releaseDate,
    summaries,
  });

  const updatedChangelog = insertVersionEntry(
    dedupedChangelog,
    newEntry,
    version,
  );

  if (args.dryRun) {
    logger.info("[DRY-RUN] Skipping changelog write");
    logger.info(`[DRY-RUN] Would update ${path.relative(root, changelogPath)}`);
    logger.info(
      `[DRY-RUN] Summaries included (${summaries.length}): ${summaryTitles.join(", ")}`,
    );

    succeed({
      output: args.output,
      script: SCRIPT_NAME,
      runId,
      dryRun: true,
      version,
      releaseDate,
      summaries: summaries.length,
      changelogPath: path.relative(root, changelogPath),
      wouldDeleteTempFiles: !args.keepTemp,
      tempFiles: summaryFiles.map((filePath) => path.relative(root, filePath)),
      durationMs: Date.now() - start,
    });
  }

  await atomicWrite(changelogPath, updatedChangelog);
  logger.info(`Updated changelog: ${path.relative(root, changelogPath)}`);

  const deletedFiles = [];
  if (!args.keepTemp) {
    for (const filePath of summaryFiles) {
      try {
        await unlink(filePath);
        deletedFiles.push(path.relative(root, filePath));
      } catch (error) {
        logger.warn(`Could not delete ${filePath}: ${error.message}`);
      }
    }
  } else {
    logger.info("Skipping temp file cleanup (--keep-temp enabled)");
  }

  succeed({
    output: args.output,
    script: SCRIPT_NAME,
    runId,
    dryRun: false,
    version,
    releaseDate,
    summaries: summaries.length,
    summaryTitles,
    changelogPath: path.relative(root, changelogPath),
    tempFilesDeleted: deletedFiles,
    tempFilesRetained: args.keepTemp
      ? summaryFiles.map((filePath) => path.relative(root, filePath))
      : [],
    durationMs: Date.now() - start,
  });
}

main().catch((error) => {
  fail({
    exitCode: 13,
    message: "execution_error",
    error: error instanceof Error ? error.message : String(error),
    output: args.output,
    script: SCRIPT_NAME,
  });
});

function coerceBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value).toLowerCase();
  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }
  return defaultValue;
}

async function resolveVersion(packageJsonPath, override) {
  if (override) {
    return override;
  }

  try {
    const packageJson = await readJSON(packageJsonPath);
    if (!packageJson.version) {
      throw new Error("version missing in package.json");
    }
    return packageJson.version;
  } catch (error) {
    fail({
      exitCode: 10,
      message: "precondition_failed",
      error:
        error instanceof Error
          ? error.message
          : "Unable to read package.json",
      output: args.output,
      script: SCRIPT_NAME,
    });
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

async function readChangelogSafe(changelogPath) {
  if (!existsSync(changelogPath)) {
    return "";
  }
  return readFile(changelogPath, "utf-8");
}

function printHelp() {
  console.log(`
Consolidate changelog summaries into CHANGELOG.md

Usage:
  node scripts/ops/${SCRIPT_NAME}.mjs [options]

Options:
  --tmp-dir <path>       Temporary directory with summary markdown (default: _tmp)
  --changelog <path>     Target changelog path (default: CHANGELOG.md)
  --package-json <path>  package.json location for version lookup (default: package.json)
  --version <semver>     Override version instead of reading package.json
  --date <YYYY-MM-DD>    Override release date (default: today)
  --keep-temp            Skip deleting temp summary files
  --yes, -y              Execute write/delete actions (disables dry-run)
  --dry-run              Preview changes (default mode)
  --output <mode>        text|json output formatting (default: text)
  --log-level <level>    trace|debug|info|warn|error (default: info)
  --cwd <path>           Working directory for repo discovery
  --help, -h             Show this help message

Exit codes:
  0  Success
  10 Precondition failed (missing package.json)
  11 Validation error
  13 Execution error
`);
}
