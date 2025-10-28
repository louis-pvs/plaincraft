#!/usr/bin/env node
/**
 * new-template.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Interactive wizard to create compliant templates with all required files
 */

import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import readline from "node:readline";
import {
  parseFlags,
  fail,
  succeed,
  Logger,
  repoRoot,
  generateRunId,
  atomicWrite,
} from "../_lib/core.mjs";
import { generateTemplateFiles } from "../_lib/templates.mjs";

const start = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/ops/new-template.mjs [options]

Options:
  --help              Show this help message
  --dry-run           Preview changes without writing (default: true)
  --yes               Execute writes (overrides --dry-run)
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current directory)
  --id <id>           Template ID (skips interactive prompt)
  --category <cat>    Template category (skips prompt)

Description:
  Creates a new template directory with all required files:
  - README.md, USAGE.md, template.config.json, entrypoint file

Categories:
  workflow, documentation, tooling, planning, testing

Exit codes:
  0  - Success
  2  - Noop (template already exists)
  10 - Precondition failed
  11 - Validation failed

Examples:
  node scripts/ops/new-template.mjs --yes --id feature-request --category workflow
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");
const runId = generateRunId();
const dryRun = args.dryRun !== false && args.yes !== true;

logger.info(`Starting new-template wizard (runId: ${runId})`);

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function preflight(root) {
  const templatesDir = path.join(root, "templates");
  if (!existsSync(templatesDir)) {
    throw new Error("templates/ directory not found");
  }
}

async function executePlan(files) {
  const results = [];
  for (const file of files) {
    const dir = path.dirname(file.path);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await atomicWrite(file.path, file.content);
    results.push({ path: file.path, status: "created" });
  }
  return results;
}

try {
  const root = await repoRoot(args.cwd);
  await preflight(root);

  // Get template ID
  let templateId = args.id;
  if (!templateId && !dryRun) {
    templateId = await prompt(
      "Template ID (kebab-case, e.g., feature-request): ",
    );
  }
  if (!templateId) {
    templateId = "example-template";
  }

  // Validate ID format
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(templateId)) {
    throw new Error(
      "Template ID must be lowercase kebab-case (e.g., feature-request)",
    );
  }

  const templateDir = path.join(root, "templates", templateId);
  if (existsSync(templateDir)) {
    throw new Error(`Template directory already exists: ${templateDir}`);
  }

  // Get category
  let category = args.category;
  const validCategories = [
    "workflow",
    "documentation",
    "tooling",
    "planning",
    "testing",
  ];

  if (!category && !dryRun) {
    category = await prompt(`Category (${validCategories.join(", ")}): `);
  }
  if (!category) {
    category = "workflow";
  }

  if (!validCategories.includes(category)) {
    throw new Error(
      `Invalid category. Must be one of: ${validCategories.join(", ")}`,
    );
  }

  // Generate files
  const files = generateTemplateFiles(templateDir, templateId, category);
  logger.info(`Plan: ${files.length} files to create`);

  // Dry run
  if (dryRun) {
    succeed({
      runId,
      script: "new-template",
      version: "0.1.0",
      dryRun: true,
      templateId,
      category,
      files: files.map((f) => f.path),
      durationMs: Date.now() - start,
    });
    process.exit(0);
  }

  // Execute
  const results = await executePlan(files);

  succeed({
    runId,
    script: "new-template",
    version: "0.1.0",
    templateId,
    category,
    results,
    durationMs: Date.now() - start,
  });
} catch (error) {
  fail({
    runId,
    script: "new-template",
    error: error.message,
    durationMs: Date.now() - start,
  });
  process.exit(error.message.includes("already exists") ? 2 : 11);
}
