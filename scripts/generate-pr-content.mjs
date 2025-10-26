#!/usr/bin/env node

/**
 * Generate PR title and body from summary files
 * Outputs to GITHUB_OUTPUT for workflow consumption
 */

import { readdir, readFile } from "node:fs/promises";
import { appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const SUMMARY_DIR = join(ROOT, "summary");

/**
 * Read all summary markdown files
 */
async function getSummaryFiles() {
  try {
    const files = await readdir(SUMMARY_DIR);
    return files
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => join(SUMMARY_DIR, f));
  } catch (err) {
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

/**
 * Parse summary file to extract title and content
 */
async function parseSummaryFile(filePath) {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");

  // Find first heading (title)
  let title = "";
  let bodyLines = [];
  let foundTitle = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!foundTitle && line.startsWith("#")) {
      // Extract title from heading
      title = line.replace(/^#+\s*/, "").trim();
      foundTitle = true;
      continue;
    }

    if (foundTitle) {
      bodyLines.push(lines[i]);
    }
  }

  return {
    title: title || "Changes",
    content: bodyLines.join("\n").trim(),
  };
}

/**
 * Generate PR title from summaries
 * Format: "[ARCH-ci] <summary1>, <summary2>"
 */
function generateTitle(summaries) {
  if (summaries.length === 0) {
    return "";
  }

  const titles = summaries.map((s) => s.title);

  // Remove common prefixes like [ARCH-ci] from individual titles
  const cleanTitles = titles.map((t) => t.replace(/^\[[\w-]+\]\s*/, "").trim());

  if (cleanTitles.length === 1) {
    return `[ARCH-ci] ${cleanTitles[0]}`;
  }

  // For multiple summaries, list them
  return `[ARCH-ci] ${cleanTitles.join(", ")}`;
}

/**
 * Generate PR body from summaries
 */
function generateBody(summaries) {
  if (summaries.length === 0) {
    return "";
  }

  const sections = summaries.map((summary, index) => {
    const separator = index > 0 ? "\n\n---\n" : "";
    return `${separator}\n## ${summary.title}\n\n${summary.content}`;
  });

  const body = sections.join("\n");

  // Add footer
  const footer = `

---

**Auto-generated from \`summary/\` folder**

<details>
<summary>📋 Integration Checklist</summary>

- [ ] All CI checks passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Integration window (at :00 or :30)

</details>
`;

  return body + footer;
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
    const summaryFiles = await getSummaryFiles();

    if (summaryFiles.length === 0) {
      console.log("ℹ️ No summary files found in /summary");
      setOutput("title", "");
      setOutput("body", "");
      return;
    }

    console.log(`📄 Found ${summaryFiles.length} summary file(s):`);
    summaryFiles.forEach((f) => console.log(`  - ${f}`));

    // Parse all summaries
    const summaries = await Promise.all(
      summaryFiles.map((f) => parseSummaryFile(f)),
    );

    // Generate PR content
    const title = generateTitle(summaries);
    const body = generateBody(summaries);

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
