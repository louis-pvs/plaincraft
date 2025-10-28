/**
 * core.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Pure helper functions for scripts - no I/O side effects
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

/**
 * Logger with configurable levels
 */
export class Logger {
  static levels = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 };

  constructor(level = "info") {
    this.level = Logger.levels[level] ?? Logger.levels.info;
  }

  trace(...args) {
    if (this.level <= Logger.levels.trace) console.error("[TRACE]", ...args);
  }

  debug(...args) {
    if (this.level <= Logger.levels.debug) console.error("[DEBUG]", ...args);
  }

  info(...args) {
    if (this.level <= Logger.levels.info) console.error("[INFO]", ...args);
  }

  warn(...args) {
    if (this.level <= Logger.levels.warn) console.error("[WARN]", ...args);
  }

  error(...args) {
    if (this.level <= Logger.levels.error) console.error("[ERROR]", ...args);
  }
}

/**
 * Find repository root by walking up from cwd until .git is found
 * @param {string} [startPath=process.cwd()] - Starting directory
 * @returns {Promise<string>} Absolute path to repo root
 */
export async function repoRoot(startPath = process.cwd()) {
  let current = path.resolve(startPath);

  while (true) {
    try {
      await fs.access(path.join(current, ".git"));
      return current;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) {
        throw new Error("Not in a git repository");
      }
      current = parent;
    }
  }
}

/**
 * Atomic file write - write to temp, then rename
 * @param {string} targetPath - Final file path
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
export async function atomicWrite(targetPath, content) {
  const dir = path.dirname(targetPath);
  const tmpPath = path.join(
    tmpdir(),
    `atomic-${randomBytes(8).toString("hex")}.tmp`,
  );

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(tmpPath, content, "utf-8");
    await fs.rename(tmpPath, targetPath);
  } catch (error) {
    try {
      await fs.unlink(tmpPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Parse CLI flags into structured object
 * @param {string[]} argv - Process arguments (from process.argv.slice(2))
 * @returns {object} Parsed flags
 */
export function parseFlags(argv = process.argv.slice(2)) {
  const parsed = {
    _: [],
    dryRun: true, // default to dry-run
    yes: false,
    output: "text",
    logLevel: "info",
    cwd: process.cwd(),
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--yes" || arg === "-y") {
      parsed.yes = true;
      parsed.dryRun = false;
    } else if (arg === "--output" || arg === "-o") {
      parsed.output = argv[++i];
    } else if (arg === "--log-level") {
      parsed.logLevel = argv[++i];
    } else if (arg === "--cwd") {
      parsed.cwd = argv[++i];
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const nextArg = argv[i + 1];
      if (nextArg && !nextArg.startsWith("--")) {
        parsed[key] = nextArg;
        i++;
      } else {
        parsed[key] = true;
      }
    } else {
      parsed._.push(arg);
    }
  }

  return parsed;
}

/**
 * Generate ISO timestamp
 * @returns {string} ISO 8601 timestamp
 */
export function now() {
  return new Date().toISOString();
}

/**
 * Generate unique run ID
 * @returns {string} Run ID in format: timestamp-random
 */
export function generateRunId() {
  const timestamp = Date.now();
  const random = randomBytes(3).toString("hex");
  return `${timestamp}-${random}`;
}

/**
 * Format output based on output mode
 * @param {object} data - Data to output
 * @param {string} mode - 'json' or 'text'
 * @returns {string} Formatted output
 */
export function formatOutput(data, mode = "text") {
  if (mode === "json") {
    return JSON.stringify(data, null, 0) + "\n";
  }

  // Pretty text format
  const lines = [];
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "object" && value !== null) {
      lines.push(`${key}:`);
      lines.push(JSON.stringify(value, null, 2));
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join("\n") + "\n";
}

/**
 * Exit with structured error
 * @param {object} options - Options
 * @param {number} options.exitCode - Exit code
 * @param {string} options.message - Error message
 * @param {*} options.error - Error details
 * @param {string} options.output - Output mode
 * @param {string} options.script - Script name
 */
export function fail(options) {
  const { exitCode = 1, message, error, output = "text", script } = options;
  const result = { ok: false, script, message, error };
  process.stdout.write(formatOutput(result, output), () =>
    process.exit(exitCode),
  );
}

/**
 * Exit with success
 * @param {object} options - Options
 * @param {string} options.output - Output mode
 * @param {object} options - Additional data to include
 */
export function succeed(options) {
  const { output = "text", ...data } = options;
  const result = { ok: true, ...data };
  process.stdout.write(formatOutput(result, output), () => process.exit(0));
}

/**
 * Validate environment safety
 * @param {object} requirements - Requirements object
 * @returns {Promise<boolean>} True if safe
 */
export async function validateEnvironment(requirements = {}) {
  const issues = [];

  // Check for required env vars
  if (requirements.env) {
    for (const varName of requirements.env) {
      if (!process.env[varName]) {
        issues.push(`Missing required environment variable: ${varName}`);
      }
    }
  }

  // Check for git repository
  if (requirements.git !== false) {
    try {
      await repoRoot();
    } catch {
      issues.push("Not in a git repository");
    }
  }

  // Check Node version
  if (requirements.nodeVersion) {
    const current = process.versions.node;
    if (current < requirements.nodeVersion) {
      issues.push(
        `Node version ${requirements.nodeVersion}+ required, got ${current}`,
      );
    }
  }

  return issues.length === 0 ? true : issues;
}

/**
 * Check if path is inside repo root
 * @param {string} targetPath - Path to check
 * @param {string} rootPath - Repository root
 * @returns {boolean} True if inside repo
 */
export function isInsideRepo(targetPath, rootPath) {
  const resolved = path.resolve(targetPath);
  const root = path.resolve(rootPath);
  return resolved.startsWith(root);
}

/**
 * Read JSON file safely
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<object>} Parsed JSON
 */
export async function readJSON(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

/**
 * Write JSON file with atomic operation
 * @param {string} filePath - Target path
 * @param {object} data - Data to write
 * @returns {Promise<void>}
 */
export async function writeJSON(filePath, data) {
  const content = JSON.stringify(data, null, 2) + "\n";
  await atomicWrite(filePath, content);
}

/**
 * Calculate __dirname equivalent in ESM
 * @param {string} importMetaUrl - import.meta.url
 * @returns {string} Directory path
 */
export function getDirname(importMetaUrl) {
  return path.dirname(fileURLToPath(importMetaUrl));
}
