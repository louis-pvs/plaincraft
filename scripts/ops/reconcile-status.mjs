#!/usr/bin/env node
/**
 * reconcile-status.mjs
 * @since 2025-11-03
 * @version 0.1.0
 * Compare idea metadata with project status and emit lifecycle plan.
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
import { parseIdeaFile } from "../_lib/ideas.mjs";
import { loadLifecycleConfig } from "../_lib/lifecycle.mjs";
import {
  loadProjectCache,
  findProjectItemByFieldValue,
  ensureProjectStatus,
} from "../_lib/github.mjs";

const FLAG_SCHEMA = z.object({
  id: z
    .string({ required_error: "Missing required --id value (e.g. ARCH-123)." })
    .min(1),
  file: z
    .string()
    .optional()
    .transform((value) => value?.trim()),
  status: z
    .string()
    .optional()
    .transform((value) => value?.trim()),
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
Usage: pnpm ops:reconcile-status -- --id <ID> [options]

Options:
  --id <ID>            Idea or project identifier (required)
  --file <path>        Idea markdown path (defaults to ideas/<ID>.md)
  --status <value>     Project status override (default: Ticketed)
  --dry-run            Preview reconciliation plan (default)
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

    const ideaPath = await resolveIdeaPath(flags.file, flags.id, root, config);
    const ideaStatus = await readIdeaStatus(ideaPath, flags.id);
    const targetStatus = resolveProjectStatus(flags.status, config);

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

    const plan = {
      id: flags.id,
      ideaPath,
      status: {
        idea: ideaStatus,
        project: currentProjectStatus || "Unknown",
        target: targetStatus,
        ideaAction:
          ideaStatus === targetStatus
            ? "noop"
            : `update idea status to ${targetStatus}`,
        projectAction:
          currentProjectStatus === targetStatus
            ? "noop"
            : `set project status to ${targetStatus}`,
      },
      notes: {
        project:
          projectLookupError ||
          (projectItem
            ? "Project item located."
            : "Project item lookup pending."),
      },
      generatedAt: now(),
    };

    if (flags.dryRun || !flags.yes) {
      await succeed({
        script: "reconcile-status",
        dryRun: true,
        plan,
        output: flags.output,
      });
      return;
    }

    const originalContent = await fs.readFile(ideaPath, "utf-8");
    const updatedContent = applyStatusLine(originalContent, targetStatus);
    const ideaChanged = updatedContent !== originalContent;

    if (ideaChanged) {
      await atomicWrite(ideaPath, updatedContent);
    }

    const projectResult = await ensureProjectStatus({
      id: flags.id,
      status: targetStatus,
      cacheInfo: projectCacheInfo,
      cwd: root,
    });

    plan.status.idea = targetStatus;
    plan.status.project = projectResult.updated
      ? targetStatus
      : currentProjectStatus || targetStatus;
    plan.status.ideaAction = ideaChanged
      ? `updated idea status to ${targetStatus}`
      : "noop";
    plan.status.projectAction = projectResult.updated
      ? `updated project status to ${targetStatus}`
      : plan.status.projectAction;
    plan.notes.project = projectResult.message;

    await succeed({
      script: "reconcile-status",
      output: flags.output,
      plan,
      result: {
        idea: {
          updated: ideaChanged,
          path: ideaPath,
        },
        project: projectResult,
      },
    });
  } catch (error) {
    await fail({
      script: "reconcile-status",
      message: "reconcile-status failed",
      error: error?.message || String(error),
      output: undefined,
    });
  }
})();

async function resolveIdeaPath(fileFlag, id, root, config) {
  if (!fileFlag) {
    const slug = `${id}`;
    const candidate = path.join(root, config.ideas.directory, `${slug}.md`);
    return candidate;
  }

  const candidate = path.isAbsolute(fileFlag)
    ? fileFlag
    : path.join(root, fileFlag);

  if (!candidate.startsWith(root)) {
    throw new Error(
      `Idea file must reside within repository. Received ${candidate}`,
    );
  }

  return candidate;
}

async function readIdeaStatus(ideaPath, id) {
  try {
    const contents = await fs.readFile(ideaPath, "utf-8");
    const idea = parseIdeaFile(contents, { filename: path.basename(ideaPath) });
    const statusSection =
      idea.sections?.Status || idea.sectionsNormalized?.status?.content;
    if (!statusSection) return "Unknown";
    const statusMatch = statusSection.match(/`([^`]+)`/);
    if (statusMatch) return statusMatch[1];
    return statusSection.split("\n")[0]?.trim() || "Unknown";
  } catch (error) {
    throw new Error(`Unable to read idea file for ${id}: ${error.message}`);
  }
}

function resolveProjectStatus(statusFlag, config) {
  const candidate = statusFlag || "Ticketed";
  if (!config.project.statusSet.has(candidate)) {
    throw new Error(
      `Status "${candidate}" not allowed. Expected one of ${[...config.project.statusSet].join(", ")}.`,
    );
  }
  return candidate;
}

function applyStatusLine(content, status) {
  const statusLine = `Status: ${status}`;
  const statusRegex = /^Status:\s*.*$/m;
  if (statusRegex.test(content)) {
    return content.replace(statusRegex, statusLine);
  }

  const lines = content.split("\n");
  const laneIndex = lines.findIndex((line) => /^Lane:/i.test(line.trim()));
  if (laneIndex !== -1) {
    lines.splice(laneIndex + 1, 0, statusLine);
    return lines.join("\n");
  }

  const titleIndex = lines.findIndex((line) => /^#\s+/.test(line));
  if (titleIndex !== -1) {
    lines.splice(titleIndex + 1, 0, statusLine);
    return lines.join("\n");
  }

  return `${statusLine}\n\n${content}`;
}
