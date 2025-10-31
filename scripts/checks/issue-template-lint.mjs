#!/usr/bin/env node
/**
 * issue-template-lint.mjs
 * @since 2025-10-31
 * @version 0.1.0
 * Summary: Validate GitHub issue templates against lifecycle guardrails
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
Usage: node scripts/checks/issue-template-lint.mjs [options]

Options:
  --help              Show this help message
  --dry-run           No-op mode (default: true; this script is read-only)
  --yes               Execute mode (included for contract completeness)
  --cwd <path>        Working directory (default: process.cwd())
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)

Description:
  Validates .github/ISSUE_TEMPLATE tickets to ensure they contain the required
  labels, title prefixes, and project field prompts declared in
  .github/pipeline-config.json. This keeps lane governance aligned with the
  Scripts-First lifecycle.

Exit codes:
  0  - Validation passed
  11 - Validation failed
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");

function includesAll(content, list, formatter) {
  const missing = [];
  for (const item of list) {
    const needle = formatter(item);
    if (!content.includes(needle)) {
      missing.push(item);
    }
  }
  return missing;
}

(async () => {
  try {
    const root = await repoRoot(args.cwd);
    const configPath = path.join(root, ".github", "pipeline-config.json");

    let pipeline;
    try {
      pipeline = await readJSON(configPath);
    } catch (error) {
      fail({
        exitCode: 11,
        script: "issue-template-lint",
        message: `Unable to read pipeline config at ${configPath}`,
        output: args.output,
        error: { stack: error.stack },
      });
      return;
    }

    const tickets = pipeline?.tickets || {};
    const results = [];
    let errors = 0;

    for (const [ticketType, ticketConfig] of Object.entries(tickets)) {
      const templateRelative = ticketConfig.template;
      const templatePath = path.join(root, templateRelative);

      let content;
      try {
        content = await readFile(templatePath, "utf-8");
      } catch (error) {
        errors++;
        results.push({
          ticketType,
          template: templateRelative,
          errors: [`Template not found: ${templateRelative}`],
          warnings: [],
        });
        logger.warn(
          `Template missing for ${ticketType} tickets: ${templateRelative}`,
          error,
        );
        continue;
      }

      const ticketErrors = [];
      const ticketWarnings = [];

      if (ticketConfig.prefix) {
        const expectedPrefix = ticketConfig.prefix;
        if (!content.includes(`title: "${expectedPrefix}`)) {
          ticketErrors.push(`Title prefix must start with "${expectedPrefix}"`);
        }
      }

      const requiredLabels = ticketConfig.labels || [];
      const missingLabels = includesAll(
        content,
        requiredLabels,
        (label) => `- ${label}`,
      );
      if (missingLabels.length > 0) {
        ticketErrors.push(
          `Missing required labels: ${missingLabels.join(", ")}`,
        );
      }

      const requiredFields = Object.values(ticketConfig.project_fields || {});
      const missingFields = includesAll(
        content,
        requiredFields,
        (field) => `id: ${field}`,
      );
      if (missingFields.length > 0) {
        ticketErrors.push(
          `Missing required project field prompts (id): ${missingFields.join(", ")}`,
        );
      }

      if (
        ticketConfig.project_fields?.Lane &&
        !content.includes("label: Lane")
      ) {
        ticketWarnings.push(
          "Expected Lane dropdown prompt (label: Lane) not found",
        );
      }

      if (ticketErrors.length > 0) {
        errors++;
      }

      results.push({
        ticketType,
        template: templateRelative,
        errors: ticketErrors,
        warnings: ticketWarnings,
      });
    }

    if (errors > 0) {
      fail({
        exitCode: 11,
        script: "issue-template-lint",
        message: "Issue template validation failed",
        output: args.output,
        error: { results },
      });
      return;
    }

    succeed({
      script: "issue-template-lint",
      message: "Issue template validation passed",
      output: args.output,
      results,
    });
  } catch (error) {
    fail({
      exitCode: 11,
      script: "issue-template-lint",
      message: error.message,
      output: args.output,
      error: { stack: error.stack },
    });
  }
})();
