#!/usr/bin/env node
/**
 * smoke.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Smoke test all scripts for basic functionality
 */

import { readdir } from "node:fs/promises";
import path from "node:path";
import { execa } from "execa";
import {
  parseFlags,
  resolveLogLevel,
  formatOutput,
  fail,
  succeed,
  Logger,
  repoRoot,
  generateRunId,
} from "../_lib/core.mjs";

const start = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/smoke.mjs [options]

Options:
  --help              Show this help
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current)
  --timeout <ms>      Timeout per script in milliseconds (default: 5000)
  --filter <patterns> Comma-separated substrings to include (relative path match)
  --report            Emit machine-readable JSON summary

Description:
  Runs basic smoke tests on all scripts:
  - Executes --help flag (must exit 0)
  - For ops scripts: executes --dry-run --output json
  --yes               Execute mode (confirms execution, overrides --dry-run)

Exit codes:
  0  - All tests passed
  11 - One or more scripts failed smoke test
`);
  process.exit(0);
}

const logger = new Logger(resolveLogLevel({ flags: args }));
const runId = generateRunId();
const timeout = parseInt(args.timeout) || 5000;
const reportMode = Boolean(args.report);

logger.debug("Smoke tests started", { timeoutMs: timeout });
logger.debug("Smoke test expectation", {
  example:
    "Each script should exit 0 for '--help' and support '--dry-run --output json'.",
});

try {
  const root = await repoRoot(args.cwd);
  const scriptsDir = path.join(root, "scripts");

  // Find all executable scripts
  let scriptFiles = await findExecutableScripts(scriptsDir);

  const filters = parseListArg(args.filter).map((pattern) =>
    pattern.toLowerCase(),
  );
  if (filters.length > 0) {
    scriptFiles = scriptFiles.filter((filePath) => {
      const relative = path.relative(root, filePath).toLowerCase();
      return filters.some((pattern) => relative.includes(pattern));
    });
  }

  logger.debug("Executable scripts detected", {
    count: scriptFiles.length,
    example: "Example script: scripts/ops/create-worktree-pr.mjs",
  });

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const scriptPath of scriptFiles) {
    const relativePath = path.relative(root, scriptPath);
    logger.debug("Testing script", {
      file: relativePath,
      example: `node ${relativePath} --help`,
    });

    const result = {
      file: relativePath,
      tests: [],
    };

    // Test 1: --help flag
    const helpTest = await testHelp(scriptPath, timeout);
    result.tests.push(helpTest);

    if (helpTest.passed) passed++;
    else failed++;

    // Test 2: --dry-run for ops scripts
    if (scriptPath.includes("/ops/")) {
      const dryRunTest = await testDryRun(scriptPath, timeout);
      result.tests.push(dryRunTest);

      if (dryRunTest.passed) passed++;
      else failed++;
    }

    results.push(result);
  }

  const durationMs = Date.now() - start;

  const output = {
    runId,
    script: "smoke",
    status: failed === 0 ? "passed" : "failed",
    totalScripts: scriptFiles.length,
    totalTests: passed + failed,
    passed,
    failed,
    durationMs,
  };

  if (failed > 0) {
    output.results = results.filter((r) => r.tests.some((t) => !t.passed));
  }

  if (reportMode) {
    console.log(JSON.stringify({ smoke: output }, null, 2));
    process.exitCode = failed === 0 ? 0 : 11;
  } else if (failed === 0) {
    succeed(output, args.output);
  } else {
    process.stdout.write(formatOutput(output, args.output));
    process.exit(11);
  }
} catch (error) {
  logger.error("Smoke test failed", {
    error: error?.message || String(error),
    example: "Scripts should support '--help' and '--dry-run --output json'.",
  });
  fail({
    exitCode: 11,
    script: "smoke",
    message: "Smoke test failed",
    error: error?.message || String(error),
    output: args.output,
  });
}

/**
 * Test --help flag
 * @param {string} scriptPath - Path to script
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<object>} Test result
 */
async function testHelp(scriptPath, timeout) {
  try {
    const { exitCode } = await execa("node", [scriptPath, "--help"], {
      timeout,
      reject: false,
    });

    return {
      name: "--help",
      passed: exitCode === 0,
      exitCode,
      error: exitCode !== 0 ? `Exited with code ${exitCode}` : null,
    };
  } catch (error) {
    return {
      name: "--help",
      passed: false,
      error: error.message,
    };
  }
}

/**
 * Test --dry-run --output json
 * @param {string} scriptPath - Path to script
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<object>} Test result
 */
async function testDryRun(scriptPath, timeout) {
  try {
    const { stdout, all, exitCode } = await execa(
      "node",
      [scriptPath, "--dry-run", "--output", "json"],
      {
        timeout,
        reject: false,
        all: true,
      },
    );

    // Dry run should exit with 0 or 2 (noop)
    const validExit = exitCode === 0 || exitCode === 2;

    // Try to parse JSON output
    let jsonValid = false;
    try {
      const jsonCandidate = extractJson(stdout || all || "");
      if (jsonCandidate) {
        JSON.parse(jsonCandidate);
        jsonValid = true;
      }
    } catch {
      // JSON parsing failed, jsonValid remains false
    }

    return {
      name: "--dry-run --output json",
      passed: validExit && jsonValid,
      exitCode,
      error: !validExit
        ? `Exited with code ${exitCode}`
        : !jsonValid
          ? "Invalid JSON output"
          : null,
    };
  } catch (error) {
    return {
      name: "--dry-run --output json",
      passed: false,
      error: error.message,
    };
  }
}

/**
 * Find all executable script files
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>} Executable script paths
 */
async function findExecutableScripts(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip these directories
      if (["node_modules", ".git", "_lib", "DEPRECATED"].includes(entry.name)) {
        continue;
      }
      files.push(...(await findExecutableScripts(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".mjs")) {
      // Skip test files and lib files
      if (!entry.name.endsWith(".spec.mjs")) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function parseListArg(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      String(item)
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    );
  }

  return String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function extractJson(output) {
  if (!output) return null;
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return output.slice(start, end + 1);
}
