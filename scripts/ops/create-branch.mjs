#!/usr/bin/env node
/**
 * create-branch.mjs
 * @since 2025-11-03
 * @version 0.1.0
 * Create lifecycle-compliant branches for Scripts-First workflow.
 */

import { z } from "zod";
import { parseFlags, fail, succeed, repoRoot, now } from "../_lib/core.mjs";
import { execCommand, branchExists, getCurrentBranch } from "../_lib/git.mjs";
import { loadLifecycleConfig } from "../_lib/lifecycle.mjs";
import { verifyGhTokenScopes, ensureProjectStatus } from "../_lib/github.mjs";

const ID_REGEX = /^[A-Z]+-[A-Za-z0-9]+$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FLAG_SCHEMA = z.object({
  id: z
    .string({ required_error: "Missing required --id value (e.g. ARCH-123)." })
    .regex(ID_REGEX, "ID must follow pattern ARCH-123."),
  prefix: z
    .string()
    .optional()
    .transform((value) => value?.toLowerCase()),
  slug: z
    .string({ required_error: "Missing required --slug argument." })
    .regex(
      SLUG_REGEX,
      "Slug must be lowercase with hyphens (e.g. branch-workflow-refresh).",
    ),
  base: z
    .string()
    .optional()
    .transform((value) => value?.trim())
    .default("main"),
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.string().optional(),
  logLevel: z.string().optional(),
  cwd: z.string().optional(),
});

(async () => {
  try {
    const rawFlags = parseFlags(process.argv.slice(2));
    if (rawFlags.help) {
      console.log(`
Usage: pnpm ops:create-branch -- --id <ID> --slug <slug> [options]

Options:
  --id <ID>            Idea or project identifier (required)
  --slug <slug>        Lowercase hyphenated slug (required)
  --prefix <type>      Branch type prefix (default: feat)
  --base <branch>      Base branch (default: main)
  --dry-run            Preview actions without writes (default)
  --yes                Execute writes (disables --dry-run)
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

    const prefix = resolvePrefix(flags.prefix, config);
    const branchName = `${prefix}/${flags.id}-${flags.slug}`;
    validateBranchName(branchName, config);

    const current = await safeCurrentBranch();

    const plan = {
      branch: branchName,
      base: flags.base,
      currentBranch: current,
      projectStatus: {
        from: "Ticketed",
        to: "Branched",
        note: "Status transition to be performed once Project integration is wired.",
      },
      generatedAt: now(),
    };

    if (flags.dryRun || !flags.yes) {
      await succeed({
        script: "create-branch",
        dryRun: true,
        plan,
        output: flags.output,
      });
      return;
    }

    await ensureBranchDoesNotExist(branchName, root);

    await execCommand("git", ["fetch", "--prune"], { cwd: root });
    await execCommand("git", ["switch", flags.base], { cwd: root });
    await execCommand("git", ["pull", "--ff-only"], { cwd: root });
    await execCommand("git", ["switch", "-c", branchName], { cwd: root });

    // Update project status
    const scopeCheck = await verifyGhTokenScopes(
      ["read:project", "project"],
      root,
    );
    let projectStatus = {
      updated: false,
      message: "Skipped - token scopes not verified",
    };

    if (scopeCheck.valid) {
      projectStatus = await ensureProjectStatus({
        id: flags.id,
        status: "Branched",
        cwd: root,
      });

      if (projectStatus.updated) {
        console.log(
          `[INFO] Project status updated: ${projectStatus.previous || "none"} → Branched`,
        );
      } else {
        console.log(
          `[WARN] Project status not updated: ${projectStatus.message}`,
        );
      }
    } else {
      console.log(`[WARN] ${scopeCheck.message}`);
    }

    await succeed({
      script: "create-branch",
      output: flags.output,
      message: `Branch created: ${branchName}`,
      data: {
        branch: branchName,
        base: flags.base,
        created: now(),
        projectStatus: {
          updated: projectStatus.updated,
          message: projectStatus.message,
        },
      },
    });
  } catch (error) {
    await fail({
      script: "create-branch",
      message: "Create branch failed",
      error: error?.message || String(error),
      output: undefined,
    });
  }
})();

function resolvePrefix(explicitPrefix, config) {
  const candidate = explicitPrefix || "feat";
  if (!config.branches.prefixSet.has(candidate)) {
    throw new Error(
      `Branch prefix "${candidate}" not allowed. Must be one of ${[
        ...config.branches.prefixSet,
      ].join(", ")}`,
    );
  }
  return candidate;
}

function validateBranchName(branchName, config) {
  if (!config.branches.regex.test(branchName)) {
    throw new Error(
      `Branch "${branchName}" does not match lifecycle pattern ${config.branches.pattern}`,
    );
  }
}

async function ensureBranchDoesNotExist(branchName, cwd) {
  const exists = await branchExists(branchName, cwd);
  if (exists) {
    throw new Error(`Branch "${branchName}" already exists.`);
  }
}

async function safeCurrentBranch() {
  try {
    return await getCurrentBranch();
  } catch {
    return null;
  }
}
