#!/usr/bin/env node

/**
 * Ideas to Issues Converter
 *
 * Reads idea files from /ideas and creates corresponding GitHub Issues
 * with proper labels, lane assignment, and acceptance checklists.
 *
 * Usage:
 *   node scripts/ideas-to-issues.mjs                    # Process all idea files
 *   node scripts/ideas-to-issues.mjs U-bridge-intro.md  # Process specific file
 *   node scripts/ideas-to-issues.mjs --dry-run          # Preview without creating
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const IDEAS_DIR = "ideas";

/**
 * Parse idea file and extract metadata
 */
async function parseIdeaFile(filePath) {
  const content = await readFile(filePath, "utf-8");

  const metadata = {
    title: "",
    type: "", // unit, composition, bug
    lane: "",
    acceptance: [],
    body: content,
    labels: [],
  };

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1];
  }

  // Detect type from filename
  const filename = filePath.split("/").pop();
  if (filename.startsWith("U-")) {
    metadata.type = "unit";
    metadata.labels.push("type:unit");
  } else if (filename.startsWith("C-")) {
    metadata.type = "composition";
    metadata.labels.push("type:composition");
  } else if (filename.startsWith("B-")) {
    metadata.type = "bug";
    metadata.labels.push("type:bug");
  }

  // Extract lane (supports both "Lane:" and "**Lane**:" formats)
  const laneMatch = content.match(/\*?\*?Lane\*?\*?:\s*([A-D])/i);
  if (laneMatch) {
    metadata.lane = laneMatch[1].toUpperCase();
    metadata.labels.push(`lane:${metadata.lane}`);
  }

  // Extract acceptance checklist
  const checklistRegex = /## Acceptance Checklist\s*([\s\S]*?)(?=\n##|\n$)/;
  const checklistMatch = content.match(checklistRegex);
  if (checklistMatch) {
    const items = checklistMatch[1]
      .split("\n")
      .filter((line) => line.trim().startsWith("- [ ]"))
      .map((line) => line.trim());
    metadata.acceptance = items;
  }

  return metadata;
}

/**
 * Create GitHub issue from idea metadata
 */
async function createIssue(metadata, dryRun = false) {
  const { title, labels, body } = metadata;

  if (dryRun) {
    console.log("\n[DRY RUN] Would create issue:");
    console.log(`  Title: ${title}`);
    console.log(`  Labels: ${labels.join(", ")}`);
    console.log(`  Checklist items: ${metadata.acceptance.length}`);
    return null;
  }

  try {
    // Create issue with gh CLI
    const labelsArg = labels.length > 0 ? `--label "${labels.join(",")}"` : "";
    const bodyFile = `/tmp/issue-body-${Date.now()}.md`;

    // Write body to temp file
    await writeFile(bodyFile, body);

    const cmd = `gh issue create --title "${title}" ${labelsArg} --body-file "${bodyFile}"`;
    const { stdout } = await execAsync(cmd);

    // Extract issue number from URL
    const issueUrl = stdout.trim();
    const issueNumber = issueUrl.split("/").pop();

    console.log(`✅ Created issue #${issueNumber}: ${title}`);
    return issueNumber;
  } catch (error) {
    console.error(`❌ Failed to create issue: ${title}`);
    console.error(`   Error: ${error.message}`);
    return null;
  }
}

/**
 * Get list of idea files
 */
async function getIdeaFiles(filter = null) {
  try {
    const files = await readdir(IDEAS_DIR);
    const ideaFiles = files.filter(
      (f) =>
        f.endsWith(".md") &&
        (f.startsWith("U-") || f.startsWith("C-") || f.startsWith("B-")),
    );

    if (filter) {
      return ideaFiles.filter((f) => f === filter || f.includes(filter));
    }

    return ideaFiles;
  } catch (error) {
    console.error(`❌ Failed to read ideas directory: ${error.message}`);
    return [];
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filter = args.find((arg) => !arg.startsWith("--"));

  console.log("📝 Ideas to Issues Converter\n");

  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No issues will be created\n");
  }

  // Get idea files
  const ideaFiles = await getIdeaFiles(filter);

  if (ideaFiles.length === 0) {
    console.log("ℹ️  No idea files found");
    if (filter) {
      console.log(`   Filter: ${filter}`);
    }
    process.exit(0);
  }

  console.log(`Found ${ideaFiles.length} idea file(s):\n`);

  const results = {
    created: 0,
    failed: 0,
    skipped: 0,
  };

  for (const filename of ideaFiles) {
    const filePath = join(IDEAS_DIR, filename);

    try {
      // Parse idea file
      const metadata = await parseIdeaFile(filePath);

      if (!metadata.title) {
        console.log(`⚠️  Skipping ${filename}: No title found`);
        results.skipped++;
        continue;
      }

      if (!metadata.lane) {
        console.log(`⚠️  Skipping ${filename}: No lane specified`);
        results.skipped++;
        continue;
      }

      // Check if issue already exists
      if (!dryRun) {
        try {
          const searchCmd = `gh issue list --search "${metadata.title}" --json number,title --limit 1`;
          const { stdout } = await execAsync(searchCmd);
          const existing = JSON.parse(stdout);

          if (existing.length > 0) {
            console.log(
              `⏭️  Skipping ${filename}: Issue already exists (#${existing[0].number})`,
            );
            results.skipped++;
            continue;
          }
        } catch {
          // Ignore search errors
        }
      }

      // Create issue
      const issueNumber = await createIssue(metadata, dryRun);

      if (issueNumber) {
        results.created++;
      } else if (dryRun) {
        results.created++;
      } else {
        results.failed++;
      }
    } catch (err) {
      console.error(`❌ Error processing ${filename}:`, err.message);
      results.failed++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Created: ${results.created}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Skipped: ${results.skipped}`);

  if (results.failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
