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

const VALID_LOG_LEVELS = ["trace", "debug", "info", "warn", "error"];

function normalizeLogLevel(level) {
  if (!level) return null;
  const candidate = String(level).trim().toLowerCase();
  return VALID_LOG_LEVELS.includes(candidate) ? candidate : null;
}

function normalizeWhitespace(input) {
  if (input === undefined || input === null) return "";
  const value = typeof input === "string" ? input : String(input);
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeMetaKey(key) {
  return String(key || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-.:]/g, "");
}

function formatMetaValue(value) {
  if (value === undefined) return undefined;
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : `"${value}"`;
  const stringValue = String(value);
  if (stringValue === "") return '""';
  return /\s|["]/.test(stringValue)
    ? `"${stringValue.replace(/"/g, '\\"')}"`
    : stringValue;
}

function flattenMeta(input = {}) {
  const output = {};
  if (!input || typeof input !== "object") return output;

  for (const [rawKey, rawValue] of Object.entries(input)) {
    const key = sanitizeMetaKey(rawKey);
    if (!key) continue;

    if (
      rawValue &&
      typeof rawValue === "object" &&
      !Array.isArray(rawValue) &&
      !(rawValue instanceof Error)
    ) {
      output[key] = formatMetaValue(JSON.stringify(rawValue));
      continue;
    }

    if (rawValue instanceof Error) {
      output[key] = formatMetaValue(rawValue.message);
      continue;
    }

    const formatted = formatMetaValue(rawValue);
    if (formatted !== undefined) {
      output[key] = formatted;
    }
  }

  return output;
}

function formatDurationMs(start) {
  const elapsedNs = process.hrtime.bigint() - start;
  const elapsedMs = Number(elapsedNs) / 1_000_000;
  if (elapsedMs >= 100) return `${Math.round(elapsedMs)}ms`;
  if (elapsedMs >= 10) return `${elapsedMs.toFixed(1)}ms`;
  return `${elapsedMs.toFixed(2)}ms`;
}

function stringFromError(error) {
  if (!error) return "";
  if (error instanceof Error) return normalizeWhitespace(error.message);
  return normalizeWhitespace(error);
}

/**
 * Logger with structured single-line output
 */
export class Logger {
  static levels = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 };

  constructor(level = "info") {
    const normalized = normalizeLogLevel(level) ?? "info";
    this.level = Logger.levels[normalized];
  }

  setLevel(level) {
    const normalized = normalizeLogLevel(level) ?? "info";
    this.level = Logger.levels[normalized];
  }

  trace(...args) {
    this.#log("trace", args);
  }

  debug(...args) {
    this.#log("debug", args);
  }

  info(...args) {
    this.#log("info", args);
  }

  warn(...args) {
    this.#log("warn", args);
  }

  error(...args) {
    this.#log("error", args);
  }

  step(action, baseMeta = {}) {
    const start = process.hrtime.bigint();
    const sanitizedAction = normalizeWhitespace(action) || "step";
    const initialMeta = flattenMeta(baseMeta);

    return {
      done: (meta = {}) => {
        const duration = formatDurationMs(start);
        const combinedMeta = {
          ...initialMeta,
          ...flattenMeta(meta),
          status: "ok",
          duration,
        };
        this.info(sanitizedAction, combinedMeta);
      },
      fail: (error, meta = {}) => {
        const duration = formatDurationMs(start);
        const combinedMeta = {
          ...initialMeta,
          ...flattenMeta(meta),
          status: "error",
          error: stringFromError(error),
          duration,
        };
        this.error(sanitizedAction, combinedMeta);
      },
    };
  }

  #log(level, args) {
    if (this.level > Logger.levels[level]) return;
    if (!args || args.length === 0) return;

    const [first, ...rest] = args;
    const messageParts = [];
    const meta = {};

    if (first instanceof Error) {
      messageParts.push(stringFromError(first));
      if (first.stack) {
        meta.stack = formatMetaValue(first.stack.split("\n")[0]);
      }
    } else if (typeof first === "object" && first !== null) {
      Object.assign(meta, flattenMeta(first));
    } else {
      messageParts.push(normalizeWhitespace(first));
    }

    for (const item of rest) {
      if (item === undefined || item === null) continue;

      if (item instanceof Error) {
        const errorMessage = stringFromError(item);
        if (errorMessage) {
          meta.error = formatMetaValue(errorMessage);
        }
        continue;
      }

      if (typeof item === "object") {
        Object.assign(meta, flattenMeta(item));
        continue;
      }

      messageParts.push(normalizeWhitespace(item));
    }

    const message = messageParts.filter(Boolean).join(" ").trim();
    const metaEntries = Object.entries(meta)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const formattedValue =
          typeof value === "string" ? value : formatMetaValue(value);
        return formattedValue !== undefined ? `${key}=${formattedValue}` : null;
      })
      .filter(Boolean);

    const prefix = `[${level.toUpperCase()}]`;
    const line = [prefix, message, metaEntries.join(" ")]
      .filter(Boolean)
      .join(" ");

    console.error(line.trim());
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
export function resolveLogLevel({
  flags = {},
  env = process.env,
  explicit,
} = {}) {
  const envLevel = normalizeLogLevel(env?.LOG_LEVEL);
  const flagLevel = normalizeLogLevel(flags?.logLevel);

  if (explicit && flagLevel) return flagLevel;

  if (flags?.quiet) return "error";
  if (!explicit && flags?.verbose) return "debug";
  if (envLevel) return envLevel;
  if (flagLevel) return flagLevel;
  return "info";
}

export function parseFlags(argv = process.argv.slice(2), options = {}) {
  const env = options.env ?? process.env;
  const parsed = {
    _: [],
    dryRun: true, // default to dry-run
    yes: false,
    output: "text",
    logLevel: undefined,
    cwd: process.cwd(),
    help: false,
    verbose: false,
    quiet: false,
  };
  let logLevelFromFlag;

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
      logLevelFromFlag = argv[++i];
    } else if (arg === "--cwd") {
      parsed.cwd = argv[++i];
    } else if (arg === "--verbose" || arg === "-v") {
      parsed.verbose = true;
    } else if (arg === "--quiet" || arg === "-q") {
      parsed.quiet = true;
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

  const resolvedLogLevel = resolveLogLevel({
    flags: { ...parsed, logLevel: logLevelFromFlag },
    env,
    explicit: logLevelFromFlag !== undefined,
  });

  parsed.logLevel = resolvedLogLevel;

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
  if (output === "json") {
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } else {
    process.stdout.write(formatOutput(result, output));
  }
  process.exitCode = exitCode;
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
  if (output === "json") {
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } else {
    process.stdout.write(formatOutput(result, output));
  }
  process.exitCode = 0;
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
