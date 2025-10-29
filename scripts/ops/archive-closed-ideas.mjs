#!/usr/bin/env node
/**
 * archive-closed-ideas.mjs
 * @since 2025-10-30
 * @version 0.1.0
 * One-time cleanup script that moves closed ideas into /ideas/_archive/YYYY/
 *
 * Scans /ideas for cards with Issue metadata, checks GitHub issue state,
 * and archives cards for closed issues to maintain source-of-truth alignment.
 */

import path from "node:path";
import { mkdir, rename, stat } from "node:fs/promises";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, repoRoot } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";
import { getIssue } from "../_lib/github.mjs";
import { findIdeaFiles, loadIdeaFile } from "../_lib/ideas.mjs";

const SCRIPT_NAME = "archive-closed-ideas";

const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  filter: z.string().optional(),
  year: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : undefined))
    .refine(
      (value) => value === undefined || !Number.isNaN(value),
      "Year must be a number",
    ),
});

function normalizeState(state) {
  return typeof state === "string" ? state.toLowerCase() : "";
}

async function archiveIdea(filePath, archiveDir, args, log, root) {
  const filename = path.basename(filePath);
  const destination = path.join(archiveDir, filename);

  if (args.dryRun) {
    log.info(
      `[DRY-RUN] Would move ${filename} → ${path.relative(root, destination)}`,
    );
    return {
      status: "dry-run",
      filename,
      destination,
    };
  }

  await mkdir(archiveDir, { recursive: true });
  await rename(filePath, destination);
  return {
    status: "archived",
    filename,
    destination,
  };
}

async function processIdeaFile(filePath, args, log, year, context) {
  try {
    const { metadata } = await loadIdeaFile(filePath);
    const issueNumber = metadata.issue;

    if (!issueNumber) {
      return {
        status: "skipped",
        reason: "no-issue",
        filePath,
      };
    }

    const issue = await getIssue(issueNumber);

    if (normalizeState(issue.state) !== "closed") {
      return {
        status: "skipped",
        reason: "open",
        issueNumber,
        filePath,
      };
    }

    const { root, ideasDir } = context;
    const archiveDir = path.join(
      ideasDir,
      "_archive",
      String(year ?? new Date().getFullYear()),
    );

    const currentStat = await stat(filePath);
    if (!currentStat.isFile()) {
      return {
        status: "skipped",
        reason: "not-a-file",
        filePath,
      };
    }

    const result = await archiveIdea(filePath, archiveDir, args, log, root);
    return {
      ...result,
      issueNumber,
      filePath,
      archivePath: path.join(archiveDir, path.basename(filePath)),
    };
  } catch (error) {
    log.warn(`Failed to process ${path.basename(filePath)}: ${error.message}`);
    return { status: "failed", filePath, error: error.message };
  }
}

async function executeArchive(args, log) {
  const root = await repoRoot(args.cwd);
  const ideasDir = path.join(root, "ideas");

  const ideaFiles = await findIdeaFiles(ideasDir, args.filter);
  log.info(`Found ${ideaFiles.length} idea file(s) in ${ideasDir}`);

  const results = {
    total: ideaFiles.length,
    archived: 0,
    dryRun: 0,
    skipped: 0,
    failed: 0,
    files: [],
  };

  for (const filename of ideaFiles) {
    const filePath = path.join(ideasDir, filename);
    const outcome = await processIdeaFile(filePath, args, log, args.year, {
      root,
      ideasDir,
    });

    results.files.push(outcome);

    if (outcome.status === "archived") {
      results.archived += 1;
    } else if (outcome.status === "dry-run") {
      results.dryRun += 1;
    } else if (outcome.status === "failed") {
      results.failed += 1;
    } else {
      results.skipped += 1;
    }
  }

  return results;
}

async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  if (flags.help) {
    console.log(`
Usage: ${SCRIPT_NAME} [options]

Archive idea cards for closed issues into /ideas/_archive/YYYY/.

Options:
  --help              Show this message
  --dry-run           Preview actions (default)
  --yes               Execute archiving
  --filter <slug>     Only process idea files matching slug
  --year <YYYY>       Archive into specific year (default: current year)
  --log-level <lvl>   error | warn | info | debug | trace
  --cwd <path>        Working directory (default: current directory)
  --output <fmt>      text | json

Examples:
  ${SCRIPT_NAME} --dry-run                 # Preview changes
  ${SCRIPT_NAME} --yes                     # Archive closed ideas
  ${SCRIPT_NAME} --yes --filter ARCH-sub   # Archive subset of ideas
`);
    process.exit(0);
  }

  try {
    const args = ArgsSchema.parse({
      ...flags,
      dryRun: flags.dryRun ?? !flags.yes,
    });

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

    const results = await executeArchive(args, log);

    const summary = {
      script: SCRIPT_NAME,
      archived: results.archived,
      dryRun: results.dryRun,
      skipped: results.skipped,
      failed: results.failed,
      total: results.total,
      files: results.files,
    };

    if (results.failed > 0) {
      fail({
        script: SCRIPT_NAME,
        message: `${results.failed} file(s) failed during archive`,
        output: args.output,
        data: summary,
      });
    }

    succeed({
      script: SCRIPT_NAME,
      message: args.dryRun
        ? `Dry-run complete: ${results.dryRun} file(s) would be archived`
        : `Archived ${results.archived} idea file(s)`,
      output: args.output,
      data: summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      fail({
        script: SCRIPT_NAME,
        message: "Invalid arguments",
        exitCode: 11,
        output: flags.output || "text",
        error,
      });
    }

    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
