#!/usr/bin/env node
/**
 * init-ideas.mjs
 * @since 2025-01-13
 * @version 0.1.0
 * Seeds the /ideas workspace with starter templates so new contributors
 * can validate and ship ideas without manual copying.
 */

import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import {
  Logger,
  parseFlags,
  repoRoot,
  succeed,
  fail,
  atomicWrite,
} from "../_lib/core.mjs";

const SCRIPT_NAME = "init-ideas";
const START_TIME = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: pnpm ideas:init [options]

Seeds the /ideas workspace with reusable templates stored at
/templates/ideas/.

Options:
  --help            Show this message
  --dry-run         Preview actions without writing files (default)
  --yes             Execute writes (disables --dry-run)
  --force           Overwrite existing files in ideas/_templates
  --cwd <path>      Repository path (defaults to current directory)
  --log-level <L>   trace|debug|info|warn|error (default: info)
  --output <fmt>    text|json (default: text)

Examples:
  pnpm ideas:init           # Preview scaffold plan
  pnpm ideas:init --yes     # Write starter templates
  pnpm ideas:init --yes --force
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");
const dryRun = args.dryRun !== false && args.yes !== true;
const force =
  args.force === true ||
  args.force === "true" ||
  args.force === "1" ||
  args.force === 1;

const TEMPLATE_DEFINITIONS = [
  { id: "idea-brief", source: "idea-brief-template.md" },
  { id: "idea-unit", source: "idea-unit-template.md" },
  { id: "idea-composition", source: "idea-composition-template.md" },
];

async function ensureDirectory(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function main() {
  try {
    const root = await repoRoot(args.cwd);
    const workspaceDir = path.join(root, "ideas");
    const templatesRoot = path.join(root, "templates", "ideas");
    const stagingDir = path.join(workspaceDir, "_templates");

    if (!existsSync(templatesRoot)) {
      throw new Error(
        `Expected templates directory missing: ${path.relative(root, templatesRoot)}`,
      );
    }

    await ensureDirectory(workspaceDir);
    await ensureDirectory(stagingDir);

    const plan = [];

    for (const template of TEMPLATE_DEFINITIONS) {
      const sourcePath = path.join(templatesRoot, template.source);
      const destinationPath = path.join(stagingDir, `${template.id}.md`);

      if (!existsSync(sourcePath)) {
        throw new Error(
          `Template source missing: ${path.relative(root, sourcePath)}`,
        );
      }

      const alreadyExists = existsSync(destinationPath);
      const action = alreadyExists ? (force ? "overwrite" : "skip") : "create";

      plan.push({
        id: template.id,
        source: sourcePath,
        destination: destinationPath,
        action,
      });
    }

    logger.info(
      `Prepared plan for ${plan.length} template${plan.length === 1 ? "" : "s"}`,
    );

    if (dryRun) {
      succeed({
        script: SCRIPT_NAME,
        dryRun: true,
        runAt: new Date(START_TIME).toISOString(),
        durationMs: Date.now() - START_TIME,
        plan,
      });
      return;
    }

    const results = [];

    for (const item of plan) {
      if (item.action === "skip") {
        logger.warn(
          `Skipping ${path.basename(item.destination)} (already exists; use --force to overwrite)`,
        );
        results.push({ ...item, status: "skipped" });
        continue;
      }

      const content = await readFile(item.source, "utf-8");
      await atomicWrite(item.destination, content);
      logger.info(
        `${item.action === "overwrite" ? "Updated" : "Created"} ${path.relative(
          workspaceDir,
          item.destination,
        )}`,
      );
      results.push({ ...item, status: item.action });
    }

    succeed({
      script: SCRIPT_NAME,
      dryRun: false,
      runAt: new Date(START_TIME).toISOString(),
      durationMs: Date.now() - START_TIME,
      results,
      destinationDir: path.relative(root, stagingDir),
    });
  } catch (error) {
    fail({
      script: SCRIPT_NAME,
      runAt: new Date(START_TIME).toISOString(),
      durationMs: Date.now() - START_TIME,
      message: error.message,
      error: error.stack,
    });
    process.exit(11);
  }
}

main();
