#!/usr/bin/env node
/**
 * size-check.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Check script and function size compliance
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

const start = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/size-check.mjs [options]

Options:
  --help              Show this help
  --dry-run           Preview mode without making changes (default: true)
  --yes               Execute mode (confirms execution)
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current)
  --strict            Treat warnings as errors (enforced after 30 days)

Description:
  Validates script size compliance:
  - Scripts must be <300 LOC
  - Functions must be <60 LOC

Exit codes:
  0  - All checks passed
  11 - Size violations found (in strict mode)
`);
  process.exit(0);
}

const logger = new Logger(resolveLogLevel({ flags: args }));
const runId = generateRunId();
const MAX_SCRIPT_LINES = 300;
const MAX_FUNCTION_LINES = 60;

logger.info("Size compliance check started", {
  maxScriptLines: MAX_SCRIPT_LINES,
  maxFunctionLines: MAX_FUNCTION_LINES,
  example: "Keep scripts under 300 lines with functions under 60 lines.",
});

try {
  const root = await repoRoot(args.cwd);
  const scriptsDir = path.join(root, "scripts");

  const scriptFiles = await findScriptFiles(scriptsDir);
  logger.info("Scanning scripts", {
    count: scriptFiles.length,
    example: "Example script: scripts/ops/example.mjs",
  });

  const results = [];
  let totalViolations = 0;

  for (const scriptPath of scriptFiles) {
    const relativePath = path.relative(root, scriptPath);
    logger.debug("Checking script", {
      file: relativePath,
      example: "Document verbose logic in helpers rather than inline.",
    });

    const content = await readFile(scriptPath, "utf-8");
    const lines = content.split("\n");
    const lineCount = lines.length;

    const result = {
      file: relativePath,
      lines: lineCount,
      violations: [],
    };

    // Check script size
    if (lineCount > MAX_SCRIPT_LINES) {
      result.violations.push({
        type: "script_size",
        lines: lineCount,
        limit: MAX_SCRIPT_LINES,
        message: `Script exceeds ${MAX_SCRIPT_LINES} LOC (${lineCount} lines)`,
      });
      totalViolations++;
    }

    // Check function sizes
    const functionViolations = checkFunctionSizes(content);
    result.violations.push(...functionViolations);
    totalViolations += functionViolations.length;

    if (result.violations.length > 0) {
      results.push(result);
    }
  }

  const durationMs = Date.now() - start;

  if (totalViolations === 0) {
    succeed({
      runId,
      script: "size-check",
      status: "passed",
      totalScripts: scriptFiles.length,
      violations: 0,
      durationMs,
    });
  } else {
    const output = {
      runId,
      script: "size-check",
      status: args.strict ? "failed" : "warning",
      totalScripts: scriptFiles.length,
      violations: totalViolations,
      results,
      durationMs,
      message: args.strict
        ? "Size violations found (strict mode)"
        : "Size violations found (warning only, will be enforced after 30 days)",
    };

    formatOutput(output, args.output);

    if (args.strict) {
      process.exit(11);
    } else {
      process.exit(0);
    }
  }
} catch (error) {
  logger.error("Size check failed", {
    error: error?.message || String(error),
    example: "Example: split large scripts into separate modules.",
  });
  fail({
    runId,
    script: "size-check",
    error: error.message,
    stack: error.stack,
  });
}

/**
 * Find all script files recursively
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>} Array of script file paths
 */
async function findScriptFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules, _archive, DEPRECATED
    if (
      entry.name === "node_modules" ||
      entry.name.startsWith(".") ||
      entry.name === "_archive"
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await findScriptFiles(fullPath)));
    } else if (entry.name.endsWith(".mjs")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check function sizes in script content
 * @param {string} content - Script content
 * @returns {object[]} Array of violations
 */
function checkFunctionSizes(content) {
  const violations = [];

  // Match function declarations and arrow functions
  const functionPatterns = [
    /(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/g,
  ];

  for (const pattern of functionPatterns) {
    const matches = [...content.matchAll(pattern)];

    for (const match of matches) {
      const functionName = match[1];
      const startIndex = match.index;
      let braceCount = 1;
      let endIndex = startIndex + match[0].length;

      // Find matching closing brace
      for (let i = endIndex; i < content.length; i++) {
        if (content[i] === "{") braceCount++;
        if (content[i] === "}") {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i;
            break;
          }
        }
      }

      const functionCode = content.slice(startIndex, endIndex + 1);
      const functionLines = functionCode.split("\n").length;

      if (functionLines > MAX_FUNCTION_LINES) {
        violations.push({
          type: "function_size",
          function: functionName,
          lines: functionLines,
          limit: MAX_FUNCTION_LINES,
          message: `Function '${functionName}' exceeds ${MAX_FUNCTION_LINES} LOC (${functionLines} lines)`,
        });
      }
    }
  }

  return violations;
}
