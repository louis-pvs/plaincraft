#!/usr/bin/env node
/**
 * guardrails-baseline.mjs
 * @since 2025-10-31
 * @version 0.1.0
 * Summarize recent guardrails job durations and artifact sizes
 */

import path from "node:path";
import { execa } from "execa";
import {
  parseFlags,
  resolveLogLevel,
  fail,
  succeed,
  Logger,
  repoRoot,
  now,
} from "../_lib/core.mjs";

const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/guardrails-baseline.mjs [options]

Options:
  --help                Show this help
  --dry-run             Preview actions without calling GitHub (default)
  --yes                 Execute the GitHub queries (disables --dry-run)
  --limit <number>      Number of completed workflow runs to analyze (default: 10)
  --workflow <file>     Workflow filename or ID (default: ci.yml)
  --job <name>          Job name to inspect (default: Guardrail Suite)
  --repo <owner/repo>   Repository slug override (detected from git remote if omitted)
  --output <format>     Output format: json|text (default: text)
  --log-level <level>   Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>          Working directory (default: current directory)

Description:
  Fetches the most recent workflow runs, extracts timings for the guardrails job,
  and reports artifact sizes for guardrails-report, storybook-static, demo-dist,
  and playbook-static. Intended to establish a runtime and artifact size baseline
  before introducing additional lifecycle checks.
`);
  process.exit(0);
}

const logger = new Logger(resolveLogLevel({ flags: args }));
const dryRun = args.dryRun !== false && args.yes !== true;

(async () => {
  try {
    const limit = parseLimit(args.limit);
    const workflow = args.workflow || "ci.yml";
    const jobName = args.job || "Guardrail Suite";

    const root = await repoRoot(args.cwd);
    const repo = args.repo || (await detectRepoSlug(root));

    if (dryRun) {
      await succeed({
        script: "guardrails-baseline",
        dryRun: true,
        output: args.output,
        message:
          repo !== null
            ? "Dry run: would fetch guardrails metrics. Re-run with --yes to execute."
            : "Dry run: would fetch guardrails metrics after determining repository slug.",
        plan: {
          repo: repo,
          workflow,
          jobName,
          limit,
        },
      });
      return;
    }

    if (!repo) {
      await fail({
        script: "guardrails-baseline",
        message: "Unable to determine repository slug. Pass --repo owner/repo.",
        output: args.output,
      });
      return;
    }

    await ensureGhAvailable(logger);

    logger.info("Collecting workflow metrics", {
      repo,
      workflow,
      jobName,
      limit,
      example: "gh run list --workflow ci.yml --limit 10",
    });

    const runs = await fetchWorkflowRuns({ repo, workflow, limit });

    if (runs.length === 0) {
      await fail({
        script: "guardrails-baseline",
        message: "No completed workflow runs found for the provided workflow.",
        output: args.output,
      });
      return;
    }

    const summaries = [];
    const guardrailDurations = [];
    const artifactNames = [
      "guardrails-report",
      "storybook-static",
      "demo-dist",
      "playbook-static",
    ];
    const artifactStats = initArtifactStats(artifactNames);

    for (const run of runs) {
      const runSummary = await buildRunSummary({
        repo,
        workflowRun: run,
        jobName,
        artifactNames,
      });

      summaries.push(runSummary);

      if (typeof runSummary.guardrails.durationMs === "number") {
        guardrailDurations.push(runSummary.guardrails.durationMs);
      }

      for (const name of artifactNames) {
        const size = runSummary.artifacts[name]?.sizeBytes ?? null;
        if (typeof size === "number") {
          artifactStats[name].sizes.push(size);

          if (!artifactStats[name].latest) {
            artifactStats[name].latest = {
              bytes: size,
              runId: runSummary.runId,
              runNumber: runSummary.runNumber,
            };
          }
        }
      }
    }

    const guardrailSummary = summarizeDurations(guardrailDurations);
    const artifactSummary = summarizeArtifacts(artifactStats);

    await succeed({
      script: "guardrails-baseline",
      output: args.output,
      generatedAt: now(),
      repo,
      workflow,
      jobName,
      runsAnalyzed: summaries.length,
      guardrails: guardrailSummary,
      artifacts: artifactSummary,
      runs: summaries,
    });
  } catch (error) {
    logger.error("Guardrails baseline failed", {
      error: error?.message || String(error),
      example: "Re-run with --yes to fetch data from GitHub.",
    });
    await fail({
      script: "guardrails-baseline",
      message: "Failed to collect guardrails metrics",
      error: error?.message || String(error),
      output: args.output,
    });
  }
})();

/**
 * Parse limit argument
 * @param {string|number} raw
 * @returns {number}
 */
function parseLimit(raw) {
  if (raw === undefined) return 10;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid --limit value: ${raw}`);
  }
  return Math.min(Math.floor(value), 100);
}

/**
 * Detect owner/repo slug from git remote
 * @param {string} cwd
 * @returns {Promise<string|null>}
 */
async function detectRepoSlug(cwd) {
  try {
    const { stdout } = await execa("git", ["remote", "get-url", "origin"], {
      cwd,
    });
    return parseRepoSlug(stdout.trim());
  } catch {
    return null;
  }
}

/**
 * Parse git remote URL into owner/repo
 * @param {string} remote
 * @returns {string|null}
 */
function parseRepoSlug(remote) {
  if (!remote) return null;

  if (remote.startsWith("git@")) {
    const match = remote.match(/git@[^:]+:(.+?)(\.git)?$/);
    return match ? match[1] : null;
  }

  try {
    const url = new URL(remote);
    return url.pathname.replace(/^\/+/, "").replace(/\.git$/, "") || null;
  } catch {
    // Fallback for scp-like or file paths
    const parts = remote.split(path.sep);
    const repo = parts.slice(-2).join("/");
    return repo.includes("/") ? repo.replace(/\.git$/, "") : null;
  }
}

/**
 * Ensure gh CLI is available and authenticated
 * @param {Logger} logger
 * @returns {Promise<void>}
 */
async function ensureGhAvailable(logger) {
  try {
    await execa("gh", ["--version"]);
  } catch {
    throw new Error(
      "GitHub CLI (gh) is required. Install https://cli.github.com/ and retry.",
    );
  }

  try {
    await execa("gh", ["auth", "status"]);
  } catch (error) {
    logger.warn(
      `gh auth status check failed: ${error?.stderr || error?.message || error}`,
    );
    throw new Error(
      "gh CLI is not authenticated. Run `gh auth login` with a token that can read Actions.",
    );
  }
}

/**
 * Fetch workflow runs
 * @param {object} options
 * @param {string} options.repo
 * @param {string} options.workflow
 * @param {number} options.limit
 * @returns {Promise<object[]>}
 */
async function fetchWorkflowRuns({ repo, workflow, limit }) {
  const path = `/repos/${repo}/actions/workflows/${workflow}/runs?per_page=${limit}&status=completed`;
  const data = await ghApi(path);
  return data?.workflow_runs?.filter((run) => run.conclusion) ?? [];
}

/**
 * Fetch job details for a workflow run
 * @param {string} repo
 * @param {number} runId
 * @returns {Promise<object[]>}
 */
async function fetchJobs(repo, runId) {
  const path = `/repos/${repo}/actions/runs/${runId}/jobs?per_page=100`;
  const data = await ghApi(path);
  return data?.jobs ?? [];
}

/**
 * Fetch artifacts for a workflow run
 * @param {string} repo
 * @param {number} runId
 * @returns {Promise<object[]>}
 */
async function fetchArtifacts(repo, runId) {
  const path = `/repos/${repo}/actions/runs/${runId}/artifacts?per_page=100`;
  const data = await ghApi(path);
  return data?.artifacts ?? [];
}

/**
 * Build per-run summary
 * @param {object} options
 * @param {string} options.repo
 * @param {object} options.workflowRun
 * @param {string} options.jobName
 * @param {string[]} options.artifactNames
 * @returns {Promise<object>}
 */
async function buildRunSummary({ repo, workflowRun, jobName, artifactNames }) {
  const jobs = await fetchJobs(repo, workflowRun.id);
  const artifacts = await fetchArtifacts(repo, workflowRun.id);
  const guardrailsJob = jobs.find(
    (job) => normalizeName(job.name) === normalizeName(jobName),
  );

  const runSummary = {
    runId: workflowRun.id,
    runNumber: workflowRun.run_number,
    runAttempt: workflowRun.run_attempt,
    headBranch: workflowRun.head_branch,
    event: workflowRun.event,
    status: workflowRun.status,
    conclusion: workflowRun.conclusion,
    queuedAt: workflowRun.created_at,
    startedAt: workflowRun.run_started_at || workflowRun.created_at,
    updatedAt: workflowRun.updated_at,
    guardrails: {
      status: guardrailsJob?.conclusion || null,
      durationMs: guardrailsJob ? jobDurationMs(guardrailsJob) : null,
      startedAt: guardrailsJob?.started_at || null,
      completedAt: guardrailsJob?.completed_at || null,
    },
    artifacts: {},
  };

  for (const artifactName of artifactNames) {
    const artifact = artifacts.find(
      (item) => normalizeName(item.name) === normalizeName(artifactName),
    );

    runSummary.artifacts[artifactName] = artifact
      ? {
          sizeBytes: artifact.size_in_bytes,
          downloadUrl: artifact.archive_download_url,
          expired: Boolean(artifact.expired),
        }
      : null;
  }

  return runSummary;
}

/**
 * Initialize artifact stats map
 * @param {string[]} names
 * @returns {Record<string, {sizes: number[], latest: object|null}>}
 */
function initArtifactStats(names) {
  return Object.fromEntries(
    names.map((name) => [name, { sizes: [], latest: null }]),
  );
}

/**
 * Compute duration in milliseconds for a job
 * @param {object} job
 * @returns {number|null}
 */
function jobDurationMs(job) {
  if (typeof job.run_duration_ms === "number") {
    return job.run_duration_ms;
  }

  if (job.started_at && job.completed_at) {
    const start = Date.parse(job.started_at);
    const end = Date.parse(job.completed_at);
    if (Number.isFinite(start) && Number.isFinite(end)) {
      return Math.max(end - start, 0);
    }
  }

  return null;
}

/**
 * Summarize artifact stats
 * @param {Record<string, {sizes: number[], latest: object|null}>} stats
 * @returns {object}
 */
function summarizeArtifacts(stats) {
  const summary = {};

  for (const [name, data] of Object.entries(stats)) {
    const sorted = [...data.sizes].sort((a, b) => a - b);
    summary[name] = {
      latest: data.latest,
      observations: sorted.length,
      p50Bytes: sorted.length ? percentile(sorted, 50) : null,
      p95Bytes: sorted.length ? percentile(sorted, 95) : null,
      maxBytes: sorted.length ? sorted[sorted.length - 1] : null,
      minBytes: sorted.length ? sorted[0] : null,
    };
  }

  return summary;
}

/**
 * Summarize guardrail durations
 * @param {number[]} durations
 * @returns {object}
 */
function summarizeDurations(durations) {
  const sorted = [...durations].sort((a, b) => a - b);

  return {
    observations: sorted.length,
    p50Ms: sorted.length ? percentile(sorted, 50) : null,
    p95Ms: sorted.length ? percentile(sorted, 95) : null,
    maxMs: sorted.length ? sorted[sorted.length - 1] : null,
    minMs: sorted.length ? sorted[0] : null,
  };
}

/**
 * Percentile helper
 * @param {number[]} values
 * @param {number} percentileValue
 * @returns {number}
 */
function percentile(values, percentileValue) {
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];

  const position = (percentileValue / 100) * (values.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);

  if (lowerIndex === upperIndex) {
    return values[lowerIndex];
  }

  const lower = values[lowerIndex];
  const upper = values[upperIndex];
  const weight = position - lowerIndex;

  return Math.round(lower + (upper - lower) * weight);
}

/**
 * Normalize comparison names
 * @param {string} value
 * @returns {string}
 */
function normalizeName(value) {
  return (value || "").trim().toLowerCase();
}

/**
 * Call gh api and return parsed JSON
 * @param {string} endpoint
 * @returns {Promise<object>}
 */
async function ghApi(endpoint) {
  const { stdout } = await execa("gh", ["api", endpoint]);
  return JSON.parse(stdout);
}
