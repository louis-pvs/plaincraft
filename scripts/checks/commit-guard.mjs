#!/usr/bin/env node
/**
 * commit-guard.mjs
 * @since 2025-11-03
 * @version 0.1.0
 * Enforce lifecycle commit header conventions across a git range.
 */

import { z } from "zod";
import {
  parseFlags,
  resolveLogLevel,
  fail,
  succeed,
  repoRoot,
  now,
  Logger,
} from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";
import { loadLifecycleConfig } from "../_lib/lifecycle.mjs";

const FLAG_SCHEMA = z.object({
  range: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  max: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : undefined))
    .refine((value) => value === undefined || value > 0, {
      message: "--max must be a positive integer",
    }),
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.string().optional(),
  logLevel: z.string().optional(),
  cwd: z.string().optional(),
});

(async () => {
  const rawFlags = parseFlags(process.argv.slice(2));

  if (rawFlags.help) {
    console.log(`
Usage: pnpm commit:guard [--range <ref..ref>]

Options:
  --range <ref..ref>   Git revision range to validate (e.g. origin/main..HEAD)
  --from <ref>         Start revision (paired with --to)
  --to <ref>           End revision (paired with --from)
  --max <n>            Limit to latest n commits (default: 50)
  --dry-run            Included for contract completeness (default)
  --yes                Execute mode (no effect, read-only)
  --output <format>    json|text (default: text)
  --log-level <level>  trace|debug|info|warn|error
  --cwd <path>         Working directory
`);
    process.exit(0);
  }

  const logger = new Logger(resolveLogLevel({ flags: rawFlags }));
  const flags = FLAG_SCHEMA.parse(rawFlags);

  try {
    const root = await repoRoot(flags.cwd);
    const config = await loadLifecycleConfig({ cwd: root });
    const branchPattern = config.branches.pattern;
    const commitRegex = config.commits.regex;

    const { range, source } = await resolveRange(flags, root);
    logger.info("Validating commit headers", {
      range,
      source: source ?? "manual",
      max: flags.max ?? 50,
    });

    const commits = await collectCommits(range, flags.max, root);

    if (commits.length === 0) {
      await succeed({
        script: "commit-guard",
        output: flags.output,
        generatedAt: now(),
        checkedRange: range,
        commits: 0,
        violations: [],
      });
      return;
    }

    const violations = commits
      .map((commit) => validateCommit(commit, commitRegex))
      .filter(Boolean);

    if (violations.length > 0) {
      await fail({
        script: "commit-guard",
        output: flags.output,
        exitCode: 11,
        message: "Commit guard detected invalid headers",
        error: {
          generatedAt: now(),
          range,
          violations,
          pattern: commitRegex.toString(),
          branchPattern,
        },
      });
      return;
    }

    logger.info("Commit headers valid", {
      range,
      commits: commits.length,
    });

    await succeed({
      script: "commit-guard",
      output: flags.output,
      generatedAt: now(),
      checkedRange: range,
      commits: commits.length,
      autoRangeSource: source ?? null,
      violations: [],
    });
  } catch (error) {
    logger.error("Commit guard failed", {
      error: error?.message || String(error),
    });
    await fail({
      script: "commit-guard",
      output: rawFlags.output,
      message: "Commit guard failed",
      error: error?.message || String(error),
    });
  }
})();

async function resolveRange(flags, root) {
  if (flags.range) return { range: flags.range, source: null };
  if (flags.from && flags.to)
    return { range: `${flags.from}..${flags.to}`, source: null };

  try {
    const { stdout: upstreamStdout } = await execCommand(
      "git",
      ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
      { cwd: root },
    );
    const upstream = upstreamStdout.trim();
    if (upstream) {
      const { stdout: mergeBaseStdout } = await execCommand(
        "git",
        ["merge-base", upstream, "HEAD"],
        { cwd: root },
      );
      const mergeBase = mergeBaseStdout.trim();
      if (mergeBase) {
        return { range: `${mergeBase}..HEAD`, source: upstream };
      }
    }
  } catch {
    // ignore and fall through to HEAD fallback
  }

  return { range: "HEAD", source: "fallback" };
}

async function collectCommits(range, max, cwd) {
  try {
    const args = ["log", "--format=%H%x00%s", range];
    const limit = max ?? 50;
    if (limit > 0) {
      args.splice(1, 0, `--max-count=${limit}`);
    }

    const { stdout } = await execCommand("git", args, { cwd });

    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [hash, subject] = line.split("\0");
        return { hash, subject: subject ?? "" };
      });
  } catch (error) {
    if (error?.stderr?.includes("unknown revision")) {
      throw new Error(`Git range '${range}' not found.`);
    }
    throw error;
  }
}

function validateCommit(commit, regex) {
  if (!regex.test(commit.subject)) {
    return {
      hash: commit.hash,
      subject: commit.subject,
    };
  }
  return null;
}
