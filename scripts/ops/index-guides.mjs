#!/usr/bin/env node
/**
 * index-guides.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Generate guides index from frontmatter and detect orphans
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  parseFlags,
  fail,
  succeed,
  Logger,
  repoRoot,
  generateRunId,
  atomicWrite,
} from "../_lib/core.mjs";

const start = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/ops/index-guides.mjs [options]

Options:
  --help              Show this help
  --yes, -y           Write index file (default: dry-run)
  --dry-run           Preview index without writing (default: true)
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current)

Description:
  Generates guides/INDEX.json from frontmatter metadata.
  Detects orphaned guides (missing scaffold_ref or artifact_id).

Exit codes:
  0  - Success
  2  - Noop (dry-run)
  11 - Index generation failed
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");
const runId = generateRunId();

logger.info("Generating guides index");

try {
  const root = await repoRoot(args.cwd || process.cwd());
  const guidesDir = path.join(root, "guides");

  // Find all guide files
  const files = await readdir(guidesDir);
  const guideFiles = files.filter(
    (f) => f.endsWith(".md") && f.startsWith("guide-"),
  );

  logger.info(`Indexing ${guideFiles.length} guides`);

  const index = {
    generated: new Date().toISOString(),
    totalGuides: guideFiles.length,
    guides: [],
    orphans: [],
    warnings: [],
  };

  for (const file of guideFiles) {
    const filePath = path.join(guidesDir, file);
    const content = await readFile(filePath, "utf-8");

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      index.warnings.push(`${file}: Missing frontmatter`);
      continue;
    }

    const frontmatter = parseFrontmatter(frontmatterMatch[1]);

    // Extract first heading as title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : null;

    const guideEntry = {
      file,
      id: frontmatter.id,
      title,
      owner: frontmatter.owner,
      lane: frontmatter.lane,
      artifact_id: frontmatter.artifact_id,
      scaffold_ref: frontmatter.scaffold_ref,
      version: frontmatter.version,
      created: frontmatter.created,
      last_verified: frontmatter.last_verified,
      ttl_days: frontmatter.ttl_days,
    };

    // Check for orphans
    if (!frontmatter.scaffold_ref) {
      index.orphans.push({
        file,
        reason: "Missing scaffold_ref",
      });
    }

    if (!frontmatter.artifact_id) {
      index.orphans.push({
        file,
        reason: "Missing artifact_id",
      });
    }

    // Check expiry
    if (frontmatter.last_verified && frontmatter.ttl_days) {
      const lastVerified = new Date(frontmatter.last_verified);
      const ttlDays = parseInt(frontmatter.ttl_days);
      const expiryDate = new Date(lastVerified);
      expiryDate.setDate(expiryDate.getDate() + ttlDays);

      guideEntry.expires = expiryDate.toISOString().split("T")[0];
      guideEntry.expired = expiryDate < new Date();
    }

    index.guides.push(guideEntry);
  }

  // Group by lane
  index.byLane = {
    A: index.guides.filter((g) => g.lane === "A"),
    B: index.guides.filter((g) => g.lane === "B"),
    C: index.guides.filter((g) => g.lane === "C"),
    D: index.guides.filter((g) => g.lane === "D"),
  };

  // Group by owner
  const byOwner = {};
  for (const guide of index.guides) {
    if (guide.owner) {
      if (!byOwner[guide.owner]) byOwner[guide.owner] = [];
      byOwner[guide.owner].push(guide.id);
    }
  }
  index.byOwner = byOwner;

  // Check for expired guides
  const expired = index.guides.filter((g) => g.expired);
  if (expired.length > 0) {
    index.warnings.push(
      `${expired.length} guide(s) expired - should be archived`,
    );
  }

  const indexContent = JSON.stringify(index, null, 2) + "\n";

  if (args.dryRun || !args.yes) {
    succeed(
      {
        runId,
        script: "index-guides",
        dryRun: true,
        totalGuides: index.totalGuides,
        orphans: index.orphans.length,
        expired: expired.length,
        preview: index,
        durationMs: Date.now() - start,
      },
      args.output || "text",
    );
    process.exit(2);
  }

  // Write index
  const indexPath = path.join(guidesDir, "INDEX.json");
  await atomicWrite(indexPath, indexContent);

  logger.info(`Wrote index to ${indexPath}`);

  succeed(
    {
      runId,
      script: "index-guides",
      totalGuides: index.totalGuides,
      orphans: index.orphans.length,
      expired: expired.length,
      indexPath: "guides/INDEX.json",
      durationMs: Date.now() - start,
    },
    args.output || "text",
  );
} catch (error) {
  logger.error("Index generation failed:", error.message);
  fail(11, "index_error", error.message, args.output || "text");
}

/**
 * Parse YAML-like frontmatter
 */
function parseFrontmatter(text) {
  const result = {};
  const lines = text.split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  }

  return result;
}
