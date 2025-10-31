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
  resolveLogLevel,
  fail,
  succeed,
  Logger,
  repoRoot,
  generateRunId,
  atomicWrite,
} from "../_lib/core.mjs";

const start = Date.now();
const args = parseFlags(process.argv.slice(2));
const log = new Logger(resolveLogLevel({ flags: args }));

if (args.help) {
  // eslint-disable-next-line no-console
  console.log(`
Usage: node scripts/template-script.mjs [options]

Options:
  --help              Show this help message
  --dry-run           Preview changes without writing (default: true)
  --yes               Execute writes (overrides --dry-run)
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error
  --verbose           Shortcut for --log-level debug
  --quiet             Shortcut for --log-level error
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

const runId = generateRunId();
const dryRun = args.dryRun !== false && args.yes !== true;

log.info("script.start", { runId, dryRun, output: args.output });
log.debug("script.flags", { args });

try {
  // 1. Get repo root
  const root = await repoRoot(args.cwd);
  log.debug("context.repo", { root });

  // 2. Run preflight checks
  const preflightStep = log.step("preflight", { runId });
  await preflight(root, log);
  preflightStep.done();

  // 3. Build plan
  const planStep = log.step("plan.build", { runId });
  const plan = await buildPlan(root);
  planStep.done({ actions: plan.length });

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
  const execStep = log.step("plan.execute", { runId });
  const results = await executePlan(plan, root, log);
  execStep.done({ results: results.length });

  // 6. Success
  succeed({
    runId,
    script: "template-script",
    version: "0.1.0",
    results,
    durationMs: Date.now() - start,
  });
} catch (error) {
  log.error("script.fail", { runId, error: error.message });
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
 * @param {Logger} logger - Shared logger
 */
async function preflight(_root, logger) {
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
async function executePlan(plan, root, logger) {
  const results = [];

  for (const step of plan) {
    const stepLog = logger.step("plan.step", {
      action: step.action,
      file: step.file,
    });

    switch (step.action) {
      case "write":
        await atomicWrite(path.join(root, step.file), step.content);
        results.push({ action: "write", file: step.file, status: "success" });
        stepLog.done({ result: "updated" });
        break;

      default:
        stepLog.fail(new Error("unknown action"), { result: "unknown" });
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  return results;
}
