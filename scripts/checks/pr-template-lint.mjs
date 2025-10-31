#!/usr/bin/env node
/**
 * pr-template-lint.mjs
 * @since 2025-10-31
 * @version 0.1.0
 * Summary: Validate PR template placeholders against pipeline contract
 */

import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  parseFlags,
  Logger,
  repoRoot,
  readJSON,
  fail,
  succeed,
} from "../_lib/core.mjs";

const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/pr-template-lint.mjs [options]

Options:
  --help              Show this help message
  --dry-run           No-op mode (default: true for safety; no writes happen regardless)
  --yes               Execute mode (disables dry-run when script supports writes)
  --cwd <path>        Working directory (default: process.cwd())
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)

Description:
  Validates that .github/pull_request_template.md includes all required
  placeholders defined in .github/pipeline-config.json. Prevents accidental
  template edits that break PR guardrails.

Exit codes:
  0  - Validation passed
  11 - Validation failed
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");

async function loadRequiredPlaceholders(configPath) {
  try {
    const config = await readJSON(configPath);
    const placeholders =
      config?.pull_requests?.templates?.required_placeholders;
    if (Array.isArray(placeholders) && placeholders.length > 0) {
      return placeholders;
    }
  } catch (error) {
    logger.warn(`Unable to read pipeline config: ${error.message}`);
  }
  // Fallback to default expectations if config missing
  return ["Ticket ID", "Lane label", "Closes #"];
}

(async () => {
  try {
    const root = await repoRoot(args.cwd);
    const templatePath = path.join(root, ".github", "pull_request_template.md");
    const configPath = path.join(root, ".github", "pipeline-config.json");

    let template;
    try {
      template = await readFile(templatePath, "utf-8");
    } catch (error) {
      fail({
        exitCode: 11,
        script: "pr-template-lint",
        message: `PR template not found at ${templatePath}`,
        output: args.output,
        error: { stack: error.stack },
      });
      return;
    }

    const requiredPlaceholders = await loadRequiredPlaceholders(configPath);
    const missingPlaceholders = requiredPlaceholders.filter(
      (placeholder) => !template.includes(placeholder),
    );

    const errors = [];
    if (missingPlaceholders.length > 0) {
      errors.push(
        `Missing required placeholders: ${missingPlaceholders.join(", ")}`,
      );
    }

    if (errors.length > 0) {
      fail({
        exitCode: 11,
        script: "pr-template-lint",
        message: "PR template validation failed",
        output: args.output,
        error: { errors, templatePath, requiredPlaceholders },
      });
      return;
    }

    succeed({
      script: "pr-template-lint",
      message: "PR template validation passed",
      output: args.output,
      templatePath,
      requiredPlaceholders,
    });
  } catch (error) {
    fail({
      exitCode: 11,
      script: "pr-template-lint",
      message: error.message,
      output: args.output,
      error: { stack: error.stack },
    });
  }
})();
