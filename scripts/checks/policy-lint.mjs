#!/usr/bin/env node
/**
 * policy-lint.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Enforce script guardrails and policy compliance
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
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
import {
  validateScriptHeader,
  validateCLIContract,
  detectDangerousPatterns,
  checkSizeCompliance,
  loadAllowlist,
} from "../_lib/validation.mjs";

const start = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/policy-lint.mjs [options]

Options:
  --help                 Show this help
  --output <format>      Output format: json|text (default: text)
  --log-level <level>    Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>           Working directory (default: current)
  --strict               Treat warnings as errors
  --ignore <dirs>        Comma-separated directory names to skip (default: DEPRECATED)
  --include-deprecated   Include scripts in scripts/DEPRECATED (overrides --ignore)
  --filter <patterns>    Comma-separated substrings to include (relative path match)
  --report               Emit machine-readable JSON summary

Description:
  Validates all scripts against repository guardrails:
  - Header metadata (@since, @version, @deprecated)
  - CLI contract compliance (--dry-run, --yes, --output, etc.)
  - Dangerous pattern detection (sudo, rm -rf, eval, etc.)
  - Size limits (<300 LOC per script, <60 LOC per function)
  - Deprecated script age enforcement (>90 days)

Exit codes:
  0  - All checks passed
  11 - Validation failed
  13 - Unsafe patterns detected
`);
  process.exit(0);
}

const logger = new Logger(resolveLogLevel({ flags: args }));
const runId = generateRunId();
const reportMode = Boolean(args.report);

logger.debug("Policy lint started", {
  example:
    "Every script header should include @since YYYY-MM-DD and @version x.y.z",
});

try {
  const root = await repoRoot(args.cwd);
  const scriptsDir = path.join(root, "scripts");
  const allowlistConfig = await loadAllowlist();
  const policyIgnore =
    allowlistConfig?.policyIgnore?.map((pattern) =>
      pattern.replace(/\\/g, "/"),
    ) ?? [];

  const userIgnores = parseListArg(args.ignore);
  const filters = parseListArg(args.filter).map((pattern) =>
    pattern.toLowerCase(),
  );
  const includeDeprecated = Boolean(args["include-deprecated"]);

  const excludeDirs = ["node_modules", ".git", ...userIgnores];
  if (!includeDeprecated && !userIgnores.includes("DEPRECATED")) {
    excludeDirs.push("DEPRECATED");
  }

  // Scan for all .mjs scripts (excluding _lib, node_modules, etc.)
  let scriptFiles = await findScriptFiles(scriptsDir, excludeDirs);

  scriptFiles = scriptFiles.filter((filePath) => {
    const relative = path.relative(root, filePath).replace(/\\/g, "/");
    return !policyIgnore.some((pattern) => {
      if (pattern.endsWith("/*")) {
        const dir = pattern.slice(0, -2);
        return relative === dir || relative.startsWith(`${dir}/`);
      }
      if (pattern.endsWith("/")) {
        return relative.startsWith(pattern);
      }
      return relative === pattern;
    });
  });

  if (filters.length > 0) {
    scriptFiles = scriptFiles.filter((filePath) => {
      const relative = path.relative(root, filePath).toLowerCase();
      return filters.some((pattern) => relative.includes(pattern));
    });
  }

  logger.debug("Scripts queued for validation", {
    count: scriptFiles.length,
    strict: Boolean(args.strict),
    example: "Example script: scripts/ops/create-worktree-pr.mjs",
  });

  const results = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const scriptPath of scriptFiles) {
    const relativePath = path.relative(root, scriptPath);
    logger.debug("Validating script", {
      file: relativePath,
      example: "Header should include @since and CLI must support --dry-run",
    });

    const content = await readFile(scriptPath, "utf-8");
    const result = {
      file: relativePath,
      errors: [],
      warnings: [],
    };

    // Validate header
    const headerValidation = validateScriptHeader(content);
    result.errors.push(...headerValidation.errors);
    result.warnings.push(...headerValidation.warnings);

    // Validate CLI contract (skip for _lib helpers)
    if (!scriptPath.includes("/_lib/")) {
      const cliValidation = validateCLIContract(content);
      result.errors.push(...cliValidation.errors);
    }

    // Detect dangerous patterns
    const dangerValidation = detectDangerousPatterns(content);
    result.errors.push(...dangerValidation.errors);
    result.warnings.push(...dangerValidation.warnings);

    // Check size compliance
    const sizeValidation = checkSizeCompliance(content);
    result.warnings.push(...sizeValidation.warnings);

    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    if (result.errors.length > 0 || result.warnings.length > 0) {
      results.push(result);
    }
  }

  // Check deprecated scripts
  if (includeDeprecated) {
    const deprecatedDir = path.join(scriptsDir, "DEPRECATED");
    try {
      const deprecatedFiles = await readdir(deprecatedDir);
      for (const file of deprecatedFiles) {
        if (!file.endsWith(".mjs")) continue;

        const filePath = path.join(deprecatedDir, file);
        const content = await readFile(filePath, "utf-8");
        const headerValidation = validateScriptHeader(content);

        if (headerValidation.errors.some((e) => e.includes(">90 days"))) {
          results.push({
            file: path.relative(root, filePath),
            errors: headerValidation.errors,
            warnings: [],
          });
          totalErrors += headerValidation.errors.length;
        }
      }
    } catch {
      // DEPRECATED dir doesn't exist yet
    }
  }

  const durationMs = Date.now() - start;

  // Determine exit code
  let exitCode = 0;
  let status = "passed";

  if (args.strict && totalWarnings > 0) {
    exitCode = 11;
    status = "failed";
  } else if (totalErrors > 0) {
    exitCode = results.some((r) =>
      r.errors.some((e) => e.includes("sudo") || e.includes("eval")),
    )
      ? 13
      : 11;
    status = "failed";
  }

  const output = {
    runId,
    script: "policy-lint",
    status,
    totalFiles: scriptFiles.length,
    totalErrors,
    totalWarnings,
    durationMs,
  };

  if (results.length > 0) {
    output.results = results;
  }

  if (reportMode) {
    console.log(JSON.stringify({ "policy-lint": output }, null, 2));
    process.exitCode = exitCode;
  } else if (exitCode === 0) {
    succeed(output, args.output);
  } else {
    process.stdout.write(formatOutput(output, args.output));
    process.exit(exitCode);
  }
} catch (error) {
  logger.error("Policy lint failed", {
    error: error?.message || String(error),
    example:
      "Script headers should follow the template: @since YYYY-MM-DD, @version 0.1.0",
  });
  fail({
    exitCode: 11,
    script: "policy-lint",
    message: "Policy lint failed",
    error: error?.message || String(error),
    output: args.output,
  });
}

/**
 * Find all script files recursively
 * @param {string} dir - Directory to search
 * @param {string[]} [exclude] - Directories to exclude
 * @returns {Promise<string[]>} Script file paths
 */
async function findScriptFiles(dir, exclude = ["node_modules", ".git"]) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip excluded directories
      if (exclude.includes(entry.name)) continue;
      // Skip _lib for CLI contract checks (validated separately)
      files.push(...(await findScriptFiles(fullPath, exclude)));
    } else if (entry.isFile() && entry.name.endsWith(".mjs")) {
      // Skip test files
      if (!entry.name.endsWith(".spec.mjs")) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Parse ignore argument into directory names
 * @param {string|string[]} ignoreArg - Argument value
 * @returns {string[]} Directory names
 */
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
