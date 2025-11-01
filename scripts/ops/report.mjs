#!/usr/bin/env node
/**
 * report.mjs
 * @since 2025-11-03
 * @version 0.1.0
 * Emit lifecycle configuration snapshot for dashboards.
 */

import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";
import {
  parseFlags,
  fail,
  succeed,
  repoRoot,
  now,
  atomicWrite,
} from "../_lib/core.mjs";
import { loadLifecycleConfig } from "../_lib/lifecycle.mjs";

const FLAG_SCHEMA = z.object({
  output: z.string().optional(),
  logLevel: z.string().optional(),
  cwd: z.string().optional(),
  format: z.enum(["json", "text"]).optional().default("json"),
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
});

(async () => {
  try {
    const rawFlags = parseFlags(process.argv.slice(2));
    if (rawFlags.help) {
      console.log(`
Usage: pnpm ops:report [options]

Options:
  --dry-run            Preview payload (default)
  --yes                Execute publishing (not yet implemented)
  --format <json|text> Output format (default: json)
  --output <format>    json|text (default: text)
  --log-level <level>  trace|debug|info|warn|error
  --cwd <path>         Working directory
  --help               Show this help message
`);
      process.exit(0);
    }
    const flags = FLAG_SCHEMA.parse(rawFlags);
    const root = await repoRoot(flags.cwd);
    const config = await loadLifecycleConfig({ cwd: root });

    const payload = {
      generatedAt: now(),
      projectId: config.project.id,
      statuses: config.project.statuses,
      types: config.project.types,
      lanes: config.project.lanes,
      priorities: config.project.priorities,
      branchPrefixes: config.branches.allowedPrefixes,
    };

    const reportDir = path.join(root, "artifacts", "lifecycle");
    const reportPath = path.join(reportDir, "status.json");
    const summaryPath = process.env.GITHUB_STEP_SUMMARY || null;
    const plan = {
      script: "report",
      payload,
      outputPath: reportPath,
      summaryPath,
    };

    if (flags.dryRun || !flags.yes) {
      await succeed({
        script: "report",
        dryRun: true,
        plan,
        output: flags.output,
      });
      return;
    }

    await fs.mkdir(reportDir, { recursive: true });
    await atomicWrite(reportPath, `${JSON.stringify(payload, null, 2)}\n`);

    let summaryWritten = false;
    if (summaryPath) {
      const summaryLines = [
        `## Lifecycle Report (${payload.generatedAt})`,
        "",
        `- Project ID: ${payload.projectId}`,
        `- Statuses: ${payload.statuses.join(", ")}`,
        `- Lanes: ${payload.lanes.join(", ")}`,
        `- Types: ${payload.types.join(", ")}`,
        `- Priorities: ${payload.priorities.join(", ")}`,
      ];
      try {
        await fs.appendFile(summaryPath, `${summaryLines.join("\n")}\n\n`);
        summaryWritten = true;
      } catch (error) {
        plan.summaryError = error?.message || String(error);
      }
    }

    await succeed({
      script: "report",
      output: flags.output,
      plan,
      result: {
        reportPath,
        summaryWritten,
      },
    });
  } catch (error) {
    await fail({
      script: "report",
      message: "report failed",
      error: error?.message || String(error),
      output: undefined,
    });
  }
})();
