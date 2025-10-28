#!/usr/bin/env node
/**
 * validate-ideas.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Validates idea files against structure requirements
 *
 * Checks all idea files in /ideas directory for:
 * - Correct filename patterns (U-, C-, ARCH-, PB-, B-)
 * - Required sections per idea type
 * - Lane specification
 * - Acceptance checklist presence
 */

import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, repoRoot } from "../_lib/core.mjs";
import {
  validateIdeaFile,
  findIdeaFiles,
  VALIDATION_RULES,
} from "../_lib/ideas.mjs";

const SCRIPT_NAME = "validate-ideas";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  strict: z.boolean().default(false),
  filter: z.string().optional(),
});

/**
 * Validate all idea files
 * @param {object} args - Parsed arguments
 * @param {Logger} log - Logger instance
 * @returns {Promise<object>} Validation results
 */
export async function validateIdeas(args, log) {
  const root = await repoRoot(args.cwd);
  const ideasDir = path.join(root, "ideas");

  if (!existsSync(ideasDir)) {
    const message =
      "Ideas workspace not found. Run `pnpm ideas:init --yes` to scaffold starter templates.";
    log.warn(message);
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      warnings: 1,
      files: [],
      status: "missing",
      message,
    };
  }

  log.info(`Scanning ideas directory: ${ideasDir}`);

  const ideaFiles = await findIdeaFiles(ideasDir, args.filter);

  if (ideaFiles.length === 0) {
    const message = args.filter
      ? `No ideas matching filter: ${args.filter}`
      : "No idea files found in /ideas. Run `pnpm ideas:init --yes` to scaffold starter templates.";
    log.warn(message);
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      warnings: 1,
      files: [],
      status: "empty",
      message,
    };
  }

  log.info(`Found ${ideaFiles.length} idea file(s)`);

  const results = {
    total: ideaFiles.length,
    valid: 0,
    invalid: 0,
    warnings: 0,
    files: [],
    status: "ok",
  };

  for (const filename of ideaFiles) {
    const filePath = path.join(ideasDir, filename);
    log.debug(`Validating: ${filename}`);

    const validation = await validateIdeaFile(filePath);
    results.files.push(validation);

    if (validation.valid) {
      results.valid++;
      log.info(`✓ ${filename}`);
    } else {
      results.invalid++;
      log.error(`✗ ${filename}`);
      for (const error of validation.errors) {
        log.error(`  - ${error}`);
      }
    }

    if (validation.warnings.length > 0) {
      results.warnings += validation.warnings.length;
      for (const warning of validation.warnings) {
        log.warn(`  ⚠ ${warning}`);
      }
    }
  }

  if (results.invalid > 0) {
    results.status = "error";
  } else if (results.warnings > 0) {
    results.status = "warn";
  }

  return results;
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  try {
    const args = ArgsSchema.parse(flags);

    if (args.help) {
      const types = Object.keys(VALIDATION_RULES).join(", ");
      console.log(`
Usage: ${SCRIPT_NAME} [options]

Validates idea files in /ideas directory for structural compliance.

Supported idea types: ${types}

Options:
  --help           Show this help message
  --dry-run        Show what would be validated (no actual validation)
  --yes               Execute mode (confirms execution, overrides --dry-run)
  --output <fmt>   Output format: text (default), json
  --log-level <lvl> Log level: error, warn, info (default), debug, trace
  --cwd <path>     Working directory (default: current)
  --strict         Treat warnings as errors
  --filter <name>  Only validate files matching pattern

Examples:
  ${SCRIPT_NAME}                    # Validate all idea files
  ${SCRIPT_NAME} --strict            # Warnings become errors
  ${SCRIPT_NAME} --filter U-         # Only validate unit ideas
  ${SCRIPT_NAME} --output json       # JSON output for CI

Exit codes:
  0  - All ideas valid
  2  - No ideas found
  11 - Validation failed (invalid ideas or --strict with warnings)

Validation checks:
  - Filename pattern matches idea type prefix
  - Required sections present
  - Lane specification (A, B, C, or D)
  - Acceptance checklist exists
`);
      process.exit(0);
    }

    // Run validation
    const results = await validateIdeas(args, log);

    // No ideas found
    if (results.total === 0) {
      const message =
        results.message ||
        (args.filter
          ? `No ideas matching filter: ${args.filter}`
          : "No idea files found");
      succeed({
        script: SCRIPT_NAME,
        message,
        exitCode: 2,
        output: args.output,
        data: results,
      });
      return;
    }

    // Check for failures
    const hasErrors = results.invalid > 0;
    const hasWarnings = results.warnings > 0;

    if (hasErrors || (args.strict && hasWarnings)) {
      const message = args.strict
        ? `${results.invalid} invalid, ${results.warnings} warnings (strict mode)`
        : `${results.invalid} invalid`;

      fail({
        script: SCRIPT_NAME,
        message,
        exitCode: 11,
        output: args.output,
        data: results,
      });
    }

    succeed({
      script: SCRIPT_NAME,
      message: `All ${results.valid} idea(s) valid${hasWarnings ? ` (${results.warnings} warnings)` : ""}`,
      output: args.output,
      data: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error("Validation error:", error.errors);
      fail({
        script: SCRIPT_NAME,
        message: "Invalid arguments",
        exitCode: 11,
        output: flags.output || "text",
        error,
      });
    }

    log.error("Failed to validate ideas:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const modulePath = fileURLToPath(import.meta.url);

if (entryPath === modulePath) {
  main();
}
