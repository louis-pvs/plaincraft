#!/usr/bin/env node
/**
 * branch-guard.mjs
 * @since 2025-11-02
 * @version 0.1.0
 * Enforce branch naming convention: type/ID-slug
 *
 * Policy requirement: Branch format must be type/ID-slug
 * Example: feat/ARCH-123-add-guardrails, fix/U-456-button-state
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
  branch: z.string().optional(),
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.string().optional(),
  logLevel: z.string().optional(),
  cwd: z.string().optional(),
  report: z.boolean().default(false),
});

(async () => {
  const rawFlags = parseFlags(process.argv.slice(2));

  if (rawFlags.help) {
    console.log(`
Usage: pnpm branch:guard [--branch <name>]

Options:
  --branch <name>       Branch name to validate (default: current branch)
  --dry-run             Included for contract completeness (default)
  --yes                 Execute mode (no effect, read-only)
  --output <format>     json|text (default: text)
  --log-level <level>   trace|debug|info|warn|error
  --cwd <path>          Working directory
  --report              Emit machine-readable JSON summary

Description:
  Validates branch name follows the policy requirement: type/ID-slug
  
  Valid formats:
  - feat/ARCH-123-add-guardrails
  - fix/U-456-button-state
  - refactor/C-789-cleanup-tests
  
  Policy: Branch format must be type/ID-slug (no spaces, lowercase slug)

Exit codes:
  0  - Branch name valid
  11 - Branch name invalid
`);
    process.exit(0);
  }

  const logger = new Logger(resolveLogLevel({ flags: rawFlags }));
  const flags = FLAG_SCHEMA.parse(rawFlags);
  const reportMode = flags.report;

  try {
    const root = await repoRoot(flags.cwd);
    const config = await loadLifecycleConfig({ cwd: root });
    const branchPattern = config.branches.pattern;

    // Get current branch name
    const branchName = flags.branch || (await getCurrentBranch(root));

    logger.debug("Validating branch name", {
      branch: branchName,
      pattern: branchPattern.toString(),
      example: "feat/ARCH-123-add-guardrails",
    });

    // Skip validation for special branches
    const skipBranches = ["main", "master", "develop", "HEAD"];
    if (skipBranches.includes(branchName)) {
      const payload = {
        script: "branch-guard",
        output: flags.output,
        generatedAt: now(),
        branch: branchName,
        valid: true,
        skipped: true,
        reason: "protected branch",
      };

      if (reportMode) {
        console.log(JSON.stringify({ "branch-guard": payload }, null, 2));
        process.exitCode = 0;
      } else {
        await succeed(payload);
      }
      return;
    }

    // Validate branch name against pattern
    const isValid = branchPattern.test(branchName);

    if (!isValid) {
      const payload = {
        script: "branch-guard",
        generatedAt: now(),
        branch: branchName,
        valid: false,
        pattern: branchPattern.toString(),
        error: "Branch name does not match required pattern: type/ID-slug",
        examples: [
          "feat/ARCH-123-add-guardrails",
          "fix/U-456-button-state",
          "refactor/C-789-cleanup-tests",
        ],
      };

      if (reportMode) {
        console.log(JSON.stringify({ "branch-guard": payload }, null, 2));
        process.exitCode = 11;
      } else {
        await fail({
          script: "branch-guard",
          output: flags.output,
          exitCode: 11,
          message: "Branch name validation failed",
          error: payload,
        });
      }
      return;
    }

    logger.debug("Branch name valid", {
      branch: branchName,
      example: "feat/ARCH-123-add-guardrails",
    });

    const payload = {
      script: "branch-guard",
      output: flags.output,
      generatedAt: now(),
      branch: branchName,
      valid: true,
    };

    if (reportMode) {
      console.log(JSON.stringify({ "branch-guard": payload }, null, 2));
      process.exitCode = 0;
    } else {
      await succeed(payload);
    }
  } catch (error) {
    logger.error("Branch guard failed", {
      error: error?.message || String(error),
      example: "feat/ARCH-123-add-guardrails",
    });

    if (reportMode) {
      console.log(
        JSON.stringify(
          {
            "branch-guard": {
              error: error?.message || String(error),
            },
          },
          null,
          2,
        ),
      );
      process.exitCode = 11;
    } else {
      await fail({
        script: "branch-guard",
        output: rawFlags.output,
        message: "Branch guard failed",
        error: error?.message || String(error),
        example: "Use branch names like 'feat/ARCH-123-add-guardrails'",
      });
    }
  }
})();

async function getCurrentBranch(cwd) {
  try {
    const { stdout } = await execCommand(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      { cwd },
    );
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to get current branch: ${error.message}`);
  }
}
