#!/usr/bin/env node
/**
 * guardrails.mjs
 * @since 2025-11-01
 * @version 0.3.0
 * Summary: Orchestrate all guardrail commands with structured reporting
 */

import { performance } from "node:perf_hooks";
import { execa } from "execa";
import {
  parseFlags,
  resolveLogLevel,
  Logger,
  repoRoot,
  fail,
  succeed,
} from "../_lib/core.mjs";

const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/guardrails.mjs [options]

Options:
  --help                 Show this help message
  --scope <list>         Comma-separated scopes to run (app,scripts,docs,pr,issues,recordings).
                         Default: all scopes.
  --fail-fast            Stop at first failure (default: false)
  --dry-run              Included for contract completeness (no effect, read-only commands)
  --yes                  Execute mode (no effect, all subcommands read-only)
  --output <format>      Output format: text|json (default: text)
  --log-level <level>    Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>           Working directory (default: current)
  --concurrency <n>      Run up to n guardrails in parallel (default: 3)
  --sequential           Force sequential execution (overrides concurrency)

Description:
  Runs the Plaincraft build/lint/test bundle plus guardrail suites (scripts, docs,
  PR template lint, issue template lint, recording smoke tests) and emits a single
  structured summary for developers and CI.

Exit codes:
  0  - All guardrails passed
  11 - One or more guardrails failed
`);
  process.exit(0);
}

const logger = new Logger(resolveLogLevel({ flags: args }));

const IDEA_ID = "ARCH-unified-guardrails-suite";
const DEFAULT_CONCURRENCY = 3;

const SCOPE_COMMANDS = {
  app: [
    { id: "build", idea: IDEA_ID, cmd: ["pnpm", "run", "build"] },
    { id: "typecheck", idea: IDEA_ID, cmd: ["pnpm", "run", "typecheck"] },
    { id: "lint", idea: IDEA_ID, cmd: ["pnpm", "run", "lint"] },
    { id: "test", idea: IDEA_ID, cmd: ["pnpm", "run", "test"] },
  ],
  scripts: [
    { id: "scripts:lint", idea: IDEA_ID, cmd: ["pnpm", "run", "scripts:lint"] },
    { id: "scripts:test", idea: IDEA_ID, cmd: ["pnpm", "run", "scripts:test"] },
    {
      id: "scripts:smoke",
      idea: IDEA_ID,
      cmd: ["pnpm", "run", "scripts:smoke", "--", "--filter", "checks"],
    },
    { id: "scripts:size", idea: IDEA_ID, cmd: ["pnpm", "run", "scripts:size"] },
    {
      id: "scripts:deprecation",
      idea: IDEA_ID,
      cmd: ["pnpm", "run", "scripts:deprecation"],
    },
    {
      id: "drift:check",
      idea: IDEA_ID,
      cmd: ["pnpm", "run", "drift:check"],
    },
  ],
  docs: [
    { id: "docs:check", idea: IDEA_ID, cmd: ["pnpm", "run", "docs:check"] },
  ],
  pr: [
    { id: "pr:template", idea: IDEA_ID, cmd: ["pnpm", "run", "pr:template"] },
  ],
  issues: [
    { id: "issues:lint", idea: IDEA_ID, cmd: ["pnpm", "run", "issues:lint"] },
  ],
  recordings: [
    // Lightweight smoke – ensures recording command is available without triggering full run
    {
      id: "record:stories --help",
      idea: IDEA_ID,
      cmd: ["pnpm", "run", "record:stories", "--", "--help"],
      optional: true,
    },
  ],
};

const SCOPE_ALIASES = {
  ideas: "issues",
  issue: "issues",
};
const DEFAULT_SCOPE_ORDER = [
  "app",
  "scripts",
  "docs",
  "pr",
  "issues",
  "recordings",
];

(async () => {
  try {
    const root = await repoRoot(args.cwd);
    const scopeArg = args.scope ?? args.group;
    const rawScopes =
      parseScopeList(scopeArg) ||
      DEFAULT_SCOPE_ORDER.filter((scope) => scope in SCOPE_COMMANDS);
    const scopes = dedupe(
      rawScopes.map(resolveScope).filter((scope) => scope in SCOPE_COMMANDS),
    );

    const failFast = Boolean(args["fail-fast"]);
    const sequentialMode = Boolean(args.sequential);
    const requestedConcurrency = args.concurrency ?? args.parallel;
    const resolvedConcurrency = resolveConcurrency(requestedConcurrency);
    const effectiveConcurrency =
      failFast || sequentialMode ? 1 : resolvedConcurrency;

    logger.debug("Guardrails initialised", {
      scopes: scopes.join(", "),
      failFast,
      sequential: sequentialMode,
      concurrency: effectiveConcurrency,
      example: "node scripts/checks/guardrails.mjs --scope app,scripts",
    });

    const taskQueue = buildTaskQueue(scopes);
    const progress = createProgressReporter(taskQueue.length, logger);
    progress.start();

    const results = [];
    let failures = 0;

    try {
      if (effectiveConcurrency === 1) {
        for (const task of taskQueue) {
          const { result, failed } = await runGuardrailTask(task, root);
          results.push(result);
          progress.advance(task, result);

          if (failed && !task.optional) {
            failures++;
            if (failFast) {
              throw new Error(
                `Guardrail ${task.id} failed (fail-fast enabled)`,
              );
            }
          }
        }
      } else {
        const resultsByIndex = new Array(taskQueue.length);
        let cursor = 0;
        const workerCount = Math.min(effectiveConcurrency, taskQueue.length);

        async function worker() {
          while (true) {
            const index = cursor++;
            if (index >= taskQueue.length) break;
            const task = taskQueue[index];
            const { result, failed } = await runGuardrailTask(task, root);
            progress.advance(task, result);
            resultsByIndex[index] = result;
            if (failed && !task.optional) {
              failures++;
            }
          }
        }

        await Promise.all(Array.from({ length: workerCount }, () => worker()));

        for (const entry of resultsByIndex) {
          if (entry) {
            results.push(entry);
          }
        }
      }
    } finally {
      progress.finish();
    }

    const summary = {
      script: "guardrails",
      ok: failures === 0,
      scopes,
      results,
    };

    const skipped = results.filter(
      (entry) => entry.status === "skipped",
    ).length;
    logger.debug("Guardrails summary", {
      ok: failures === 0,
      total: results.length,
      failures,
      skipped,
      example: "Expect failures=0 and ok=true for a clean pipeline run.",
    });

    if (failures === 0) {
      succeed({ ...summary, message: "All guardrails passed" }, args.output);
    } else {
      fail({
        exitCode: 11,
        message: "One or more guardrails failed",
        output: args.output,
        error: summary,
        script: "guardrails",
      });
    }
  } catch (error) {
    fail({
      exitCode: 11,
      script: "guardrails",
      message: error.message,
      output: args.output,
      error: { stack: error.stack },
    });
  }
})();

function parseScopeList(scopeArg) {
  if (!scopeArg) return null;
  return String(scopeArg)
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function resolveScope(scope) {
  return SCOPE_ALIASES[scope] || scope;
}

function dedupe(list) {
  return Array.from(new Set(list));
}

function summarizeOutput(stdout, stderr) {
  const MAX_LINES = 40;
  const lines = [];
  if (stdout) {
    lines.push("stdout:");
    lines.push(...stdout.trim().split("\n"));
  }
  if (stderr) {
    lines.push("stderr:");
    lines.push(...stderr.trim().split("\n"));
  }
  if (lines.length > MAX_LINES) {
    const head = lines.slice(0, MAX_LINES / 2);
    const tail = lines.slice(-MAX_LINES / 2);
    return [...head, "...", ...tail].join("\n");
  }
  return lines.join("\n");
}

function createProgressReporter(totalTasks, logger) {
  let completed = 0;

  return {
    start() {
      if (totalTasks === 0) {
        logger.debug("Progress idle", {
          total: totalTasks,
          example:
            "Re-run guardrails with --verbose to stream per-task progress.",
        });
        return;
      }
      logger.debug("Progress started", {
        total: totalTasks,
        completed,
        bar: renderProgressBar(0, totalTasks),
        example: "Progress bar only prints with --verbose for quieter CI logs.",
      });
    },
    advance(task, result) {
      if (totalTasks === 0) return;
      completed = Math.min(totalTasks, completed + 1);
      logger.debug("Progress step", {
        id: task.id,
        scope: task.scope,
        status: result.status,
        completed,
        total: totalTasks,
        optional: Boolean(task.optional),
        bar: renderProgressBar(completed, totalTasks),
        example: `Next step re-run: ${[task.scope, task.id].join(" -> ")}`,
      });
    },
    finish() {
      if (totalTasks === 0) return;
      const label = completed >= totalTasks ? "complete" : "halted";
      logger.debug("Progress finished", {
        status: label,
        completed,
        total: totalTasks,
        bar: renderProgressBar(completed, totalTasks),
        example: "Expect status 'complete' when all guardrails finish.",
      });
    },
  };
}

function renderProgressBar(completed, total) {
  const safeTotal = Math.max(0, total);
  if (safeTotal === 0) return "[]";
  const safeCompleted = Math.min(Math.max(completed, 0), safeTotal);
  const pending = safeTotal - safeCompleted;
  return `[${"=".repeat(safeCompleted)}${".".repeat(pending)}]`;
}

function resolveConcurrency(value) {
  if (value === undefined || value === null) {
    return DEFAULT_CONCURRENCY;
  }

  const parsed =
    typeof value === "string"
      ? Number.parseInt(value, 10)
      : Number.parseInt(String(value), 10);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return DEFAULT_CONCURRENCY;
}

function buildTaskQueue(scopes) {
  const tasks = [];

  for (const scope of scopes) {
    const commands = SCOPE_COMMANDS[scope];
    if (!commands || commands.length === 0) {
      logger.warn("Skipping unknown scope", {
        scope,
        example: "Use --scope app,scripts,docs,pr,issues,recordings",
      });
      continue;
    }

    logger.debug("Queued guardrail scope", {
      scope,
      commands: commands.length,
      example: `Typical command: pnpm run guardrails:${scope}`,
    });

    for (const command of commands) {
      tasks.push({ scope, ...command });
    }
  }

  return tasks;
}

async function runGuardrailTask(task, root) {
  const { scope, id, cmd, optional, idea } = task;
  const start = performance.now();

  let status = "passed";
  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    const { all, exitCode: cmdExitCode } = await execa(cmd[0], cmd.slice(1), {
      cwd: root,
      all: true,
      reject: false,
    });
    stdout = all || "";
    exitCode = typeof cmdExitCode === "number" ? cmdExitCode : 0;
    status = exitCode === 0 ? "passed" : "failed";
  } catch (error) {
    status = "failed";
    exitCode = error.exitCode ?? 1;
    stdout = error.all || error.stdout || "";
    stderr = error.stderr || "";
  }

  const durationMs = Math.round(performance.now() - start);
  let failed = status === "failed" || exitCode !== 0;

  if (failed && optional) {
    status = "skipped";
    exitCode = 0;
    failed = false;
  }

  const result = {
    scope,
    id,
    idea,
    command: cmd.join(" "),
    status,
    exitCode,
    durationMs,
    output:
      failed || args.output === "json"
        ? summarizeOutput(stdout, stderr)
        : undefined,
  };

  const commandLine = `${cmd[0]} ${cmd.slice(1).flat().join(" ")}`.trim();
  const logPayload = {
    id,
    scope,
    duration: `${durationMs}ms`,
    exitCode,
    optional: Boolean(optional),
    command: commandLine,
  };

  if (status === "skipped") {
    logger.warn("Guardrail skipped (optional)", {
      ...logPayload,
      example: `Optional guardrail: ${commandLine}`,
    });
  } else if (failed) {
    logger.error("Guardrail failed", {
      ...logPayload,
      example: `Re-run with --verbose: ${commandLine}`,
    });
    logger.debug("Guardrail output", {
      id,
      scope,
      output: summarizeOutput(stdout, stderr),
      example: `Inspect logs above and re-run: ${commandLine} -- --verbose`,
    });
  } else {
    logger.debug("Guardrail passed", {
      ...logPayload,
      example: `Typical success: ${commandLine}`,
    });
  }

  return { result, failed };
}
