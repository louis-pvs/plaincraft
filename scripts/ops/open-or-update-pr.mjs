#!/usr/bin/env node
/**
 * open-or-update-pr.mjs
 * @since 2025-11-03
 * @version 0.1.0
 * Prepare lifecycle-compliant pull requests for the Scripts-First workflow.
 */

import { z } from "zod";
import { parseFlags, fail, succeed, repoRoot, now } from "../_lib/core.mjs";
import { getCurrentBranch } from "../_lib/git.mjs";
import { loadLifecycleConfig } from "../_lib/lifecycle.mjs";

const ID_REGEX = /^[A-Z]+-[A-Za-z0-9]+$/;

const FLAG_SCHEMA = z.object({
  id: z
    .string({ required_error: "Missing required --id value (e.g. ARCH-123)." })
    .regex(ID_REGEX, "ID must follow pattern ARCH-123."),
  title: z
    .string()
    .optional()
    .transform((value) => value?.trim()),
  branch: z
    .string()
    .optional()
    .transform((value) => value?.trim()),
  draft: z.boolean().optional().default(true),
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

    const branchName = await resolveBranch(flags.branch, config);
    validateBranchMatchesId(branchName, flags.id, config);

    const prTitle = resolveTitle(flags.title, branchName, flags.id, config);

    const plan = {
      id: flags.id,
      branch: branchName,
      title: prTitle,
      draft: flags.draft,
      projectStatus: {
        from: "Branched",
        to: "PR Open",
        note: "Status transition pending GitHub Project API integration.",
      },
      generatedAt: now(),
    };

    if (flags.dryRun || !flags.yes) {
      await succeed({
        script: "open-or-update-pr",
        dryRun: true,
        plan,
        output: flags.output,
      });
      return;
    }

    await fail({
      script: "open-or-update-pr",
      exitCode: 10,
      message:
        "PR creation/update not yet wired. Re-run with --dry-run to inspect the plan.",
      error: {
        plan,
        nextStep: "TODO: Invoke GitHub CLI/API to create or update the PR.",
      },
      output: flags.output,
    });
  } catch (error) {
    await fail({
      script: "open-or-update-pr",
      message: "open-or-update-pr failed",
      error: error?.message || String(error),
      output: undefined,
    });
  }
})();

async function resolveBranch(explicitBranch, config) {
  if (explicitBranch) {
    validateBranchPattern(explicitBranch, config);
    return explicitBranch;
  }

  const current = await getCurrentBranch();
  if (!current) {
    throw new Error(
      "Unable to detect current branch. Pass --branch to specify the target branch.",
    );
  }

  validateBranchPattern(current, config);
  return current;
}

function validateBranchPattern(branch, config) {
  if (!config.branches.regex.test(branch)) {
    throw new Error(
      `Branch "${branch}" is not lifecycle compliant. Expected pattern ${config.branches.pattern}.`,
    );
  }
}

function validateBranchMatchesId(branch, id, config) {
  validateBranchPattern(branch, config);
  const [, branchId] = branch.split("/");
  if (!branchId || !branchId.startsWith(`${id}-`)) {
    throw new Error(
      `Branch "${branch}" does not match ID ${id}. Expected prefix ${id}-`,
    );
  }
}

function resolveTitle(explicitTitle, branch, id, config) {
  const candidate = explicitTitle || deriveTitleFromBranch(branch, id);

  if (!config.pullRequests.regex.test(candidate)) {
    throw new Error(
      `PR title "${candidate}" does not satisfy ${config.pullRequests.titlePattern}.`,
    );
  }

  return candidate;
}

function deriveTitleFromBranch(branch, id) {
  const [, branchId] = branch.split("/");
  const slug = branchId.replace(`${id}-`, "");
  const words = slug.split("-").map(capitalizeWord);
  return `[${id}] ${words.join(" ")}`;
}

function capitalizeWord(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}
