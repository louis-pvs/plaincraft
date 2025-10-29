#!/usr/bin/env node
/**
 * validate-commit-headers.mjs
 * @since 2025-10-28
 * @version 1.0.0
 * Aggregates commit header validation for CI and automation.
 */

import { readFileSync } from "node:fs";
import { stdin } from "node:process";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, isMain } from "../_lib/core.mjs";
import { validateHeader } from "./commit-msg-hook.mjs";

const SCRIPT_NAME = "validate-commit-headers";

const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  cwd: z.string().optional(),
  commitListFile: z.string().optional(),
  branchId: z.string().optional(),
});

async function readInput(commitListFile) {
  if (commitListFile) {
    return readFileSync(commitListFile, "utf8");
  }

  const chunks = [];
  if (stdin.isTTY) {
    return "";
  }

  stdin.setEncoding("utf8");
  await new Promise((resolve, reject) => {
    stdin.on("data", (chunk) => chunks.push(chunk));
    stdin.on("end", resolve);
    stdin.on("error", reject);
    stdin.resume();
  });

  return chunks.join("");
}

function parseMessages(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function validateCommitHeadersList(messages, branchId = null) {
  const invalid = [];

  for (const header of messages) {
    const result = validateHeader({ header, branchId });

    if (!result.valid) {
      invalid.push({
        header,
        error: result.error,
        details: result.details,
      });
    }
  }

  return { invalid, checked: messages.length };
}

async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  if (flags.help) {
    console.log(`
Usage: ${SCRIPT_NAME} [--commit-list-file path] [--branch-id ARCH-123]

Validates one commit header per line using the commit-msg hook validator.

Examples:
  gh pr view 123 --json commits -q '.commits[].messageHeadline' | node scripts/ops/${SCRIPT_NAME}.mjs
  node scripts/ops/${SCRIPT_NAME}.mjs --commit-list-file commits.txt

Flags:
  --dry-run           Preview mode (default true)
  --yes               Execute mode (sets dry-run=false)
  --output <fmt>      text | json (default text)
  --log-level <lvl>   trace|debug|info|warn|error (default info)
  --cwd <path>        Repository root (defaults to cwd)
`);
    process.exit(0);
  }

  try {
    const parsed = ArgsSchema.parse(flags);
    const args = {
      ...parsed,
      dryRun: parsed.yes ? false : parsed.dryRun,
    };
    const raw = await readInput(args.commitListFile);
    const messages = parseMessages(raw);

    if (messages.length === 0) {
      succeed({
        script: SCRIPT_NAME,
        message: "No commit headers provided",
        exitCode: 0,
        output: args.output,
        data: { checked: 0, invalid: [], dryRun: args.dryRun },
      });
      return;
    }

    const { invalid, checked } = validateCommitHeadersList(
      messages,
      args.branchId ?? null,
    );

    if (invalid.length > 0) {
      const lines = invalid
        .map((entry) => `- ${entry.header}\n  ${entry.error}: ${entry.details}`)
        .join("\n");
      log.error(`${invalid.length} invalid commit header(s):\n${lines}`);

      fail({
        script: SCRIPT_NAME,
        message: "Invalid commit headers",
        exitCode: 1,
        output: args.output,
        data: { checked, invalid, dryRun: args.dryRun },
      });
      return;
    }

    succeed({
      script: SCRIPT_NAME,
      message: "All commit headers valid",
      exitCode: 0,
      output: args.output,
      data: { checked, dryRun: args.dryRun },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      fail({
        script: SCRIPT_NAME,
        message: "Invalid arguments",
        exitCode: 11,
        output: flags.output || "text",
        error,
      });
    }

    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

if (isMain(import.meta)) {
  main();
}
