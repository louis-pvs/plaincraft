#!/usr/bin/env node

/**
 * Generate PR title and body from CHANGELOG.md
 * Extracts the latest version's changes for PR description
 * Outputs to GITHUB_OUTPUT for workflow consumption
 */

import { readFile } from "node:fs/promises";
import { appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const CHANGELOG = join(ROOT, "CHANGELOG.md");

/**
 * Extract ticket ID from tag (e.g., [B-pr-template-enforcement] -> B-pr-template-enforcement)
 */
function extractTicketId(tag) {
  const match = tag.match(/^\[([\w-]+)\]$/);
  return match ? match[1] : null;
}

/**
 * Search for GitHub issue by ticket ID in title
 * Returns issue number if found, null otherwise
 */
async function findIssueByTicketId(ticketId) {
  try {
    const { stdout } = await execAsync(
      `gh issue list --search "${ticketId} in:title" --json number,title --limit 10`,
    );

    const issues = JSON.parse(stdout);
    console.log("DEBUG: ticketId", ticketId, "issues found:", issues);

    // Find exact match where title contains the ticket ID in brackets
    const match = issues.find((issue) =>
      issue.title.match(new RegExp(`\\[${ticketId}\\]`, "i")),
    );
    console.log("DEBUG: match", match);

    return match ? match.number : null;
  } catch (error) {
    console.warn(
      `⚠️  Failed to search for issue with ticket ID ${ticketId}:`,
      error.message,
    );
    return null;
  }
}

/**
 * Fetch acceptance checklist from GitHub issue
 * Returns array of checklist items or default placeholder
 */
async function fetchAcceptanceChecklist(issueNumber) {
  try {
    const { stdout } = await execAsync(
      `gh issue view ${issueNumber} --json body -q .body`,
    );

    const body = stdout.trim();

    // Extract acceptance checklist section
    const checklistRegex =
      /## Acceptance Checklist\s*([\s\S]*?)(?=\n##|\n$|$)/i;
    const match = body.match(checklistRegex);

    if (match) {
      // Extract checklist items (lines starting with - [ ] or - [x])
      const checklistContent = match[1];
      const items = checklistContent
        .split("\n")
        .filter((line) => line.trim().match(/^- \[[ x]\]/))
        .map((line) => line.trim());

      if (items.length > 0) {
        return items;
      }
    }

    // Fallback to default checklist
    return [
      "- [ ] All CI checks passing",
      "- [ ] Code reviewed",
      "- [ ] Documentation updated",
      "- [ ] Integration window (at :00 or :30)",
    ];
  } catch (error) {
    console.warn(
      `⚠️  Failed to fetch checklist from issue #${issueNumber}:`,
      error.message,
    );
    return [
      "- [ ] All CI checks passing",
      "- [ ] Code reviewed",
      "- [ ] Documentation updated",
      "- [ ] Integration window (at :00 or :30)",
    ];
  }
}

/**
 * Parse CHANGELOG.md and extract latest version entries
 */
async function parseChangelog() {
  if (!existsSync(CHANGELOG)) {
    return { version: null, sections: [] };
  }

  const content = await readFile(CHANGELOG, "utf-8");
  const lines = content.split("\n");

  // Find first version header: ## [x.y.z] - YYYY-MM-DD
  let versionLine = -1;
  let version = null;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^##\s+\[([^\]]+)\]\s+-\s+/);
    if (match) {
      versionLine = i;
      version = match[1];
      break;
    }
  }

  if (versionLine === -1) {
    return { version: null, sections: [] };
  }

  // Find end of this version section (next ## or end of file)
  let endLine = lines.length;
  for (let i = versionLine + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      endLine = i;
      break;
    }
  }

  // Extract sections (### headers with content)
  const sections = [];
  let currentSection = null;

  for (let i = versionLine + 1; i < endLine; i++) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      // Save previous section if exists
      if (currentSection) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        title: line.replace(/^###\s*/, "").trim(),
        content: [],
      };
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    version,
    sections: sections.map((s) => ({
      title: s.title,
      content: s.content.join("\n").trim(),
    })),
  };
}

/**
 * Generate PR title from changelog sections
 * Extracts commit tag prefix from section titles and uses it for PR title
 * Format: "[TAG] <title1>, <title2>"
 */
function generateTitle(sections, version) {
  if (sections.length === 0) {
    return version ? `Release v${version}` : "";
  }

  const titles = sections.map((s) => s.title);

  // Extract commit tag prefix (e.g., [ARCH-ci], [U-inline-edit]) from first section
  const firstTitle = titles[0];
  const tagMatch = firstTitle.match(/^\[[\w-]+\]/);
  const tag = tagMatch ? tagMatch[0] : null;

  // Remove tag prefixes from all titles
  const cleanTitles = titles.map((t) => t.replace(/^\[[\w-]+\]\s*/, "").trim());

  if (cleanTitles.length === 1) {
    return tag ? `${tag} ${cleanTitles[0]}` : cleanTitles[0];
  }

  // For multiple sections, list them with shared tag
  const titleList = cleanTitles.join(", ");
  return tag ? `${tag} ${titleList}` : titleList;
}

/**
 * Extract all ticket tags from changelog sections
 * Looks for [TAG-name] patterns in section titles first, then content bullets
 */
function extractAllTags(sections) {
  const tags = new Set();

  // First, check section titles (preferred format per guide)
  for (const section of sections) {
    const titleTagMatch = section.title.match(/\[[\w-]+\]/g);
    if (titleTagMatch) {
      titleTagMatch.forEach((tag) => tags.add(tag));
    }
  }

  // If no tags in titles, fall back to content bullets (legacy format)
  if (tags.size === 0) {
    for (const section of sections) {
      const contentLines = section.content.split("\n");
      for (const line of contentLines) {
        const tagMatch = line.match(/\[[\w-]+\]/g);
        if (tagMatch) {
          tagMatch.forEach((tag) => tags.add(tag));
        }
      }
    }
  }

  return Array.from(tags);
}

/**
 * Generate PR body from changelog sections
 * Integrates with PR template structure
 */
async function generateBody(sections, version) {
  if (sections.length === 0) {
    return version
      ? `## Release v${version}\n\nSee CHANGELOG.md for details.`
      : "";
  }

  // Extract all tags from content bullets
  const allTags = extractAllTags(sections);
  const firstTag = allTags.length > 0 ? allTags[0] : "";
  const ticketId = firstTag ? extractTicketId(firstTag) : null;

  // Determine lane from first tag
  let lane = "";
  if (firstTag.startsWith("[U-")) lane = "lane:A";
  else if (firstTag.startsWith("[B-")) lane = "lane:B";
  else if (firstTag.startsWith("[C-") || firstTag.startsWith("[ARCH-"))
    lane = "lane:C";
  else if (firstTag.startsWith("[D-") || firstTag.startsWith("[PB-"))
    lane = "lane:D";

  // Generate concise scope summary from first bullet point
  const firstSection = sections[0];
  const contentLines = firstSection.content.split("\n").filter((l) => l.trim());
  const firstBullet = contentLines.find((l) => l.trim().startsWith("-"));

  let scopeSummary = "See changes below.";
  if (firstBullet) {
    // Remove tag and bullet, extract content
    const cleanLine = firstBullet
      .replace(/^[-*]\s*/, "")
      .replace(/\[[\w-]+\]\s*/, "")
      .trim();

    // Find first sentence end (period followed by space or end, not inside backticks)
    const sentenceMatch = cleanLine.match(/^[^.!?]+[.!?](?:\s|$)/);
    if (sentenceMatch) {
      scopeSummary = sentenceMatch[0].trim();
    } else if (cleanLine.endsWith(".")) {
      // Line already ends with period
      scopeSummary = cleanLine;
    } else {
      // No sentence terminator found, use the whole line but cap at 150 chars
      scopeSummary =
        cleanLine.length > 150
          ? cleanLine.substring(0, 147) + "..."
          : cleanLine + ".";
    }
  } // Try to find and fetch issue details
  let issueNumber = null;
  let issueReference = "";
  let acceptanceChecklist = [
    "- [ ] All CI checks passing",
    "- [ ] Code reviewed",
    "- [ ] Documentation updated",
    "- [ ] Integration window (at :00 or :30)",
  ];

  if (ticketId) {
    console.log(`🔍 Searching for issue with ticket ID: ${ticketId}`);
    issueNumber = await findIssueByTicketId(ticketId);

    if (issueNumber) {
      console.log(`✅ Found issue #${issueNumber}`);
      issueReference = `Closes #${issueNumber}`;

      // Fetch acceptance checklist from issue
      console.log(
        `📋 Fetching acceptance checklist from issue #${issueNumber}...`,
      );
      acceptanceChecklist = await fetchAcceptanceChecklist(issueNumber);
      console.log(`✅ Found ${acceptanceChecklist.length} checklist items`);
    } else {
      console.warn(
        `⚠️  Could not find issue for ticket ID: ${ticketId}. Manual linking required.`,
      );
    }
  }

  // Build PR body following template structure
  const issueCheckbox = issueNumber
    ? `- [x] I referenced the ticket with \`Closes #${issueNumber}\` (required for merge)`
    : `- [ ] I referenced the ticket with \`Closes #<issue-number>\` (required for merge)`;

  const ticketIdField = ticketId ? `\`${ticketId}\`` : "``";

  const body = `${issueReference ? `${issueReference}\n\n` : ""}# Related Issue

${issueCheckbox}
- [ ] Every commit message begins with the ticket ID in brackets (e.g. \`${firstTag}\`)
- Ticket ID: ${ticketIdField}

# Lane + Contracts

- Lane label applied: \`${lane}\`
- Scope summary: ${scopeSummary}
- Rollout notes: ${version ? `Release v${version}` : "See details below"}

# Acceptance Checklist

${acceptanceChecklist.join("\n")}

---

# Changes (from CHANGELOG.md v${version || "latest"})

${sections
  .map((section, index) => {
    const separator = index > 0 ? "\n---\n" : "";
    return `${separator}\n## ${section.title}\n\n${section.content}`;
  })
  .join("\n")}

---

**Auto-generated from CHANGELOG.md** ${version ? `(v${version})` : ""}  
${issueNumber ? `**Linked issue**: #${issueNumber}` : "*Update with ticket reference and acceptance checklist*"}
`;

  return body;
}

/**
 * Write to GITHUB_OUTPUT
 */
function setOutput(key, value) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) {
    console.log(`${key}=${value}`);
    return;
  }

  // Multi-line output handling
  const delimiter = `EOF_${Date.now()}`;
  const content = `${key}<<${delimiter}\n${value}\n${delimiter}\n`;

  appendFileSync(output, content, "utf-8");
}

/**
 * Main execution
 */
async function main() {
  try {
    if (!existsSync(CHANGELOG)) {
      console.log("ℹ️ No CHANGELOG.md found");
      setOutput("title", "");
      setOutput("body", "");
      return;
    }

    console.log("📄 Reading CHANGELOG.md...");
    const { version, sections } = await parseChangelog();

    if (sections.length === 0) {
      console.log("ℹ️ No version sections found in CHANGELOG.md");
      setOutput("title", "");
      setOutput("body", "");
      return;
    }

    console.log(
      `📋 Found version ${version} with ${sections.length} section(s):`,
    );
    sections.forEach((s) => console.log(`  - ${s.title}`));

    // Generate PR content
    const title = generateTitle(sections, version);
    const body = await generateBody(sections, version);

    console.log("\n📝 Generated PR content:");
    console.log(`Title: ${title}`);
    console.log(`Body length: ${body.length} characters`);

    // Output for GitHub Actions
    setOutput("title", title);
    setOutput("body", body);

    console.log("\n✅ PR content generated successfully");
  } catch (error) {
    console.error("❌ Error generating PR content:", error.message);
    process.exit(1);
  }
}

main();
