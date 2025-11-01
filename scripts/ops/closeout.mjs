#!/usr/bin/env node
/**
 * closeout.mjs
 * @since 2025-11-03
 * @version 0.1.0
 * Plan Scripts-First closeout for merged work.
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
  archive: z.boolean().optional().default(true),
  changelog: z.boolean().optional().default(true),
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
Usage: pnpm ops:closeout -- --id <ID> [options]

Options:
  --id <ID>            Idea or project identifier (required)
  --archive            Archive idea file after merge (default: true)
  --changelog          Append changelog entry (default: true)
  --dry-run            Preview closeout steps (default)
  --yes                Execute cleanup (disables --dry-run)
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

    const ideaPath = await resolveIdeaPath(flags.id, root, config);
    const archivePath =
      flags.archive && ideaPath
        ? await deriveArchivePath(ideaPath, root, config)
        : null;
    const changelogPath = path.join(root, "CHANGELOG.md");

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
    const targetStatus = "Merged";

    const plan = {
      id: flags.id,
      idea: {
        path: ideaPath,
        archiveTo: archivePath,
      },
      changelog: flags.changelog ? changelogPath : null,
      projectStatus: {
        from: currentProjectStatus || "Unknown",
        to: targetStatus,
        note:
          projectLookupError ||
          (projectItem
            ? "Project item located."
            : "Project item lookup pending."),
      },
      steps: {
        projectUpdate: `Set project status to ${targetStatus}`,
        archiveIdea:
          flags.archive && ideaPath ? `Move idea to ${archivePath}` : "noop",
        changelog: flags.changelog
          ? `Append closeout entry to CHANGELOG.md`
          : "noop",
      },
      generatedAt: now(),
    };

    if (flags.dryRun || !flags.yes) {
      await succeed({
        script: "closeout",
        dryRun: true,
        plan,
        output: flags.output,
      });
      return;
    }

    const archiveResult = {
      attempted: Boolean(flags.archive && ideaPath),
      path: archivePath,
      updated: false,
      message: null,
    };

    const changelogResult = {
      attempted: Boolean(flags.changelog),
      path: changelogPath,
      updated: false,
      message: null,
    };

    if (flags.archive && ideaPath && archivePath) {
      try {
        await fs.mkdir(path.dirname(archivePath), { recursive: true });
        await fs.rename(ideaPath, archivePath);
        archiveResult.updated = true;
        archiveResult.message = "Idea archived.";
        plan.idea.path = archivePath;
        plan.steps.archiveIdea = `Moved idea to ${archivePath}`;
      } catch (error) {
        archiveResult.message = error?.message || String(error);
      }
    }

    if (flags.changelog) {
      try {
        const changed = await appendChangelogEntry(changelogPath, flags.id);
        changelogResult.updated = changed;
        changelogResult.message = changed
          ? "Changelog entry appended."
          : "Changelog already contained entry.";
      } catch (error) {
        changelogResult.message = error?.message || String(error);
      }
    }

    const projectResult = await ensureProjectStatus({
      id: flags.id,
      status: targetStatus,
      cacheInfo: projectCacheInfo,
      cwd: root,
    });

    plan.projectStatus.note = projectResult.message;
    plan.projectStatus.from = currentProjectStatus || "Unknown";
    plan.projectStatus.to = targetStatus;

    await succeed({
      script: "closeout",
      output: flags.output,
      plan,
      result: {
        project: projectResult,
        changelog: changelogResult,
        archive: archiveResult,
      },
    });
  } catch (error) {
    await fail({
      script: "closeout",
      message: "closeout failed",
      error: error?.message || String(error),
      output: undefined,
    });
  }
})();

async function resolveIdeaPath(id, root, config) {
  const ideasDir = path.join(root, config.ideas.directory);
  const direct = path.join(ideasDir, `${id}.md`);
  try {
    await fs.access(direct);
    return direct;
  } catch {
    try {
      const entries = await fs.readdir(ideasDir);
      const match = entries.find(
        (name) => name.startsWith(`${id}`) && name.endsWith(".md"),
      );
      return match ? path.join(ideasDir, match) : null;
    } catch {
      return null;
    }
  }
}

async function deriveArchivePath(ideaPath, root, config) {
  if (!ideaPath) return null;
  const year = new Date().getUTCFullYear();
  const archiveDir = path.join(
    root,
    config.ideas.directory,
    "_archive",
    String(year),
  );
  return path.join(archiveDir, path.basename(ideaPath));
}

async function appendChangelogEntry(changelogPath, id) {
  let existing = "";
  try {
    existing = await fs.readFile(changelogPath, "utf-8");
  } catch {
    existing = "# Changelog\n\n";
  }

  const date = new Date().toISOString().slice(0, 10);
  const entry = `## [Closeout ${id}] - ${date}\n\n- ${id} merged via closeout automation.\n`;

  if (existing.includes(entry.trim())) {
    return false;
  }

  const sectionIndex = existing.indexOf("\n## ");
  const newContent =
    sectionIndex === -1
      ? `${existing.trimEnd()}\n\n${entry}\n`
      : `${existing.slice(0, sectionIndex)}\n${entry}\n${existing.slice(sectionIndex)}`;

  await atomicWrite(changelogPath, newContent);
  return true;
}
