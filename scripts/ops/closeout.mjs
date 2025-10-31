#!/usr/bin/env node
/**
 * closeout.mjs
 * @since 2025-11-03
 * @version 0.1.0
 * Plan Scripts-First closeout for merged work.
 */

import { z } from "zod";
import { parseFlags, fail, succeed, repoRoot, now } from "../_lib/core.mjs";
import { loadLifecycleConfig } from "../_lib/lifecycle.mjs";

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
    const flags = FLAG_SCHEMA.parse(rawFlags);
    const root = await repoRoot(flags.cwd);
    const config = await loadLifecycleConfig({ cwd: root });

    const plan = {
      id: flags.id,
      steps: {
        branchCleanup: `git switch ${config.branches.allowedPrefixes[0] === "feat" ? "main" : "master"} && git branch -d <branch>`,
        project: {
          from: "In Review",
          to: "Merged",
          note: "TODO: Update GitHub Project item status and mergedAt timestamp.",
        },
        archiveIdea: flags.archive,
        changelog: flags.changelog,
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

    await fail({
      script: "closeout",
      exitCode: 10,
      message:
        "Closeout write path not implemented yet. Execute with --dry-run to inspect plan.",
      error: plan,
      output: flags.output,
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
