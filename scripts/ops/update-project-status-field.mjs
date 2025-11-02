#!/usr/bin/env node
/**
 * update-project-status-field.mjs
 * @since 2025-11-02
 * @version 0.1.0
 * Update GitHub Project Status field with lifecycle-compliant options
 */

import { z } from "zod";
import { parseFlags, fail, succeed } from "../_lib/core.mjs";
import { loadProjectCache } from "../_lib/github.mjs";

const FLAG_SCHEMA = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.string().optional(),
  logLevel: z.string().optional(),
  cwd: z.string().optional(),
});

const LIFECYCLE_STATUS_OPTIONS = [
  {
    name: "Ticketed",
    description: "Issue created and ready for branch",
    color: "GRAY",
  },
  {
    name: "Branched",
    description: "Work branch created",
    color: "YELLOW",
  },
  {
    name: "PR Open",
    description: "Pull request opened",
    color: "BLUE",
  },
  {
    name: "In Review",
    description: "Under active review",
    color: "PURPLE",
  },
  {
    name: "Merged",
    description: "PR merged to main",
    color: "GREEN",
  },
  {
    name: "Archived",
    description: "Completed and archived",
    color: "GRAY",
  },
];

(async () => {
  try {
    const rawFlags = parseFlags(process.argv.slice(2));
    if (rawFlags.help) {
      console.log(`
Usage: node scripts/ops/update-project-status-field.mjs [options]

Updates GitHub Project Status field with lifecycle options:
  - Ticketed, Branched, PR Open, In Review, Merged, Archived

Options:
  --dry-run          Show what would be updated (default: true)
  --yes              Skip confirmation and apply changes
  --output <format>  Output format: text|json (default: text)
  --log-level <lvl>  Logging level (default: info)
  --cwd <path>       Working directory

Examples:
  # Preview changes
  node scripts/ops/update-project-status-field.mjs

  # Apply changes
  node scripts/ops/update-project-status-field.mjs --yes --dry-run=false
`);
      process.exit(0);
    }

    const flags = FLAG_SCHEMA.parse(rawFlags);
    const { dryRun, yes } = flags;

    // Load project cache
    const { cache } = await loadProjectCache({ cwd: flags.cwd });
    const project = cache.project;
    const statusField = project.fields?.Status;

    if (!statusField) {
      return fail("Status field not found in project cache");
    }

    console.log(`[INFO] Project: ${project.name} (${project.id})`);
    console.log(`[INFO] Status Field ID: ${statusField.id}`);
    console.log(
      `[INFO] Current options: ${statusField.options?.map((o) => o.name).join(", ") || "none"}`,
    );
    console.log(
      `[INFO] Will add/update to: ${LIFECYCLE_STATUS_OPTIONS.map((o) => o.name).join(", ")}`,
    );

    if (dryRun) {
      console.log("[DRY-RUN] Would update project status field options");
      return succeed(
        "Dry run complete. Use --dry-run=false --yes to apply changes.",
      );
    }

    if (!yes) {
      return fail("Confirmation required. Add --yes flag to proceed.");
    }

    // Update status field options via GraphQL
    // Note: GitHub Projects API doesn't support updating field options directly via GraphQL yet
    // This requires using the web UI or undocumented mutations
    console.log(
      "[WARN] GitHub Projects v2 API does not support programmatic field option updates",
    );
    console.log(
      "[WARN] You must manually update the Status field options via the web UI:",
    );
    console.log("[WARN] 1. Open project: " + project.url + "/settings");
    console.log("[WARN] 2. Edit Status field");
    console.log("[WARN] 3. Remove old options (Todo, In Progress, Done)");
    console.log("[WARN] 4. Add new options:");

    LIFECYCLE_STATUS_OPTIONS.forEach((opt, idx) => {
      console.log(`[WARN]    ${idx + 1}. ${opt.name} - ${opt.description}`);
    });

    console.log(
      "[INFO] After updating, run: node scripts/ops/refresh-project-cache.mjs",
    );

    return succeed("Manual update required. See instructions above.", {
      projectUrl: project.url + "/settings",
      options: LIFECYCLE_STATUS_OPTIONS,
    });
  } catch (error) {
    return fail(error?.message || String(error));
  }
})();
