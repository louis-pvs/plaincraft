#!/usr/bin/env node
/**
 * extract-pr-changelog.mjs
 * @since 2025-11-01
 * @version 1.0.0
 * Extract changelog entry from a merged PR and write to _tmp/ for consolidation
 */

import path from "node:path";
import { mkdir } from "node:fs/promises";
import { z } from "zod";
import {
  parseFlags,
  Logger,
  repoRoot,
  fail,
  succeed,
  generateRunId,
  atomicWrite,
} from "../_lib/core.mjs";
import { getPR } from "../_lib/github.mjs";

const SCRIPT_NAME = "extract-pr-changelog";

const ArgsSchema = z.object({
  prNumber: z.number({
    required_error: "Missing required --pr-number (PR number)",
  }),
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  cwd: z.string().min(1),
  tmpDir: z.string().default("_tmp"),
});

function printHelp() {
  console.log(`
Extract changelog entry from merged PR body

This extracts the changelog section from a PR's body and writes it to
a temporary markdown file for consolidation into CHANGELOG.md.

USAGE:
  node scripts/ops/${SCRIPT_NAME}.mjs --pr-number <number> [options]

OPTIONS:
  --pr-number <number>   PR number to extract from (required)
  --tmp-dir <path>       Temporary directory for summaries (default: _tmp)
  --yes, -y              Execute write (disables dry-run)
  --dry-run              Preview only (default mode)
  --output <mode>        text|json output formatting (default: text)
  --log-level <level>    trace|debug|info|warn|error (default: info)
  --cwd <path>           Working directory for repo discovery
  --help, -h             Show this help message

EXIT CODES:
  0  Success
  1  General error
  10 Precondition failed
  11 Validation error
  12 No changelog content found
`);
}

/**
 * Extract changelog section from PR body
 */
function extractChangelogSection(prBody) {
  if (!prBody) return null;

  // Look for common changelog section headers
  const patterns = [
    /## Changes\s*\n([\s\S]*?)(?=\n##|$)/i,
    /## Changelog\s*\n([\s\S]*?)(?=\n##|$)/i,
    /## What Changed\s*\n([\s\S]*?)(?=\n##|$)/i,
    /## Summary\s*\n([\s\S]*?)(?=\n##|$)/i,
    /### Changes\s*\n([\s\S]*?)(?=\n###|$)/i,
  ];

  for (const pattern of patterns) {
    const match = prBody.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extract title from PR title - handles [TAG] prefix format
 */
function extractTitle(prTitle) {
  if (!prTitle) return "Changes";

  // Match [ID] Title format
  const match = prTitle.match(/^\[([^\]]+)\]\s+(.+)$/);
  if (match) {
    return match[2].trim();
  }

  return prTitle.trim();
}

/**
 * Generate filename from PR number and title
 */
function generateFilename(prNumber, prTitle) {
  const title = extractTitle(prTitle);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);

  return `pr-${prNumber}-${slug}.md`;
}

async function main() {
  const rawFlags = parseFlags();

  if (rawFlags.help) {
    printHelp();
    process.exit(0);
  }

  const argsForValidation = {
    prNumber: rawFlags["pr-number"]
      ? parseInt(rawFlags["pr-number"], 10)
      : undefined,
    dryRun: rawFlags.dryRun ?? !rawFlags.yes,
    yes: rawFlags.yes ?? false,
    output: rawFlags.output ?? "text",
    logLevel: rawFlags.logLevel ?? "info",
    cwd: rawFlags.cwd || process.cwd(),
    tmpDir: rawFlags["tmp-dir"] || rawFlags.tmpDir || "_tmp",
  };

  const parsed = ArgsSchema.safeParse(argsForValidation);
  if (!parsed.success) {
    fail({
      exitCode: 11,
      message: "validation_error",
      error: parsed.error.format(),
      output: argsForValidation.output,
      script: SCRIPT_NAME,
    });
    return;
  }

  const args = parsed.data;
  const logger = new Logger(args.logLevel);
  const runId = generateRunId();
  const start = Date.now();

  try {
    const root = await repoRoot(args.cwd);
    const tmpDirPath = path.resolve(root, args.tmpDir);

    logger.info(`Extracting changelog from PR #${args.prNumber}`);
    logger.debug(`Repo root: ${root}`);
    logger.debug(`Temp directory: ${tmpDirPath}`);

    // Fetch PR details
    const pr = await getPR(args.prNumber, root);

    if (!pr) {
      fail({
        exitCode: 10,
        message: "precondition_failed",
        error: `PR #${args.prNumber} not found`,
        output: args.output,
        script: SCRIPT_NAME,
      });
      return;
    }

    if (!pr.merged) {
      fail({
        exitCode: 10,
        message: "precondition_failed",
        error: `PR #${args.prNumber} is not merged`,
        output: args.output,
        script: SCRIPT_NAME,
      });
      return;
    }

    logger.debug(`PR title: ${pr.title}`);
    logger.debug(`PR merged: ${pr.mergedAt}`);

    // Extract changelog section
    const changelogContent = extractChangelogSection(pr.body);

    if (!changelogContent) {
      fail({
        exitCode: 12,
        message: "no_changelog_found",
        error: "No changelog section found in PR body",
        output: args.output,
        script: SCRIPT_NAME,
      });
      return;
    }

    logger.info(`Found changelog content (${changelogContent.length} chars)`);

    // Generate summary file
    const title = extractTitle(pr.title);
    const filename = generateFilename(args.prNumber, pr.title);
    const summaryPath = path.join(tmpDirPath, filename);

    const summaryContent = `# ${title}

${changelogContent}
`;

    if (args.dryRun) {
      logger.info(
        `[DRY-RUN] Would write to: ${path.relative(root, summaryPath)}`,
      );
      logger.info(
        `[DRY-RUN] Content preview:\n${summaryContent.substring(0, 200)}...`,
      );

      succeed({
        output: args.output,
        script: SCRIPT_NAME,
        runId,
        dryRun: true,
        prNumber: args.prNumber,
        prTitle: pr.title,
        summaryFile: path.relative(root, summaryPath),
        contentLength: summaryContent.length,
        durationMs: Date.now() - start,
      });
      return;
    }

    // Create temp directory if it doesn't exist
    await mkdir(tmpDirPath, { recursive: true });

    // Write summary file
    await atomicWrite(summaryPath, summaryContent);
    logger.info(`Wrote changelog summary: ${path.relative(root, summaryPath)}`);

    succeed({
      output: args.output,
      script: SCRIPT_NAME,
      runId,
      dryRun: false,
      prNumber: args.prNumber,
      prTitle: pr.title,
      summaryFile: path.relative(root, summaryPath),
      contentLength: summaryContent.length,
      durationMs: Date.now() - start,
    });
  } catch (error) {
    fail({
      exitCode: 1,
      message: "execution_error",
      error: error instanceof Error ? error.message : String(error),
      output: args.output,
      script: SCRIPT_NAME,
    });
  }
}

main();
