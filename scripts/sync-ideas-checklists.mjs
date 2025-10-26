#!/usr/bin/env node

/**
 * Sync Ideas Checklists to Issues
 *
 * Updates GitHub issue bodies with acceptance checklists from idea files.
 *
 * Usage:
 *   node scripts/sync-ideas-checklists.mjs              # Sync all
 *   node scripts/sync-ideas-checklists.mjs U-bridge.md  # Sync specific
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const IDEAS_DIR = "ideas";

/**
 * Extract acceptance checklist from idea file
 */
async function extractChecklist(filePath) {
  const content = await readFile(filePath, "utf-8");

  const checklistRegex = /## Acceptance Checklist\s*([\s\S]*?)(?=\n##|\n$)/;
  const match = content.match(checklistRegex);

  if (!match) {
    return null;
  }

  const items = match[1]
    .split("\n")
    .filter((line) => line.trim().startsWith("- [ ]"))
    .map((line) => line.trim());

  return items.length > 0 ? items : null;
}

/**
 * Find issue by ticket ID
 */
async function findIssueByTicketId(ticketId) {
  try {
    const cmd = `gh issue list --search "${ticketId}" --json number,title,body --limit 5`;
    const { stdout } = await execAsync(cmd);
    const issues = JSON.parse(stdout);

    // Find exact match
    const match = issues.find(
      (issue) =>
        issue.title.includes(`[${ticketId}]`) ||
        issue.title.startsWith(`${ticketId}:`),
    );

    return match || null;
  } catch (error) {
    console.error(`   Failed to search for ${ticketId}:`, error.message);
    return null;
  }
}

/**
 * Update issue body with new checklist
 */
async function updateIssueChecklist(issueNumber, currentBody, newChecklist) {
  // Replace or append checklist in body
  const checklistSection = `## Acceptance Checklist\n\n${newChecklist.join("\n")}`;

  let updatedBody;
  if (currentBody.includes("## Acceptance Checklist")) {
    // Replace existing checklist
    updatedBody = currentBody.replace(
      /## Acceptance Checklist[\s\S]*?(?=\n##|\n$|$)/,
      checklistSection,
    );
  } else {
    // Append checklist
    updatedBody = `${currentBody}\n\n${checklistSection}`;
  }

  try {
    const bodyFile = `/tmp/issue-body-${issueNumber}.md`;
    await writeFile(bodyFile, updatedBody);

    await execAsync(`gh issue edit ${issueNumber} --body-file "${bodyFile}"`);

    console.log(`   ✅ Updated issue #${issueNumber}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to update #${issueNumber}:`, error.message);
    return false;
  }
}

/**
 * Sync single idea file
 */
async function syncIdeaFile(filename) {
  const filePath = join(IDEAS_DIR, filename);

  // Extract ticket ID from filename
  const ticketId = filename.replace(/\.md$/, "");

  console.log(`\n📝 Processing ${filename}...`);

  // Extract checklist
  const checklist = await extractChecklist(filePath);
  if (!checklist) {
    console.log("   ⚠️  No checklist found in file");
    return { synced: false, reason: "no-checklist" };
  }

  console.log(`   Found ${checklist.length} checklist items`);

  // Find matching issue
  const issue = await findIssueByTicketId(ticketId);
  if (!issue) {
    console.log(`   ⚠️  No matching issue found for ${ticketId}`);
    return { synced: false, reason: "no-issue" };
  }

  console.log(`   Found issue #${issue.number}: ${issue.title}`);

  // Update issue
  const success = await updateIssueChecklist(
    issue.number,
    issue.body || "",
    checklist,
  );

  return { synced: success, issue: issue.number };
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
  const filter = args.find((arg) => !arg.startsWith("--"));

  console.log("🔄 Sync Ideas Checklists to Issues\n");

  const ideaFiles = await getIdeaFiles(filter);

  if (ideaFiles.length === 0) {
    console.log("ℹ️  No idea files found");
    process.exit(0);
  }

  console.log(`Processing ${ideaFiles.length} file(s)...`);

  const results = {
    synced: 0,
    failed: 0,
    skipped: 0,
  };

  for (const filename of ideaFiles) {
    try {
      const result = await syncIdeaFile(filename);

      if (result.synced) {
        results.synced++;
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message);
      results.failed++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Synced: ${results.synced}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Failed: ${results.failed}`);

  if (results.failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
