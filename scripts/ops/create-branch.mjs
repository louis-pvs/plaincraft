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

    await fail({
      script: "create-branch",
      output: flags.output,
      exitCode: 10,
      message:
        "Project status update not yet implemented. Branch created locally.",
      error: {
        branch: branchName,
        base: flags.base,
        nextStep:
          "TODO: Update GitHub Project status to Branched and attach branch metadata.",
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
