#!/usr/bin/env node
/**
 * archive-expired-guides.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Archive guides that have exceeded their TTL
 */

import { readFile, readdir, rename, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  parseFlags,
  fail,
  succeed,
  Logger,
  repoRoot,
  generateRunId,
} from "../_lib/core.mjs";

const start = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/archive-expired-guides.mjs [options]

Options:
  --help              Show this help
  --yes, -y           Execute archival (default: dry-run)
  --dry-run           Preview which guides would be archived (default: true)
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current)

Description:
  Archives guides where (last_verified + ttl_days) has passed.
  Moves files to guides/_archive/YYYY/ directory.

Exit codes:
  0  - Success (guides archived or none expired)
  2  - Noop (no expired guides)
  11 - Validation/archival failed
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");
const runId = generateRunId();

logger.info("Checking for expired guides");

try {
  const root = await repoRoot(args.cwd || process.cwd());
  const guidesDir = path.join(root, "guides");

  // Find all guide files
  const files = await readdir(guidesDir);
  const guideFiles = files.filter(
    (f) => f.endsWith(".md") && f.startsWith("guide-"),
  );

  const expired = [];
  const now = new Date();

  for (const file of guideFiles) {
    const filePath = path.join(guidesDir, file);
    const content = await readFile(filePath, "utf-8");

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;

    const frontmatter = parseFrontmatter(frontmatterMatch[1]);

    if (frontmatter.last_verified && frontmatter.ttl_days) {
      const lastVerified = new Date(frontmatter.last_verified);
      const ttlDays = parseInt(frontmatter.ttl_days);
      const expiryDate = new Date(lastVerified);
      expiryDate.setDate(expiryDate.getDate() + ttlDays);

      if (expiryDate < now) {
        const daysExpired = Math.floor(
          (now - expiryDate) / (1000 * 60 * 60 * 24),
        );
        expired.push({
          file,
          lastVerified: frontmatter.last_verified,
          ttlDays,
          expiryDate: expiryDate.toISOString().split("T")[0],
          daysExpired,
        });
      }
    }
  }

  if (expired.length === 0) {
    succeed(
      {
        runId,
        script: "archive-expired-guides",
        status: "noop",
        message: "No expired guides found",
        totalGuides: guideFiles.length,
        durationMs: Date.now() - start,
      },
      args.output || "text",
    );
    process.exit(2);
  }

  logger.info(`Found ${expired.length} expired guide(s)`);

  const plan = expired.map((item) => ({
    file: item.file,
    from: `guides/${item.file}`,
    to: `guides/_archive/${now.getFullYear()}/${item.file}`,
    daysExpired: item.daysExpired,
  }));

  // Dry run
  if (args.dryRun || !args.yes) {
    succeed(
      {
        runId,
        script: "archive-expired-guides",
        dryRun: true,
        expiredCount: expired.length,
        plan,
        durationMs: Date.now() - start,
      },
      args.output || "text",
    );
    process.exit(2);
  }

  // Execute archival
  const year = now.getFullYear();
  const archiveDir = path.join(guidesDir, "_archive", String(year));
  await mkdir(archiveDir, { recursive: true });

  const archived = [];

  for (const item of expired) {
    const sourcePath = path.join(guidesDir, item.file);
    const targetPath = path.join(archiveDir, item.file);

    try {
      await rename(sourcePath, targetPath);
      archived.push(item.file);
      logger.info(`Archived ${item.file}`);
    } catch (error) {
      logger.error(`Failed to archive ${item.file}:`, error.message);
    }
  }

  succeed(
    {
      runId,
      script: "archive-expired-guides",
      archived: archived.length,
      failed: expired.length - archived.length,
      files: archived,
      durationMs: Date.now() - start,
    },
    args.output || "text",
  );
} catch (error) {
  logger.error("Archive check failed:", error.message);
  fail(11, "archive_error", error.message, args.output || "text");
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
