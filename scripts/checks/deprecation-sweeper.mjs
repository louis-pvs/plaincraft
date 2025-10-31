#!/usr/bin/env node
/**
 * deprecation-sweeper.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Enforce 90-day TTL for deprecated scripts
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  parseFlags,
  resolveLogLevel,
  formatOutput,
  fail,
  Logger,
  repoRoot,
  generateRunId,
} from "../_lib/core.mjs";

const start = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/deprecation-sweeper.mjs [options]

Options:
  --help              Show this help
  --dry-run           Preview mode without making changes (default: true)
  --yes               Execute mode (confirms execution)
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current)

Description:
  Enforces 90-day TTL for deprecated scripts:
  - Checks all scripts for @deprecated tags with since= date
  - Fails if any script in DEPRECATED/ is older than 90 days
  - Reports scripts approaching deprecation deadline

Exit codes:
  0  - No expired deprecations
  11 - Deprecated scripts older than 90 days found
`);
  process.exit(0);
}

const logger = new Logger(resolveLogLevel({ flags: args }));
const runId = generateRunId();
const MAX_DEPRECATED_DAYS = 90;

logger.info("Deprecation sweep started", {
  maxDays: MAX_DEPRECATED_DAYS,
  example: "@deprecated since=2025-10-01 replace=scripts/new-script.mjs",
});

try {
  const root = await repoRoot(args.cwd);
  const scriptsDir = path.join(root, "scripts");
  const deprecatedDir = path.join(scriptsDir, "DEPRECATED");

  const allScripts = await findAllScripts(scriptsDir);
  const deprecatedScripts = [];
  const expiredScripts = [];
  const warningScripts = [];

  logger.info("Scanning scripts for @deprecated", {
    total: allScripts.length,
    example: "Use '@deprecated since=YYYY-MM-DD replace=path/to/new-script'.",
  });

  for (const scriptPath of allScripts) {
    const relativePath = path.relative(root, scriptPath);
    const content = await readFile(scriptPath, "utf-8");

    // Check for @deprecated tag
    const deprecatedMatch = content.match(
      /@deprecated\s+since=(\d{4}-\d{2}-\d{2})(?:\s+replace=([^\s\n]+))?/,
    );

    if (deprecatedMatch) {
      const deprecatedDate = new Date(deprecatedMatch[1]);
      const replacementScript = deprecatedMatch[2] || "none specified";
      const now = new Date();
      const daysDeprecated = Math.floor(
        (now - deprecatedDate) / (1000 * 60 * 60 * 24),
      );
      const daysRemaining = MAX_DEPRECATED_DAYS - daysDeprecated;

      const scriptInfo = {
        file: relativePath,
        deprecatedSince: deprecatedMatch[1],
        daysDeprecated,
        daysRemaining,
        replacement: replacementScript,
      };

      deprecatedScripts.push(scriptInfo);

      if (daysDeprecated > MAX_DEPRECATED_DAYS) {
        expiredScripts.push(scriptInfo);
        logger.error("Deprecated script expired", {
          file: relativePath,
          daysDeprecated,
          replacement: replacementScript,
          example:
            "@deprecated since=2025-10-01 replace=scripts/new-script.mjs",
        });
      } else if (daysRemaining <= 14) {
        warningScripts.push(scriptInfo);
        logger.warn("Deprecated script nearing expiry", {
          file: relativePath,
          daysRemaining,
          replacement: replacementScript,
          example:
            "@deprecated since=2025-10-01 replace=scripts/new-script.mjs",
        });
      } else {
        logger.debug("Deprecated script tracked", {
          file: relativePath,
          daysRemaining,
          example:
            "@deprecated since=2025-10-01 replace=scripts/new-script.mjs",
        });
      }
    }
  }

  // Check DEPRECATED directory for old files
  try {
    const deprecatedFiles = await findAllScripts(deprecatedDir);
    for (const filePath of deprecatedFiles) {
      const relativePath = path.relative(root, filePath);
      const stats = await stat(filePath);
      const ageInDays = Math.floor(
        (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24),
      );

      if (ageInDays > MAX_DEPRECATED_DAYS) {
        expiredScripts.push({
          file: relativePath,
          deprecatedSince: "file age",
          daysDeprecated: ageInDays,
          daysRemaining: 0,
          replacement: "check file header",
        });
        logger.error("Deprecated folder script expired", {
          file: relativePath,
          daysOld: ageInDays,
          example:
            "Move script out of scripts/DEPRECATED or replace before 90 days.",
        });
      }
    }
  } catch {
    // DEPRECATED directory doesn't exist yet
    logger.debug("DEPRECATED directory not found", {
      example: "Create scripts/DEPRECATED/ when parking legacy scripts.",
    });
  }

  const durationMs = Date.now() - start;

  const output = {
    runId,
    script: "deprecation-sweeper",
    status: expiredScripts.length > 0 ? "failed" : "passed",
    totalScripts: allScripts.length,
    deprecated: deprecatedScripts.length,
    expired: expiredScripts.length,
    warnings: warningScripts.length,
    expiredScripts,
    warningScripts,
    durationMs,
  };

  formatOutput(output, args.output);

  if (expiredScripts.length > 0) {
    process.exit(11);
  } else {
    process.exit(0);
  }
} catch (error) {
  logger.error("Deprecation sweep failed", {
    error: error?.message || String(error),
    example: "@deprecated since=2025-10-01 replace=scripts/new-script.mjs",
  });
  fail({
    runId,
    script: "deprecation-sweeper",
    error: error.message,
    stack: error.stack,
  });
}

/**
 * Find all script files recursively
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>} Array of script file paths
 */
async function findAllScripts(dir) {
  if (
    dir.includes(`${path.sep}__fixtures__${path.sep}`) ||
    dir.endsWith(`${path.sep}__fixtures__`)
  ) {
    return [];
  }

  const files = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules and hidden files
      if (
        entry.name === "node_modules" ||
        entry.name.startsWith(".") ||
        entry.name === "__fixtures__"
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...(await findAllScripts(fullPath)));
      } else if (entry.name.endsWith(".mjs")) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
    return [];
  }

  return files;
}
