#!/usr/bin/env node

/**
 * Sync issue content back to idea card files
 * Fetches issue data via GitHub API (non-interactive) and updates the corresponding idea file
 * Usage: node scripts/sync-issue-to-card.mjs <issueNumber>
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const REPO = process.env.GITHUB_REPOSITORY || "louis-pvs/plaincraft";

/**
 * Find idea file by issue number
 */
async function findIdeaFileForIssue(issueNumber) {
  try {
    const issueData = execSync(
      `gh api repos/${REPO}/issues/${issueNumber} --jq '{title, body}'`,
      { encoding: "utf8" },
    );
    const { title, body } = JSON.parse(issueData);

    // Method 1: Look for source reference in issue body: "Source: `/ideas/ARCH-example.md`"
    let match = body.match(/Source:\s*`([^`]+)`/);
    if (match) {
      const filePath = match[1];
      return filePath.startsWith("/ideas/")
        ? resolve(process.cwd(), filePath.slice(1))
        : resolve(process.cwd(), "ideas", filePath);
    }

    // Method 2: Look for "See /ideas/ARCH-*.md" reference
    match = body.match(/See\s+\/ideas\/([^\s]+\.md)/);
    if (match) {
      return resolve(process.cwd(), "ideas", match[1]);
    }

    // Method 3: Derive from title (e.g., "ARCH-source-of-truth" -> "ARCH-source-of-truth.md")
    // Extract slug from title
    const titleMatch = title.match(/^([A-Z]+-[a-z0-9-]+)/i);
    if (titleMatch) {
      const slug = titleMatch[1];
      return resolve(process.cwd(), "ideas", `${slug}.md`);
    }
  } catch {
    console.warn(
      `Warning: Could not extract source from issue #${issueNumber}`,
    );
  }

  return null;
}

/**
 * Get issue data from GitHub API (non-interactive)
 */
async function getIssueData(issueNumber) {
  try {
    const output = execSync(
      `gh api repos/${REPO}/issues/${issueNumber} --jq '{number, title, body, state, labels: [.labels[].name]}'`,
      { encoding: "utf8" },
    );

    return JSON.parse(output);
  } catch (error) {
    console.error(`Error fetching issue #${issueNumber}:`, error.message);
    throw error;
  }
}

/**
 * Parse issue body to extract metadata
 */
function parseIssueBody(body) {
  const sections = {};

  // Extract sections: Purpose, Problem, Proposal, Acceptance Checklist, Sub-Issues
  const sectionRegex = /^##\s+(.+?)\s*$([\s\S]*?)(?=^##\s+|\n*$)/gm;
  let match;

  while ((match = sectionRegex.exec(body)) !== null) {
    const sectionName = match[1].trim();
    const sectionContent = match[2].trim();

    // Normalize section names
    const normalizedName = sectionName
      .toLowerCase()
      .replace(/acceptance\s+checklist/i, "acceptance")
      .replace(/sub-issues/i, "subissues");

    sections[normalizedName] = sectionContent;
  }

  return sections;
}

/**
 * Update idea file with issue content and metadata
 */
async function updateIdeaFile(filePath, issueData) {
  try {
    const content = await readFile(filePath, "utf-8");
    const sections = parseIssueBody(issueData.body);

    let updatedContent = content;

    // Update issue number in front matter (after title/lane/purpose)
    // Pattern: Line starts with "Issue:" or insert after "Parent:" or "Purpose:" line
    const issueMetadata = `Issue: #${issueData.number}`;
    
    if (/^Issue:\s*#?\d+/m.test(updatedContent)) {
      // Update existing Issue line
      updatedContent = updatedContent.replace(
        /^Issue:\s*#?\d+/m,
        issueMetadata,
      );
    } else {
      // Insert Issue line after Purpose or Parent line
      const insertAfterMatch = updatedContent.match(
        /^(Purpose:.*$|Parent:.*$)/m,
      );
      if (insertAfterMatch) {
        const insertPos = insertAfterMatch.index + insertAfterMatch[0].length;
        updatedContent =
          updatedContent.slice(0, insertPos) +
          "\n" +
          issueMetadata +
          updatedContent.slice(insertPos);
      }
    }

    // Update each section if it exists in the issue
    for (const [sectionKey, sectionContent] of Object.entries(sections)) {
      // Map normalized keys back to actual section headers in files
      const sectionHeaders = {
        purpose: "Purpose",
        problem: "Problem",
        proposal: "Proposal",
        acceptance: "Acceptance Checklist",
        subissues: "Sub-Issues",
        details: "Details",
      };

      const headerName = sectionHeaders[sectionKey] || sectionKey;

      // Skip updating source reference or other metadata sections
      if (["details", "source"].includes(sectionKey)) continue;

      // Find and replace section content
      const sectionRegex = new RegExp(
        `(^##\\s+${headerName}\\s*$\\n)([\\s\\S]*?)(?=^##\\s+|$)`,
        "gm",
      );

      if (sectionRegex.test(updatedContent)) {
        updatedContent = updatedContent.replace(
          sectionRegex,
          `$1${sectionContent}\n\n`,
        );
      }
    }

    await writeFile(filePath, updatedContent, "utf-8");
    console.log(`✓ Updated ${filePath} (Issue #${issueData.number})`);

    return true;
  } catch (error) {
    console.error(`Error updating idea file:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const issueNumber = process.argv[2];

  if (!issueNumber || isNaN(issueNumber)) {
    console.error("Usage: node scripts/sync-issue-to-card.mjs <issueNumber>");
    process.exit(1);
  }

  console.log(`Syncing issue #${issueNumber} to idea card...`);

  // Find idea file
  const ideaFile = await findIdeaFileForIssue(issueNumber);
  if (!ideaFile) {
    console.error(`Could not find idea file for issue #${issueNumber}`);
    process.exit(1);
  }

  console.log(`Found idea file: ${ideaFile}`);

  // Get issue data
  const issueData = await getIssueData(issueNumber);
  console.log(`Fetched issue #${issueData.number}: ${issueData.title}`);

  // Update idea file
  const success = await updateIdeaFile(ideaFile, issueData);

  if (success) {
    console.log(`\n✓ Successfully synced issue #${issueNumber} to idea card`);
  } else {
    console.error(`\n✗ Failed to sync issue #${issueNumber}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
