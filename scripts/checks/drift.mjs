#!/usr/bin/env node
/**
 * drift.mjs
 * @since 2025-11-03
 * @version 0.1.0
 * Detect idea ↔ lifecycle drift using repository metadata.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { parseFlags, fail, succeed, repoRoot, now } from "../_lib/core.mjs";
import { loadLifecycleConfig } from "../_lib/lifecycle.mjs";

const FLAG_SCHEMA = z.object({
  paths: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
        : [],
    ),
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.string().optional(),
  logLevel: z.string().optional(),
  cwd: z.string().optional(),
});

(async () => {
  const rawFlags = parseFlags(process.argv.slice(2));

  if (rawFlags.help) {
    console.log(`
Usage: pnpm drift:check [--paths ideas/ARCH-foo.md]

Options:
  --paths <list>       Comma-separated idea file paths to inspect (defaults to all)
  --dry-run            Included for contract completeness (default)
  --yes                Execute mode (no effect, read-only)
  --output <format>    json|text (default: text)
  --log-level <level>  trace|debug|info|warn|error
  --cwd <path>         Working directory
`);
    process.exit(0);
  }

  try {
    const flags = FLAG_SCHEMA.parse(rawFlags);
    const root = await repoRoot(flags.cwd);
    const config = await loadLifecycleConfig({ cwd: root });

    const ideaPaths = await resolveIdeaPaths(flags.paths, root, config);

    const statusMap = buildCanonicalMap(config.project.statuses);
    const laneSet = config.project.laneSet;

    const violations = [];
    const warnings = [];

    for (const ideaPath of ideaPaths) {
      const content = await fs.readFile(ideaPath, "utf-8");
      const status = extractStatus(content);
      const lane = extractLane(content);

      if (!status) {
        warnings.push({
          file: path.relative(root, ideaPath),
          issue: "Missing Status line",
        });
      } else if (!statusMap.has(canonicalize(status))) {
        violations.push({
          file: path.relative(root, ideaPath),
          issue: `Unrecognized status '${status}'. Expected one of ${config.project.statuses.join(", ")}.`,
        });
      }

      if (!lane) {
        violations.push({
          file: path.relative(root, ideaPath),
          issue: "Missing Lane metadata (expected 'Lane: <A-D>').",
        });
      } else if (!laneSet.has(lane.toUpperCase())) {
        violations.push({
          file: path.relative(root, ideaPath),
          issue: `Lane '${lane}' not allowed. Expected one of ${[...laneSet].join(", ")}.`,
        });
      }
    }

    if (violations.length > 0) {
      await fail({
        script: "drift",
        output: flags.output,
        exitCode: 11,
        message: "Idea lifecycle drift detected",
        error: {
          generatedAt: now(),
          violations,
          warnings,
        },
      });
      return;
    }

    await succeed({
      script: "drift",
      output: flags.output,
      generatedAt: now(),
      scanned: ideaPaths.length,
      status: "passed",
      warnings,
    });
  } catch (error) {
    await fail({
      script: "drift",
      output: rawFlags.output,
      message: "Drift check failed",
      error: error?.message || String(error),
    });
  }
})();

async function resolveIdeaPaths(paths, root, config) {
  if (paths.length > 0) {
    return paths.map((candidate) =>
      path.isAbsolute(candidate) ? candidate : path.join(root, candidate),
    );
  }

  const ideasDir = path.join(root, config.ideas.directory);
  return await collectMarkdownFiles(ideasDir);
}

async function collectMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

function buildCanonicalMap(values) {
  const map = new Map();
  for (const value of values) {
    map.set(canonicalize(value), value);
  }
  return map;
}

function canonicalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractStatus(content) {
  const match = content.match(/^Status:\s*(.+)$/im);
  return match ? match[1].trim() : null;
}

function extractLane(content) {
  const match = content.match(/^Lane:\s*([A-D])/im);
  return match ? match[1].toUpperCase() : null;
}
