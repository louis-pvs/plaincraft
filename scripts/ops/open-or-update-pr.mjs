#!/usr/bin/env node
/**
 * open-or-update-pr.mjs
 * @since 2025-11-03
 * @version 0.1.0
 * Prepare lifecycle-compliant pull requests for the Scripts-First workflow.
 */

import path from "node:path";
import { tmpdir } from "node:os";
import { unlink } from "node:fs/promises";
import { z } from "zod";
import {
  parseFlags,
  fail,
  succeed,
  repoRoot,
  now,
  atomicWrite,
} from "../_lib/core.mjs";
import { getCurrentBranch } from "../_lib/git.mjs";
import { loadLifecycleConfig } from "../_lib/lifecycle.mjs";
import {
  findIdeaFiles,
  loadIdeaFile,
  extractChecklistItems,
} from "../_lib/ideas.mjs";
import {
  getRepoInfo,
  findPullRequestByBranch,
  createPR,
  updatePR,
  syncPullRequestLabels,
  convertPrToDraft,
  markPrReadyForReview,
  getPR,
  loadProjectCache,
  findProjectItemByFieldValue,
  ensureProjectStatus,
} from "../_lib/github.mjs";

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
    if (rawFlags.help) {
      console.log(`
Usage: pnpm ops:open-or-update-pr -- --id <ID> [options]

Options:
  --id <ID>            Idea or project identifier (required)
  --branch <name>      Branch to open or update (defaults to current)
  --title <text>       Explicit PR title override
  --draft              Create as draft (default: true)
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

    const branchName = await resolveBranch(flags.branch, config);
    validateBranchMatchesId(branchName, flags.id, config);

    const prTitle = resolveTitle(flags.title, branchName, flags.id, config);
    const ideaDetails = await loadIdeaDetails(root, config, flags.id);
    const prBody = buildPrBody({
      id: flags.id,
      branch: branchName,
      metadata: ideaDetails?.metadata ?? null,
      status: ideaDetails?.status ?? null,
    });
    const prLabels = ideaDetails?.labels ?? [];

    let existingPr = null;
    let prLookupError = null;
    try {
      existingPr = await findPullRequestByBranch(branchName, root);
    } catch (error) {
      prLookupError = error?.message || String(error);
    }

    let projectCacheInfo = null;
    let projectItem = null;
    let projectLookupError = null;
    try {
      projectCacheInfo = await loadProjectCache({ cwd: root });
      const statusField = projectCacheInfo.cache.project?.fields?.Status;
      const idField = projectCacheInfo.cache.project?.fields?.ID;
      if (statusField?.id && idField?.id) {
        projectItem = await findProjectItemByFieldValue({
          projectId: projectCacheInfo.cache.project.id,
          fieldId: idField.id,
          value: flags.id,
          cwd: root,
        });
      }
    } catch (error) {
      projectLookupError = error?.message || String(error);
    }

    const statusFieldId =
      projectCacheInfo?.cache?.project?.fields?.Status?.id || null;
    const currentProjectStatus =
      statusFieldId && projectItem?.fields
        ? projectItem.fields.get(statusFieldId)?.value || null
        : null;
    const projectStatusNote = projectLookupError
      ? projectLookupError
      : projectItem
        ? "Project item fetched from cache."
        : "Project item lookup pending.";

    const plan = {
      id: flags.id,
      branch: branchName,
      title: prTitle,
      draft: flags.draft,
      labels: prLabels,
      idea: ideaDetails
        ? {
            path: ideaDetails.path,
            status: ideaDetails.status,
            issue: ideaDetails.issue,
          }
        : null,
      pr: {
        exists: Boolean(existingPr),
        number: existingPr?.number ?? null,
        url: existingPr?.url ?? null,
        action: existingPr ? "update" : "create",
        lookupError: prLookupError,
      },
      projectStatus: {
        from: currentProjectStatus || ideaDetails?.status || "Branched",
        to: "PR Open",
        note: projectStatusNote,
      },
      prBodyPreview: buildBodyPreview(prBody),
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

    const bodyFile = path.join(
      tmpdir(),
      `plaincraft-pr-body-${Date.now()}-${Math.random().toString(16).slice(2)}.md`,
    );

    try {
      await atomicWrite(bodyFile, prBody);

      const { owner, name: repo } = await getRepoInfo(root);

      let prDetails = existingPr;
      if (!prDetails) {
        prDetails = await findPullRequestByBranch(branchName, root);
      }

      let prResult;
      if (prDetails) {
        const currentPr = await getPR(prDetails.number, root);
        const updates = {};
        if (currentPr.title !== prTitle) {
          updates.title = prTitle;
        }
        if (currentPr.body !== prBody) {
          updates.bodyFile = bodyFile;
        }
        if (Object.keys(updates).length > 0) {
          await updatePR(prDetails.number, updates, root);
        }

        await syncPullRequestLabels(prDetails.number, prLabels, root, {
          mode: "merge",
        });

        if (flags.draft && prDetails.isDraft === false) {
          await convertPrToDraft({
            owner,
            repo,
            pullNumber: prDetails.number,
            cwd: root,
          });
        }

        if (!flags.draft && prDetails.isDraft === true) {
          await markPrReadyForReview({
            owner,
            repo,
            pullNumber: prDetails.number,
            cwd: root,
          });
        }

        const refreshed = await getPR(prDetails.number, root);
        prResult = {
          number: prDetails.number,
          url: refreshed?.url || prDetails.url || null,
          action: Object.keys(updates).length > 0 ? "updated" : "unchanged",
          draft: flags.draft,
        };
      } else {
        const creation = await createPR(
          {
            title: prTitle,
            bodyFile,
            base: "main",
            draft: flags.draft,
            head: branchName,
          },
          root,
        );

        const prNumberFromUrl = extractPrNumber(creation.url);
        let createdNumber = prNumberFromUrl;
        let createdDetails = null;
        if (!createdNumber) {
          const lookup = await findPullRequestByBranch(branchName, root);
          if (!lookup) {
            throw new Error(
              "PR created but unable to determine PR number from branch lookup.",
            );
          }
          createdNumber = lookup.number;
          createdDetails = await getPR(createdNumber, root);
        } else {
          createdDetails = await getPR(createdNumber, root);
        }

        await syncPullRequestLabels(createdNumber, prLabels, root, {
          mode: "merge",
        });

        prResult = {
          number: createdNumber,
          url: createdDetails?.url || creation.url,
          action: "created",
          draft: flags.draft,
        };
      }

      const projectResult = await ensureProjectStatus({
        cwd: root,
        cacheInfo: projectCacheInfo,
        id: flags.id,
        status: plan.projectStatus.to,
      });

      plan.projectStatus.note = projectResult.message;
      plan.pr = {
        ...plan.pr,
        exists: true,
        number: prResult.number,
        url: prResult.url,
        action: prResult.action,
        lookupError: null,
      };

      await succeed({
        script: "open-or-update-pr",
        output: flags.output,
        plan,
        result: {
          pr: prResult,
          project: projectResult,
          labels: prLabels,
        },
      });
    } finally {
      // Best-effort cleanup of the temp file; ignore errors.
      try {
        await unlink(bodyFile);
      } catch {
        // noop
      }
    }
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

async function loadIdeaDetails(root, config, id) {
  const ideasDir = path.join(root, config.ideas.directory);
  const directPath = path.join(ideasDir, `${id}.md`);

  try {
    const direct = await loadIdeaFile(directPath);
    return {
      path: directPath,
      metadata: direct.metadata,
      content: direct.content,
      status: parseIdeaStatus(direct.content),
      labels: extractIdeaLabels(direct.metadata),
      issue: direct.metadata.issueNumber ?? null,
    };
  } catch {
    // Fall back to search below.
  }

  try {
    const candidates = await findIdeaFiles(ideasDir, id);
    for (const candidate of candidates) {
      const resolved = path.join(ideasDir, candidate);
      try {
        const idea = await loadIdeaFile(resolved);
        return {
          path: resolved,
          metadata: idea.metadata,
          content: idea.content,
          status: parseIdeaStatus(idea.content),
          labels: extractIdeaLabels(idea.metadata),
          issue: idea.metadata.issueNumber ?? null,
        };
      } catch {
        // Continue trying additional candidates
      }
    }
  } catch {
    // Ignore lookup failures and return null below
  }

  return null;
}

function parseIdeaStatus(content) {
  if (!content) return null;
  const statusMatch = content.match(/^Status:\s*([^\n]+)$/m);
  return statusMatch ? statusMatch[1].trim() : null;
}

function extractIdeaLabels(metadata) {
  if (!metadata) return [];
  const laneSection =
    metadata.sectionsNormalized?.lane?.content || metadata.sections?.Lane || "";

  const labelMatch = laneSection.match(/Labels?:\s*([^\n]+)/i);
  if (!labelMatch) return [];

  return labelMatch[1]
    .replace(/\*\*/g, "")
    .replace(/^[-*]\s*/, "")
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
}

function buildPrBody({ id, branch, metadata, status }) {
  const lines = [];
  const issueNumber = metadata?.issueNumber;

  if (issueNumber) {
    lines.push(`Closes #${issueNumber}`, "");
  } else {
    lines.push(`Linked ticket: ${id}`, "");
  }

  if (metadata?.purpose) {
    lines.push("## Purpose", "", metadata.purpose.trim(), "");
  }

  if (metadata?.problem) {
    lines.push("## Problem", "", metadata.problem.trim(), "");
  }

  if (metadata?.proposal) {
    lines.push("## Proposal", "", metadata.proposal.trim(), "");
  }

  const checklistItems = extractChecklistItems(metadata) || [];
  if (checklistItems.length > 0) {
    lines.push("## Acceptance Checklist", "");
    for (const item of checklistItems) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push("");
  }

  lines.push("---", "");
  if (metadata?.title) {
    lines.push(`**Idea**: ${metadata.title}`);
  }
  if (metadata?.filename) {
    lines.push(`**Source**: \`/ideas/${metadata.filename}\``);
  }
  lines.push(`**Branch**: \`${branch}\``);
  lines.push(`**Status**: ${status || "Unknown"}`);

  return lines.join("\n").trimEnd();
}

function buildBodyPreview(body, maxLines = 12, maxChars = 1200) {
  if (!body) return "";
  const truncated = body.split("\n").slice(0, maxLines).join("\n");
  return truncated.length > maxChars
    ? `${truncated.slice(0, maxChars)}…`
    : truncated;
}

function extractPrNumber(url) {
  if (!url) return null;
  const match = url.match(/\/(\d+)(?:$|\?)/);
  return match ? parseInt(match[1], 10) : null;
}
