#!/usr/bin/env node
/**
 * guardrails.mjs
 * @since 2025-11-01
 * @version 0.1.0
 * Summary: Orchestrate all guardrail commands with structured reporting
 */

import { performance } from "node:perf_hooks";
import { execa } from "execa";
import { parseFlags, Logger, repoRoot, fail, succeed } from "../_lib/core.mjs";

const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/guardrails.mjs [options]

Options:
  --help                 Show this help message
  --scope <list>         Comma-separated scopes to run (scripts,docs,pr,issues,recordings).
                         Default: all scopes.
  --fail-fast            Stop at first failure (default: false)
  --output <format>      Output format: text|json (default: text)
  --log-level <level>    Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>           Working directory (default: current)

Description:
  Runs the Plaincraft guardrail suite (scripts lint/tests, docs checks,
  PR template lint, issue template lint, recording smoke tests) and emits a
  single structured summary for developers and CI.

Exit codes:
  0  - All guardrails passed
  11 - One or more guardrails failed
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");

const IDEA_ID = "ARCH-unified-guardrails-suite";

const SCOPE_COMMANDS = {
  scripts: [
    { id: "scripts:lint", idea: IDEA_ID, cmd: ["pnpm", "run", "scripts:lint"] },
    { id: "scripts:test", idea: IDEA_ID, cmd: ["pnpm", "run", "scripts:test"] },
    {
      id: "scripts:smoke",
      idea: IDEA_ID,
      cmd: ["pnpm", "run", "scripts:smoke"],
    },
    { id: "scripts:size", idea: IDEA_ID, cmd: ["pnpm", "run", "scripts:size"] },
    {
      id: "scripts:deprecation",
      idea: IDEA_ID,
      cmd: ["pnpm", "run", "scripts:deprecation"],
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

const DEFAULT_SCOPE_ORDER = ["scripts", "docs", "pr", "issues", "recordings"];
const SCOPE_ALIASES = {
  ideas: "issues",
  issue: "issues",
};

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
    const results = [];
    let failures = 0;

    for (const scope of scopes) {
      const commands = SCOPE_COMMANDS[scope];
      if (!commands || commands.length === 0) {
        logger.warn(`Unknown or empty scope "${scope}" - skipping.`);
        continue;
      }

      logger.info(`Running guardrail scope: ${scope}`);

      for (const { id, cmd, optional, idea } of commands) {
        const start = performance.now();
        const commandLabel = cmd.join(" ");
        logger.info(`→ ${id}`);

        let status = "passed";
        let stdout = "";
        let stderr = "";
        let exitCode = 0;

        try {
          const { all, exitCode: cmdExitCode } = await execa(
            cmd[0],
            cmd.slice(1),
            {
              cwd: root,
              all: true,
              reject: false,
            },
          );
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

        if ((status === "failed" || exitCode !== 0) && optional) {
          status = "skipped";
          exitCode = 0;
        }

        const failed = status === "failed" || exitCode !== 0;

        if (failed && !optional) {
          failures++;
          if (failFast) {
            results.push({
              scope,
              id,
              idea,
              command: commandLabel,
              status,
              exitCode,
              durationMs,
              output: summarizeOutput(stdout, stderr),
            });
            throw new Error(`Guardrail ${id} failed (fail-fast enabled)`);
          }
        }

        results.push({
          scope,
          id,
          idea,
          command: commandLabel,
          status,
          exitCode,
          durationMs,
          output:
            failed || args.output === "json"
              ? summarizeOutput(stdout, stderr)
              : undefined,
        });
      }
    }

    const summary = {
      script: "guardrails",
      ok: failures === 0,
      scopes,
      results,
    };

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
