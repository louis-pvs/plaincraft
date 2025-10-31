#!/usr/bin/env node
/**
 * report.mjs
 * @since 2025-10-31
 * @version 0.1.0
 * Summarise Plaincraft Roadmap governance metadata for backlog pilots.
 *
 * The script reads `.repo/projects.json`, verifies the lifecycle v3 schema,
 * and emits a concise audit report. It defaults to dry-run mode so automation
 * can preview the plan before calling `--yes` to generate artefacts.
 */

import path from "node:path";
import {
  parseFlags,
  succeed,
  fail,
  Logger,
  repoRoot,
  readJSON,
  now,
} from "../_lib/core.mjs";

const SCRIPT_NAME = "ops-report";
const REQUIRED_FIELDS = [
  "ID",
  "Type",
  "Lane",
  "Status",
  "Owner",
  "Priority",
  "Release",
];
const REQUIRED_STATUSES = [
  "Draft",
  "Ticketed",
  "Branched",
  "PR Open",
  "In Review",
  "Merged",
  "Archived",
];
const REQUIRED_LANES = ["A", "B", "C", "D"];

const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: pnpm ops:report [options]

Generate a Scripts-First lifecycle governance report based on the cached
Plaincraft Roadmap metadata stored in .repo/projects.json.

Options:
  --help            Show this message
  --dry-run         Preview actions without producing output (default)
  --yes             Execute the audit and emit a report
  --output <fmt>    Output format: text (default) or json
  --log-level <L>   Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>      Repository path (defaults to current directory)
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");
const dryRun = args.dryRun !== false && args.yes !== true;

(async () => {
  try {
    const root = await repoRoot(args.cwd);
    const cachePath = path.join(root, ".repo", "projects.json");
    const payload = {
      script: SCRIPT_NAME,
      generatedAt: now(),
      cachePath: path.relative(root, cachePath),
    };

    if (dryRun) {
      await succeed({
        ...payload,
        dryRun: true,
        message:
          "Dry run: would verify .repo/projects.json and emit lifecycle v3 report. Re-run with --yes to execute.",
        output: args.output,
      });
      return;
    }

    logger.info(`Reading project cache: ${payload.cachePath}`);
    const cache = await readJSON(cachePath);

    if (!cache?.project) {
      throw new Error(
        "Project cache missing `project` key. Run `pnpm ops:report --dry-run` after updating cache.",
      );
    }

    const { project } = cache;
    const fieldNames = Object.keys(project.fields ?? {});
    const missingFields = REQUIRED_FIELDS.filter(
      (name) => !fieldNames.includes(name),
    );

    const statusOptions = project.fields?.Status?.options ?? [];
    const statusNames = statusOptions.map((option) => option.name);
    const missingStatuses = REQUIRED_STATUSES.filter(
      (status) => !statusNames.includes(status),
    );

    const laneOptions = project.fields?.Lane?.options ?? [];
    const laneNames = laneOptions.map((option) => option.name);
    const missingLanes = REQUIRED_LANES.filter(
      (lane) => !laneNames.includes(lane),
    );

    const warnings = [];
    if (missingFields.length) {
      warnings.push(`Missing fields: ${missingFields.join(", ")}`);
    }
    if (missingStatuses.length) {
      warnings.push(`Missing status options: ${missingStatuses.join(", ")}`);
    }
    if (missingLanes.length) {
      warnings.push(`Missing lane options: ${missingLanes.join(", ")}`);
    }

    const report = {
      ...payload,
      dryRun: false,
      project: {
        id: project.id,
        number: project.number,
        name: project.name,
        url: project.url,
        fieldCount: fieldNames.length,
      },
      lifecycle: {
        statuses: statusNames,
        lanes: laneNames,
        priorities:
          project.fields?.Priority?.options?.map((option) => option.name) ?? [],
      },
      automation: {
        workflows: project.automation?.workflows ?? [],
        scripts: project.automation?.scripts ?? [],
      },
      warnings,
      output: args.output,
    };

    await succeed(report);
  } catch (error) {
    await fail({
      script: SCRIPT_NAME,
      output: args.output,
      message: "Failed to generate lifecycle governance report",
      error: error?.message || String(error),
    });
  }
})();
