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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const CHANGELOG = join(ROOT, "CHANGELOG.md");

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
 * Generate PR body from changelog sections
 * Integrates with PR template structure
 */
function generateBody(sections, version) {
  if (sections.length === 0) {
    return version
      ? `## Release v${version}\n\nSee CHANGELOG.md for details.`
      : "";
  }

  // Extract commit tag from first section for lane identification
  const firstTitle = sections[0].title;
  const tagMatch = firstTitle.match(/^\[[\w-]+\]/);
  const tag = tagMatch ? tagMatch[0] : "";

  // Determine lane from tag
  let lane = "";
  if (tag.startsWith("[U-")) lane = "lane:A";
  else if (tag.startsWith("[B-")) lane = "lane:B";
  else if (tag.startsWith("[C-") || tag.startsWith("[ARCH-")) lane = "lane:C";
  else if (tag.startsWith("[D-") || tag.startsWith("[PB-")) lane = "lane:D";

  // Generate scope summary from section titles
  const cleanTitles = sections.map((s) =>
    s.title.replace(/^\[[\w-]+\]\s*/, "").trim(),
  );
  const scopeSummary = cleanTitles.join(", ");

  // Build PR body following template structure
  const body = `# Related Issue

- [ ] I referenced the ticket with \`Closes #<issue-number>\` (required for merge)
- [ ] Every commit message begins with the ticket ID in brackets (e.g. \`${tag}\`)
- Ticket ID: \`\`

# Lane + Contracts

- Lane label applied: \`${lane}\`
- Scope summary: ${scopeSummary}
- Rollout notes: ${version ? `Release v${version}` : "See details below"}

# Acceptance Checklist

- [ ] Acceptance checklist copied from the ticket and updated here

\`\`\`markdown
- [ ] All CI checks passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Integration window (at :00 or :30)
\`\`\`

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
*Update the sections above with ticket reference and acceptance checklist*
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
    const body = generateBody(sections, version);

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
