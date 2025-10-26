#!/usr/bin/env node
/**
 * Check GitHub workflow status and print formatted report
 *
 * Usage:
 *   node scripts/check-ci.mjs              # Check latest run
 *   node scripts/check-ci.mjs --watch      # Watch and poll
 *   node scripts/check-ci.mjs --run-id ID  # Check specific run
 */

import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const watchMode = args.includes("--watch");
const runIdArg = args.find((arg) => arg.startsWith("--run-id="));
const specificRunId = runIdArg?.split("=")[1];

/**
 * Execute gh command and capture output
 */
function execGh(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("gh", args, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`gh command failed: ${stderr || "Unknown error"}`));
      }
    });

    proc.on("error", reject);
  });
}

/**
 * Get status emoji
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
 * Format duration
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
 * Get workflow run info
 */
async function getWorkflowRun(runId) {
  const json = await execGh([
    "run",
    "view",
    runId,
    "--json",
    "number,status,conclusion,createdAt,updatedAt,headBranch,event,displayTitle,url",
  ]);
  return JSON.parse(json);
}

/**
 * Get jobs for a run
 */
async function getJobs(runId) {
  const json = await execGh([
    "run",
    "view",
    runId,
    "--json",
    "jobs",
    "--jq",
    ".jobs[] | {name, status, conclusion, startedAt, completedAt}",
  ]);

  // Parse multiple JSON objects (one per line)
  const lines = json.split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}

/**
 * Get latest workflow run
 */
async function getLatestRun() {
  const json = await execGh([
    "run",
    "list",
    "--limit",
    "1",
    "--json",
    "databaseId,status,conclusion,headBranch,event,displayTitle,createdAt",
  ]);
  const runs = JSON.parse(json);
  return runs[0]?.databaseId;
}

/**
 * Print formatted report
 */
async function printReport(runId) {
  const run = await getWorkflowRun(runId);
  const jobs = await getJobs(runId);

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

  return { status: run.status, conclusion: run.conclusion };
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check if gh CLI is installed
    try {
      await execGh(["--version"]);
    } catch {
      console.error(
        "❌ Error: GitHub CLI (gh) is not installed or not in PATH",
      );
      console.error("   Install: https://cli.github.com/");
      process.exit(1);
    }

    let runId = specificRunId;

    if (!runId) {
      console.log("🔍 Finding latest workflow run...\n");
      runId = await getLatestRun();
      if (!runId) {
        console.error("❌ No workflow runs found");
        process.exit(1);
      }
    }

    if (watchMode) {
      console.log("👀 Watch mode enabled. Press Ctrl+C to exit.\n");

      while (true) {
        const { status, conclusion } = await printReport(runId);

        // Exit watch mode if workflow completed
        if (status === "completed") {
          console.log("✨ Workflow completed!");
          process.exit(conclusion === "success" ? 0 : 1);
        }

        // Wait 5 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } else {
      const { status, conclusion } = await printReport(runId);

      // Exit with appropriate code
      if (status === "completed") {
        process.exit(conclusion === "success" ? 0 : 1);
      }

      console.log("💡 Tip: Use --watch to monitor progress in real-time");
      process.exit(0);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
