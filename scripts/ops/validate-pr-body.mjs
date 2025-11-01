#!/usr/bin/env node
/**
 * validate-pr-body.mjs
 * @since 2025-11-01
 * @version 1.0.0
 * Summary: Validate that PR bodies are properly generated with all required sections.
 */

import { z } from "zod";
import {
  parseFlags,
  Logger,
  fail,
  succeed,
  generateRunId,
} from "../_lib/core.mjs";
import { getPR } from "../_lib/github.mjs";
import { validatePrBody } from "../_lib/pr-body-validator.mjs";

const SCRIPT_NAME = "validate-pr-body";

const ArgsSchema = z.object({
  prNumber: z
    .number()
    .int()
    .positive()
    .or(z.string().regex(/^\d+$/).transform(Number)),
  strict: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  cwd: z.string().optional(),
});

const rawArgs = parseFlags();

if (rawArgs.help) {
  console.log(`
Usage: pnpm ops:validate-pr-body --pr-number <number> [options]

Validates that a PR body contains all expected sections from enhanced generation.

Options:
  --pr-number <number>  PR number to validate (required)
  --strict              Fail if any optional sections are missing
  --output <format>     json|text (default: text)
  --log-level <level>   trace|debug|info|warn|error
  --help                Show this help message

Examples:
  pnpm ops:validate-pr-body --pr-number 143
  pnpm ops:validate-pr-body --pr-number 143 --strict
`);
  process.exit(0);
}

const argsForValidation = {
  prNumber: rawArgs["pr-number"] || rawArgs.prNumber,
  strict: rawArgs.strict === true || rawArgs.strict === "true",
  output: rawArgs.output,
  logLevel: rawArgs.logLevel || rawArgs["log-level"],
  cwd: rawArgs.cwd,
};

const parsed = ArgsSchema.safeParse(argsForValidation);
if (!parsed.success) {
  fail({
    exitCode: 1,
    message: "Validation error",
    error: parsed.error.format(),
    output: argsForValidation.output || "text",
    script: SCRIPT_NAME,
  });
}

const args = parsed.data;
const logger = new Logger(args.logLevel);
const runId = generateRunId();
const start = Date.now();

async function main() {
  logger.info(`Validating PR #${args.prNumber}`);

  const pr = await getPR(args.prNumber, args.cwd);

  if (!pr) {
    fail({
      exitCode: 2,
      message: `PR #${args.prNumber} not found`,
      output: args.output,
      script: SCRIPT_NAME,
    });
  }

  if (!pr.body) {
    fail({
      exitCode: 3,
      message: `PR #${args.prNumber} has no body`,
      output: args.output,
      script: SCRIPT_NAME,
    });
  }

  const validation = validatePrBody(pr.body, args.strict);
  const passed = validation.required.every((r) => r.found);
  const optionalPassed = validation.optional.every((r) => r.found);

  if (args.strict && !optionalPassed) {
    fail({
      exitCode: 4,
      message: "PR body validation failed (strict mode)",
      error: validation,
      output: args.output,
      script: SCRIPT_NAME,
    });
  }

  if (!passed) {
    fail({
      exitCode: 5,
      message: "PR body validation failed - missing required sections",
      error: validation,
      output: args.output,
      script: SCRIPT_NAME,
    });
  }

  logger.info("PR body validation passed");

  succeed({
    output: args.output,
    script: SCRIPT_NAME,
    runId,
    prNumber: args.prNumber,
    prTitle: pr.title,
    validation,
    passed: true,
    durationMs: Date.now() - start,
  });
}

main().catch((error) => {
  fail({
    exitCode: 10,
    message: "Execution error",
    error: error instanceof Error ? error.message : String(error),
    output: args?.output || "text",
    script: SCRIPT_NAME,
  });
});
