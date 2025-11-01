#!/usr/bin/env node
/**
 * lifecycle-smoke.mjs
 * @since 2025-11-03
 * @version 0.1.0
 * Verify Scripts-First lifecycle guardrails that exist today.
 */

import path from "node:path";
import fs from "node:fs/promises";
import {
  parseFlags,
  resolveLogLevel,
  succeed,
  fail,
  Logger,
  repoRoot,
  now,
} from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";

const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/lifecycle-smoke.mjs [options]

Options:
  --help                Show this help
  --dry-run             Preview which lifecycle checks will run (default)
  --yes                 Execute the lifecycle smoke checks
  --execute             Run write-mode checks against a sandbox repository
  --sandbox <path>      Absolute path to sandbox repo (defaults to LIFECYCLE_SANDBOX_REPO)
  --output <format>     Output format: json|text (default: text)
  --log-level <level>   Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>          Working directory (default: current)

Description:
  Runs a focused set of lifecycle guardrails that are ready today:
    1. Validate Lane C guardrail orchestration idea metadata.
    2. Validate Lane D governance idea metadata.
    3. Execute the guardrails baseline script in dry-run mode.

  The command defaults to --dry-run so CI jobs can opt in via --yes.
`);
  process.exit(0);
}

const executeMode = Boolean(args.execute);
const yesMode = args.yes === true || executeMode;
const dryRun = args.dryRun !== false && !yesMode;
const logger = new Logger(resolveLogLevel({ flags: args }));
const sandboxFlag = args.sandbox || args.sandboxRepo;
const sandboxEnv = process.env.LIFECYCLE_SANDBOX_REPO;

async function resolveSandboxRoot(defaultRoot) {
  if (!executeMode) return defaultRoot;

  const candidate = sandboxFlag || sandboxEnv;
  if (!candidate) {
    throw new Error(
      "--execute requires --sandbox <path> or LIFECYCLE_SANDBOX_REPO environment variable.",
    );
  }

  const fullPath = path.resolve(candidate);
  try {
    const stats = await fs.stat(fullPath);
    if (!stats.isDirectory()) {
      throw new Error(`Sandbox path ${fullPath} is not a directory.`);
    }
  } catch (error) {
    throw new Error(
      `Unable to access sandbox repository at ${fullPath}: ${error.message || error}`,
    );
  }

  return fullPath;
}

const CHECKS = [
  {
    id: "validate-guardrails-suite",
    lane: "C",
    description: "Validate ARCH-unified-guardrails-suite idea metadata",
    command: [
      "pnpm",
      ["ideas:validate", "--filter", "ARCH-unified-guardrails-suite"],
    ],
  },
  {
    id: "validate-project-governance",
    lane: "D",
    description: "Validate ARCH-scripts-first-project-governance idea metadata",
    command: [
      "pnpm",
      ["ideas:validate", "--filter", "ARCH-scripts-first-project-governance"],
    ],
  },
  {
    id: "guardrails-baseline-dry",
    lane: "C",
    description: "Dry-run guardrails baseline reporting",
    command: ["pnpm", ["run", "guardrails:baseline", "--", "--output", "json"]],
  },
  {
    id: "ops-create-branch-smoke",
    lane: "C",
    description: "Dry-run create-branch for lifecycle smoke",
    command: [
      "pnpm",
      [
        "ops:create-branch",
        "--",
        "--id",
        "ARCH-123",
        "--slug",
        "lifecycle-smoke",
      ],
    ],
    executeCommand: [
      "pnpm",
      [
        "ops:create-branch",
        "--",
        "--id",
        "ARCH-123",
        "--slug",
        "lifecycle-smoke",
        "--yes",
      ],
    ],
  },
  {
    id: "ops-open-pr-smoke",
    lane: "C",
    description: "Dry-run open-or-update-pr for lifecycle smoke",
    command: [
      "pnpm",
      [
        "ops:open-or-update-pr",
        "--",
        "--id",
        "ARCH-123",
        "--branch",
        "feat/ARCH-123-lifecycle-smoke",
      ],
    ],
    executeCommand: [
      "pnpm",
      [
        "ops:open-or-update-pr",
        "--",
        "--id",
        "ARCH-123",
        "--branch",
        "feat/ARCH-123-lifecycle-smoke",
        "--yes",
      ],
    ],
  },
  {
    id: "ops-reconcile-smoke",
    lane: "C",
    description: "Dry-run reconcile-status for lifecycle smoke",
    command: [
      "pnpm",
      [
        "ops:reconcile-status",
        "--",
        "--id",
        "ARCH-ideas",
        "--file",
        "ideas/ARCH-ideas-folder-pipeline.md",
      ],
    ],
    executeCommand: [
      "pnpm",
      [
        "ops:reconcile-status",
        "--",
        "--id",
        "ARCH-ideas",
        "--file",
        "ideas/ARCH-ideas-folder-pipeline.md",
        "--yes",
      ],
    ],
  },
  {
    id: "ops-closeout-smoke",
    lane: "C",
    description: "Dry-run closeout plan",
    command: ["pnpm", ["ops:closeout", "--", "--id", "ARCH-123"]],
    executeCommand: [
      "pnpm",
      ["ops:closeout", "--", "--id", "ARCH-123", "--yes", "--archive", "false"],
    ],
  },
  {
    id: "ops-report-smoke",
    lane: "C",
    description: "Dry-run lifecycle report",
    command: ["pnpm", ["ops:report"]],
    executeCommand: ["pnpm", ["ops:report", "--", "--yes"]],
  },
];

(async () => {
  try {
    const root = await repoRoot(args.cwd);
    const runRoot = await resolveSandboxRoot(root);
    if (executeMode) {
      logger.info("Lifecycle smoke execute mode", {
        sandbox: runRoot,
        checks: CHECKS.length,
      });
    }

    if (dryRun) {
      logger.info("Lifecycle smoke dry-run plan generated", {
        checks: CHECKS.length,
        example:
          "Run with --yes to execute checks like pnpm ideas:validate --filter ARCH-unified-guardrails-suite.",
      });
      await succeed({
        script: "lifecycle-smoke",
        output: args.output,
        dryRun: true,
        generatedAt: now(),
        plan: CHECKS.map(
          ({ id, lane, description, command, executeCommand }) => {
            const targetCommand =
              executeMode && executeCommand ? executeCommand : command;
            const targetRoot = executeMode
              ? sandboxFlag || sandboxEnv || "<sandbox>"
              : root;

            return {
              id,
              lane,
              description,
              command: [
                "cd",
                targetRoot,
                "&&",
                targetCommand[0],
                ...targetCommand[1],
              ],
            };
          },
        ),
      });
      return;
    }

    const results = [];
    let passed = 0;
    let failed = 0;
    const startedAt = Date.now();

    for (const check of CHECKS) {
      const start = Date.now();
      const selectedCommand =
        executeMode && check.executeCommand
          ? check.executeCommand
          : check.command;

      logger.info("Running lifecycle check", {
        id: check.id,
        description: check.description,
        lane: check.lane,
        example: `${selectedCommand[0]} ${selectedCommand[1].join(" ")}`,
        mode: executeMode ? "execute" : "dry",
      });

      try {
        const { exitCode } = await execCommand(
          selectedCommand[0],
          selectedCommand[1],
          {
            cwd: runRoot,
            stdio: "inherit",
          },
        );

        results.push({
          id: check.id,
          lane: check.lane,
          description: check.description,
          status: "passed",
          exitCode,
          durationMs: Date.now() - start,
          sandbox: executeMode ? runRoot : root,
        });
        passed++;
      } catch (error) {
        const exitCode =
          typeof error?.exitCode === "number"
            ? error.exitCode
            : typeof error?.code === "number"
              ? error.code
              : null;

        results.push({
          id: check.id,
          lane: check.lane,
          description: check.description,
          status: "failed",
          exitCode,
          durationMs: Date.now() - start,
          error:
            error?.stderr ||
            error?.shortMessage ||
            error?.message ||
            String(error),
          sandbox: executeMode ? runRoot : root,
        });
        failed++;
      }
    }

    if (failed > 0) {
      logger.error("Lifecycle smoke failed", {
        passed,
        failed,
        durationMs: Date.now() - startedAt,
        example: "Re-run the failing check with --verbose for details.",
      });
      await fail({
        script: "lifecycle-smoke",
        exitCode: 11,
        output: args.output,
        message: "Lifecycle smoke checks failed",
        error: {
          generatedAt: now(),
          passed,
          failed,
          durationMs: Date.now() - startedAt,
          results,
          sandbox: executeMode ? runRoot : root,
        },
      });
      return;
    }

    logger.info("Lifecycle smoke passed", {
      passed,
      durationMs: Date.now() - startedAt,
      example: "Expected output: passed equals number of checks and failed=0.",
    });

    await succeed({
      script: "lifecycle-smoke",
      output: args.output,
      generatedAt: now(),
      passed,
      failed,
      durationMs: Date.now() - startedAt,
      results,
      sandbox: executeMode ? runRoot : root,
    });
  } catch (error) {
    logger.error("Lifecycle smoke errored", {
      error: error?.message || String(error),
      example:
        "Ensure pnpm guardrail scripts are installed before running lifecycle smoke.",
    });
    await fail({
      script: "lifecycle-smoke",
      exitCode: 10,
      output: args.output,
      message: "Lifecycle smoke errored before completing checks",
      error: error?.message || String(error),
    });
  }
})();
