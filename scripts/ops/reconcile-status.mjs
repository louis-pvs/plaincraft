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
import { parseFlags, fail, succeed, repoRoot, now } from "../_lib/core.mjs";
import { parseIdeaFile } from "../_lib/ideas.mjs";
import { loadLifecycleConfig } from "../_lib/lifecycle.mjs";

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
    const flags = FLAG_SCHEMA.parse(rawFlags);
    const root = await repoRoot(flags.cwd);
    const config = await loadLifecycleConfig({ cwd: root });

    const ideaPath = await resolveIdeaPath(flags.file, flags.id, root, config);
    const ideaStatus = await readIdeaStatus(ideaPath, flags.id);
    const projectStatus = resolveProjectStatus(flags.status, config);

    const plan = {
      id: flags.id,
      ideaPath,
      status: {
        idea: ideaStatus,
        project: projectStatus,
        action:
          ideaStatus === projectStatus
            ? "noop"
            : `update idea frontmatter to ${projectStatus}`,
      },
      generatedAt: now(),
      note: "TODO: Call GitHub Project API and rewrite idea frontmatter when --yes is provided.",
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

    await fail({
      script: "reconcile-status",
      exitCode: 10,
      message:
        "Reconciliation write path not implemented. Use --dry-run to inspect plan.",
      error: plan,
      output: flags.output,
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
