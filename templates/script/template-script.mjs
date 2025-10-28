#!/usr/bin/env node
/**
 * template-script.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Template for creating compliant automation scripts
 */

import path from "node:path";
import {
  parseFlags,
  fail,
  succeed,
  Logger,
  repoRoot,
  generateRunId,
  atomicWrite,
} from "../_lib/core.mjs";

const start = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  // eslint-disable-next-line no-console
  console.log(`
Usage: node scripts/template-script.mjs [options]

Options:
  --help              Show this help message
  --dry-run           Preview changes without writing (default: true)
  --yes               Execute writes (overrides --dry-run)
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current directory)

Description:
  [Describe what this script does in 1-2 sentences]

Exit codes:
  0  - Success
  2  - Noop/idempotent (no changes needed)
  3  - Partial success, retryable
  10 - Precondition failed
  11 - Validation failed
  13 - Unsafe environment detected

Examples:
  node scripts/template-script.mjs --help
  node scripts/template-script.mjs --dry-run
  node scripts/template-script.mjs --yes
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");
const runId = generateRunId();
const dryRun = args.dryRun !== false && args.yes !== true;

logger.info(`Starting template-script (runId: ${runId})`);
logger.debug(`Options: ${JSON.stringify(args)}`);

try {
  // 1. Get repo root
  const root = await repoRoot(args.cwd);
  logger.debug(`Repository root: ${root}`);

  // 2. Run preflight checks
  await preflight(root);

  // 3. Build plan
  const plan = await buildPlan(root);
  logger.info(`Plan: ${plan.length} actions`);

  // 4. Execute or preview
  if (dryRun) {
    succeed({
      runId,
      script: "template-script",
      version: "0.1.0",
      dryRun: true,
      plan,
      durationMs: Date.now() - start,
    });
    process.exit(0);
  }

  // 5. Execute plan
  const results = await executePlan(plan, root);

  // 6. Success
  succeed({
    runId,
    script: "template-script",
    version: "0.1.0",
    results,
    durationMs: Date.now() - start,
  });
} catch (error) {
  fail({
    runId,
    script: "template-script",
    version: "0.1.0",
    error: error.message,
    stack: error.stack,
    durationMs: Date.now() - start,
  });
}

/**
 * Preflight validation checks
 * @param {string} _root - Repository root path
 */
async function preflight(_root) {
  // Add precondition checks here
  // Example: check if required files exist, git status clean, etc.
  logger.debug("Preflight checks passed");
}

/**
 * Build execution plan
 * @param {string} _root - Repository root path
 * @returns {Promise<Array>} Plan steps
 */
async function buildPlan(_root) {
  const plan = [];

  // Add plan steps here
  // Example: { action: "write", file: "path/to/file", content: "..." }

  return plan;
}

/**
 * Execute the plan
 * @param {Array} plan - Plan steps
 * @param {string} root - Repository root path
 * @returns {Promise<Array>} Execution results
 */
async function executePlan(plan, root) {
  const results = [];

  for (const step of plan) {
    logger.info(`Executing: ${step.action} ${step.file || ""}`);

    switch (step.action) {
      case "write":
        await atomicWrite(path.join(root, step.file), step.content);
        results.push({ action: "write", file: step.file, status: "success" });
        break;

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  return results;
}
