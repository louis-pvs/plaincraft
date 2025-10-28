#!/usr/bin/env node
/**
 * check-ci.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Check GitHub Actions workflow status and display formatted report
 *
 * Monitors CI workflow runs with optional watch mode.
 * Displays job status, duration, and summary.
 */

import { z } from "zod";
import { Logger, parseFlags, fail, succeed } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";

const SCRIPT_NAME = "check-ci";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  watch: z.boolean().default(false),
  runId: z.string().optional(),
  pollInterval: z.number().default(5000),
});

/**
 * Get status emoji for display
 * @param {string} status - Workflow status
 * @param {string} conclusion - Workflow conclusion
 * @returns {string} Emoji
 */
function getStatusEmoji(status, conclusion) {
  if (status === "in_progress" || status === "queued") return "⏳";
  if (conclusion === "success") return "✅";
  if (conclusion === "failure") return "❌";
  if (conclusion === "cancelled") return "🚫";
  if (conclusion === "skipped") return "⊘";
  return "❓";
}

/**
 * Format duration between timestamps
 * @param {string} startTime - Start timestamp
 * @param {string} [endTime] - End timestamp (defaults to now)
 * @returns {string} Formatted duration
 */
function formatDuration(startTime, endTime) {
  if (!startTime) return "N/A";
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end - start;
  const diffSec = Math.floor(diffMs / 1000);
  const minutes = Math.floor(diffSec / 60);
  const seconds = diffSec % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Get workflow run details
 * @param {string} runId - Run ID
 * @returns {Promise<object>} Run details
 */
async function getWorkflowRun(runId) {
  const { stdout } = await execCommand("gh", [
    "run",
    "view",
    runId,
    "--json",
    "number,status,conclusion,createdAt,updatedAt,headBranch,event,displayTitle,url",
  ]);
  return JSON.parse(stdout);
}

/**
 * Get jobs for workflow run
 * @param {string} runId - Run ID
 * @returns {Promise<Array>} Job details
 */
async function getJobs(runId) {
  const { stdout } = await execCommand("gh", [
    "run",
    "view",
    runId,
    "--json",
    "jobs",
    "--jq",
    ".jobs[] | {name, status, conclusion, startedAt, completedAt}",
  ]);

  // Parse multiple JSON objects (one per line)
  const lines = stdout.split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}

/**
 * Get latest workflow run ID
 * @returns {Promise<string|null>} Run ID
 */
async function getLatestRun() {
  const { stdout } = await execCommand("gh", [
    "run",
    "list",
    "--limit",
    "1",
    "--json",
    "databaseId,status,conclusion,headBranch,event,displayTitle,createdAt",
  ]);
  const runs = JSON.parse(stdout);
  return runs[0]?.databaseId?.toString();
}

/**
 * Print text-based report
 * @param {object} run - Workflow run data
 * @param {Array} jobs - Job data
 * @param {Logger} _log - Logger instance (unused)
 */
function printTextReport(run, jobs, _log) {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║               GitHub Workflow Status Report                ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();

  // Run info
  console.log(`📋 Run #${run.number}`);
  console.log(`📌 Title: ${run.displayTitle}`);
  console.log(`🌿 Branch: ${run.headBranch}`);
  console.log(`🔔 Event: ${run.event}`);
  console.log(
    `${getStatusEmoji(run.status, run.conclusion)} Status: ${run.status.toUpperCase()}${run.conclusion ? ` (${run.conclusion})` : ""}`,
  );
  console.log(`⏱️  Started: ${new Date(run.createdAt).toLocaleString()}`);
  console.log(`⏱️  Duration: ${formatDuration(run.createdAt, run.updatedAt)}`);
  console.log(`🔗 URL: ${run.url}`);
  console.log();

  // Jobs table
  console.log(
    "┌─────────────────────────────────────────────────────────────┐",
  );
  console.log(
    "│                         Job Status                          │",
  );
  console.log(
    "├──────┬─────────────────────────────┬───────────┬─────────────┤",
  );
  console.log(
    "│ Stat │ Job Name                    │ Status    │ Duration    │",
  );
  console.log(
    "├──────┼─────────────────────────────┼───────────┼─────────────┤",
  );

  jobs.forEach((job) => {
    const emoji = getStatusEmoji(job.status, job.conclusion);
    const name = job.name.padEnd(27).substring(0, 27);
    const status = (job.conclusion || job.status).padEnd(9).substring(0, 9);
    const duration = formatDuration(job.startedAt, job.completedAt)
      .padEnd(11)
      .substring(0, 11);

    console.log(`│  ${emoji}  │ ${name} │ ${status} │ ${duration} │`);
  });

  console.log(
    "└──────┴─────────────────────────────┴───────────┴─────────────┘",
  );
  console.log();

  // Summary
  const completed = jobs.filter((j) => j.conclusion === "success").length;
  const failed = jobs.filter((j) => j.conclusion === "failure").length;
  const inProgress = jobs.filter(
    (j) => j.status === "in_progress" || j.status === "queued",
  ).length;

  console.log("📊 Summary:");
  console.log(`   ✅ Completed: ${completed}/${jobs.length}`);
  if (failed > 0) console.log(`   ❌ Failed: ${failed}`);
  if (inProgress > 0) console.log(`   ⏳ In Progress: ${inProgress}`);
  console.log();
}

/**
 * Generate report for workflow run
 * @param {string} runId - Run ID
 * @param {object} args - Arguments
 * @param {Logger} log - Logger instance
 * @returns {Promise<object>} Report data
 */
async function generateReport(runId, args, log) {
  log.debug(`Fetching workflow run: ${runId}`);

  const run = await getWorkflowRun(runId);
  const jobs = await getJobs(runId);

  const reportData = {
    run: {
      number: run.number,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.headBranch,
      event: run.event,
      title: run.displayTitle,
      url: run.url,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      duration: formatDuration(run.createdAt, run.updatedAt),
    },
    jobs: jobs.map((job) => ({
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      duration: formatDuration(job.startedAt, job.completedAt),
    })),
    summary: {
      total: jobs.length,
      completed: jobs.filter((j) => j.conclusion === "success").length,
      failed: jobs.filter((j) => j.conclusion === "failure").length,
      inProgress: jobs.filter(
        (j) => j.status === "in_progress" || j.status === "queued",
      ).length,
    },
  };

  if (args.output === "text") {
    printTextReport(run, jobs, log);
  }

  return reportData;
}

/**
 * Watch workflow run until completion
 * @param {string} runId - Run ID
 * @param {object} args - Arguments
 * @param {Logger} log - Logger instance
 * @returns {Promise<object>} Final report
 */
async function watchWorkflow(runId, args, log) {
  log.info("👀 Watch mode enabled. Press Ctrl+C to exit.");

  let lastReport;

  while (true) {
    lastReport = await generateReport(runId, args, log);

    if (lastReport.run.status === "completed") {
      log.info("✨ Workflow completed!");
      break;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, args.pollInterval));
  }

  return lastReport;
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

Check GitHub Actions workflow status with formatted report.

Options:
  --help              Show this help message
  --dry-run           Show what would be checked (no actual check)
  --output <fmt>      Output format: text (default), json
  --log-level <lvl>   Log level: error, warn, info (default), debug, trace
  --cwd <path>        Working directory (default: current)
  --watch             Watch mode - poll until completion
  --run-id <id>       Check specific run ID (default: latest)
  --poll-interval <ms> Poll interval in watch mode (default: 5000)

Examples:
  ${SCRIPT_NAME}                        # Check latest run
  ${SCRIPT_NAME} --watch                 # Monitor until completion
  ${SCRIPT_NAME} --run-id 12345          # Check specific run
  ${SCRIPT_NAME} --output json           # JSON output for parsing

Exit codes:
  0  - Success (workflow passed)
  1  - Workflow failed or error
  2  - No workflow runs found
  10 - Precondition failed (gh CLI not available)
`);
      process.exit(0);
    }

    // Check gh CLI availability
    try {
      await execCommand("gh", ["--version"]);
    } catch {
      fail({
        script: SCRIPT_NAME,
        message: "GitHub CLI (gh) not installed or not in PATH",
        exitCode: 10,
        output: args.output,
      });
    }

    if (args.dryRun) {
      log.info("[DRY-RUN] Would check workflow status");
      succeed({
        script: SCRIPT_NAME,
        message: "Dry-run mode - no checks performed",
        output: args.output,
        data: { dryRun: true },
      });
    }

    // Get run ID
    let runId = args.runId;
    if (!runId) {
      log.info("🔍 Finding latest workflow run...");
      runId = await getLatestRun();
      if (!runId) {
        succeed({
          script: SCRIPT_NAME,
          message: "No workflow runs found",
          exitCode: 2,
          output: args.output,
          data: { runs: [] },
        });
      }
    }

    // Generate report
    let report;
    if (args.watch) {
      report = await watchWorkflow(runId, args, log);
    } else {
      report = await generateReport(runId, args, log);
      if (args.output === "text" && report.run.status !== "completed") {
        console.log("💡 Tip: Use --watch to monitor progress in real-time");
      }
    }

    // Determine exit code based on conclusion
    if (report.run.status === "completed") {
      if (report.run.conclusion === "success") {
        succeed({
          script: SCRIPT_NAME,
          message: `Workflow run #${report.run.number} succeeded`,
          output: args.output,
          data: report,
        });
      } else {
        fail({
          script: SCRIPT_NAME,
          message: `Workflow run #${report.run.number} ${report.run.conclusion}`,
          exitCode: 1,
          output: args.output,
          data: report,
        });
      }
    }

    // Still in progress
    succeed({
      script: SCRIPT_NAME,
      message: `Workflow run #${report.run.number} in progress`,
      output: args.output,
      data: report,
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

    log.error("Failed to check CI status:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
