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
    purpose: "",
    problem: "",
    proposal: "",
    parent: "",
    acceptance: [],
    body: content,
    labels: [],
    sourceFile: filePath.replace(/^.*\/ideas\//, "/ideas/"),
  };

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1];
  }

  // Extract Purpose (from "Purpose: ..." line after Lane)
  const purposeMatch = content.match(/Purpose:\s*(.+?)(?:\n|$)/i);
  if (purposeMatch) {
    metadata.purpose = purposeMatch[1].trim();
  }

  // Extract Parent (from "Parent: #N ..." line)
  const parentMatch = content.match(/Parent:\s*#(\d+)/i);
  if (parentMatch) {
    metadata.parent = parentMatch[1];
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
  } else if (filename.startsWith("ARCH-")) {
    metadata.type = "architecture";
    metadata.labels.push("type:architecture");
  } else if (filename.startsWith("PB-")) {
    metadata.type = "playbook";
    metadata.labels.push("type:playbook");
  }

  // Extract lane (supports both "Lane:" and "**Lane**:" formats)
  const laneMatch = content.match(/\*?\*?Lane\*?\*?:\s*([A-D])/i);
  if (laneMatch) {
    metadata.lane = laneMatch[1].toUpperCase();
    metadata.labels.push(`lane:${metadata.lane}`);
  }

  // Extract Problem section
  const problemRegex = /## Problem\s*([\s\S]*?)(?=\n##|$)/;
  const problemMatch = content.match(problemRegex);
  if (problemMatch) {
    metadata.problem = problemMatch[1].trim();
  }

  // Extract Proposal section
  const proposalRegex = /## Proposal\s*([\s\S]*?)(?=\n##|$)/;
  const proposalMatch = content.match(proposalRegex);
  if (proposalMatch) {
    metadata.proposal = proposalMatch[1].trim();
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

  // Extract Sub-Issues section
  const subIssuesRegex = /## Sub-Issues\s*([\s\S]*?)(?=\n##|\n$)/;
  const subIssuesMatch = content.match(subIssuesRegex);
  metadata.subIssues = [];
  if (subIssuesMatch) {
    const lines = subIssuesMatch[1].split("\n");
    for (const line of lines) {
      // Match: 1. **ARCH-ideas-issue-sync** - Description
      const match = line.match(/^\s*\d+\.\s+\*\*([^*]+)\*\*\s*-\s*(.+)$/);
      if (match) {
        metadata.subIssues.push({
          tag: match[1].trim(),
          description: match[2].trim(),
        });
      }
    }
  }

  return metadata;
}

/**
 * Generate formatted issue body from metadata
 */
function generateIssueBody(metadata) {
  const { purpose, problem, proposal, acceptance, parent, title } = metadata;

  let body = "";

  // Add Purpose if available
  if (purpose) {
    body += `**Purpose:** ${purpose}\n\n`;
  }

  // Add Parent reference if available
  if (parent) {
    body += `**Parent:** #${parent}\n\n`;
  }

  // Add Problem section
  if (problem) {
    body += `## Problem\n\n${problem}\n\n`;
  }

  // Add Proposal section
  if (proposal) {
    body += `## Proposal\n\n${proposal}\n\n`;
  }

  // Add Acceptance Checklist
  if (acceptance && acceptance.length > 0) {
    body += `## Acceptance Checklist\n\n`;
    acceptance.forEach((item) => {
      body += `${item}\n`;
    });
    body += `\n`;
  }

  // Add source file reference
  const filename = title.toLowerCase().replace(/\s+/g, "-");
  body += `---\n\n**Source:** \`/ideas/${filename}.md\`\n`;

  return body;
}

/**
 * Create GitHub issue from idea metadata
 */
async function createIssue(metadata, dryRun = false) {
  const { title, labels } = metadata;

  if (dryRun) {
    console.log("\n[DRY RUN] Would create issue:");
    console.log(`  Title: ${title}`);
    console.log(`  Labels: ${labels.join(", ")}`);
    console.log(`  Checklist items: ${metadata.acceptance.length}`);
    console.log("\n  Body Preview:");
    console.log(generateIssueBody(metadata));
    return null;
  }

  try {
    // Generate formatted issue body
    const body = generateIssueBody(metadata);

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
 * Update parent issue with task list of child issues
 */
async function updateParentWithChildren(
  parentIssueNumber,
  childIssues,
  dryRun = false,
) {
  if (dryRun) {
    console.log(`\n[DRY RUN] Would update parent issue #${parentIssueNumber}:`);
    console.log("  Child issues task list:");
    for (const child of childIssues) {
      console.log(`    - [ ] #${child.number} ${child.title}`);
    }
    return;
  }

  try {
    // Build task list
    const taskList = childIssues
      .map((child) => `- [ ] #${child.number} ${child.title}`)
      .join("\n");

    // Get current issue body
    const { stdout } = await execAsync(
      `gh issue view ${parentIssueNumber} --json body`,
    );
    const currentBody = JSON.parse(stdout).body || "";

    // Append task list to body
    const updatedBody = `${currentBody}\n\n## Sub-Issues\n\n${taskList}`;

    // Write to temp file
    const bodyFile = `/tmp/parent-issue-body-${Date.now()}.md`;
    await writeFile(bodyFile, updatedBody);

    // Update issue
    await execAsync(
      `gh issue edit ${parentIssueNumber} --body-file "${bodyFile}"`,
    );

    console.log(
      `✅ Updated parent issue #${parentIssueNumber} with child task list`,
    );
  } catch (error) {
    console.error(`❌ Failed to update parent issue: ${error.message}`);
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
        (f.startsWith("U-") ||
          f.startsWith("C-") ||
          f.startsWith("B-") ||
          f.startsWith("ARCH-") ||
          f.startsWith("PB-")),
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

        // Process sub-issues if any
        if (metadata.subIssues && metadata.subIssues.length > 0) {
          console.log(
            `\n📋 Processing ${metadata.subIssues.length} sub-issue(s)...`,
          );

          const childIssues = [];

          for (const subIssue of metadata.subIssues) {
            try {
              // Find corresponding idea file
              const subIssueFiles = await getIdeaFiles(subIssue.tag);

              if (subIssueFiles.length === 0) {
                console.log(
                  `  ⚠️  No idea file found for sub-issue: ${subIssue.tag}`,
                );
                continue;
              }

              const subIssueFilePath = join(IDEAS_DIR, subIssueFiles[0]);
              const subIssueMetadata = await parseIdeaFile(subIssueFilePath);

              // Check if sub-issue already exists
              if (!dryRun) {
                try {
                  const searchCmd = `gh issue list --search "${subIssueMetadata.title}" --json number,title --limit 1`;
                  const { stdout } = await execAsync(searchCmd);
                  const existing = JSON.parse(stdout);

                  if (existing.length > 0) {
                    console.log(
                      `  ⏭️  Sub-issue already exists: #${existing[0].number} ${subIssueMetadata.title}`,
                    );
                    childIssues.push({
                      number: existing[0].number,
                      title: subIssueMetadata.title,
                    });
                    continue;
                  }
                } catch {
                  // Ignore search errors
                }
              }

              // Create child issue with parent reference
              const childIssueNumber = await createIssue(
                subIssueMetadata,
                dryRun,
                issueNumber,
              );

              if (childIssueNumber) {
                childIssues.push({
                  number: childIssueNumber,
                  title: subIssueMetadata.title,
                });
                console.log(
                  `  ✅ Created sub-issue #${childIssueNumber}: ${subIssueMetadata.title}`,
                );
              }
            } catch (err) {
              console.error(
                `  ❌ Error processing sub-issue ${subIssue.tag}:`,
                err.message,
              );
            }
          }

          // Update parent issue with child task list
          if (childIssues.length > 0) {
            await updateParentWithChildren(issueNumber, childIssues, dryRun);
          }
        }
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
