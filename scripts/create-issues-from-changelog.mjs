#!/usr/bin/env node
/**
 * Create Issues from Changelog
 * @version 1.0.0
 */

// Check for --help first
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Create GitHub issues from CHANGELOG.md entries

Parses CHANGELOG.md and creates GitHub issues for each change entry.
Automatically detects lane from commit tags and applies appropriate labels.

USAGE:
  node scripts/create-issues-from-changelog.mjs [options]

OPTIONS:
  --version <ver>  Target specific version
  --dry-run        Preview without creating issues
  --help           Show this help

EXAMPLES:
  node scripts/create-issues-from-changelog.mjs
  node scripts/create-issues-from-changelog.mjs --version 0.1.0
  node scripts/create-issues-from-changelog.mjs --dry-run

REQUIRES:
  GitHub CLI authenticated (gh auth login)
`);
  process.exit(0);
}

/**
 * Create Issues from Changelog
 *
 * Parses CHANGELOG.md and creates GitHub issues for each change entry.
 * Automatically detects lane from commit tags and applies appropriate labels.
 *
 * Requires:
 *   - GitHub CLI authenticated (`gh auth login`)
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";

const execAsync = promisify(exec);

// Lane mapping
const LANE_MAP = {
  U: "lane:A",
  B: "lane:B",
  C: "lane:C",
  ARCH: "lane:C",
  D: "lane:D",
  PB: "lane:D",
};

/**
 * Check if gh CLI is installed and authenticated
 */
async function checkGhCli() {
  try {
    await execAsync("gh --version");
  } catch {
    console.error("❌ GitHub CLI not installed. Run: brew install gh");
    process.exit(1);
  }

  try {
    await execAsync("gh auth status");
  } catch {
    console.error("❌ GitHub CLI not authenticated. Run: gh auth login");
    process.exit(1);
  }
}

/**
 * Parse changelog and extract entries
 */
async function parseChangelog(targetVersion = null) {
  const changelog = await readFile("CHANGELOG.md", "utf-8");
  const lines = changelog.split("\n");

  const versions = [];
  let currentVersion = null;
  let currentSection = null;
  let sectionContent = [];

  for (const line of lines) {
    // Version header: ## [0.1.0] - 2025-10-26
    const versionMatch = line.match(/^## \[([^\]]+)\] - (.+)$/);
    if (versionMatch) {
      // Save previous section
      if (currentSection && currentVersion) {
        currentVersion.sections.push({
          title: currentSection,
          content: sectionContent.join("\n").trim(),
        });
      }

      // Start new version
      currentVersion = {
        version: versionMatch[1],
        date: versionMatch[2],
        sections: [],
      };
      versions.push(currentVersion);
      currentSection = null;
      sectionContent = [];
      continue;
    }

    // Section header: ### [TAG] Title
    const sectionMatch = line.match(/^### (.+)$/);
    if (sectionMatch && currentVersion) {
      // Save previous section
      if (currentSection) {
        currentVersion.sections.push({
          title: currentSection,
          content: sectionContent.join("\n").trim(),
        });
      }

      currentSection = sectionMatch[1];
      sectionContent = [];
      continue;
    }

    // Content
    if (currentSection && line.trim()) {
      sectionContent.push(line);
    }
  }

  // Save last section
  if (currentSection && currentVersion) {
    currentVersion.sections.push({
      title: currentSection,
      content: sectionContent.join("\n").trim(),
    });
  }

  // Filter by version if specified
  if (targetVersion) {
    return versions.filter((v) => v.version === targetVersion);
  }

  return versions;
}

/**
 * Detect lane from section title
 */
function detectLane(title) {
  const tagMatch = title.match(/^\[([^\]]+)\]/);
  if (!tagMatch) return null;

  const tag = tagMatch[1];
  const prefix = tag.split("-")[0];

  return LANE_MAP[prefix] || null;
}

/**
 * Create issue from changelog entry
 */
async function createIssue(section, version, dryRun = false) {
  const title = section.title;
  const body = `${section.content}\n\n---\n\n**From:** CHANGELOG.md v${version}\n**Auto-generated issue**`;

  const lane = detectLane(title);
  const labels = lane ? [lane] : [];

  if (dryRun) {
    console.log(`\n[DRY RUN] Would create issue:`);
    console.log(`  Title: ${title}`);
    console.log(`  Labels: ${labels.join(", ") || "none"}`);
    console.log(`  Body preview: ${body.substring(0, 100)}...`);
    return { number: "N/A", url: "N/A", dryRun: true };
  }

  const labelArgs = labels.length > 0 ? `--label "${labels.join(",")}"` : "";

  try {
    const { stdout } = await execAsync(
      `gh issue create --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" ${labelArgs}`,
    );

    const issueUrl = stdout.trim();
    const issueNumber = issueUrl.split("/").pop();

    console.log(`✅ Created issue #${issueNumber}: ${title}`);
    if (lane) {
      console.log(`   Lane: ${lane}`);
    }

    return { number: issueNumber, url: issueUrl, dryRun: false };
  } catch (error) {
    console.error(`❌ Failed to create issue for "${title}":`, error.message);
    throw error;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const options = {
    version: null,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--version":
      case "-v":
        options.version = next;
        i++;
        break;
      case "--dry-run":
      case "-d":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Create Issues from Changelog

Usage:
  node scripts/create-issues-from-changelog.mjs [options]

Options:
  --version, -v <version>    Only create issues for specific version
  --dry-run, -d             Show what would be created without creating
  --help, -h                Show this help

Examples:
  # Create issues from latest version
  node scripts/create-issues-from-changelog.mjs

  # Create issues for specific version
  node scripts/create-issues-from-changelog.mjs --version 0.1.0

  # Preview without creating
  node scripts/create-issues-from-changelog.mjs --dry-run
`);
        process.exit(0);
    }
  }

  return options;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();

  console.log("📋 Create Issues from Changelog\n");

  if (!options.dryRun) {
    await checkGhCli();
  }

  // Parse changelog
  const versions = await parseChangelog(options.version);

  if (versions.length === 0) {
    console.log("⚠️  No changelog entries found");
    return;
  }

  // Get latest version if not specified
  const targetVersion = options.version
    ? versions[0]
    : versions[0] || versions[0];

  console.log(`Processing version: ${targetVersion.version}\n`);

  const results = [];
  for (const section of targetVersion.sections) {
    // Skip generic sections
    if (
      section.title.match(/^(Highlights|Tooling|Rollout|Testing|Benefits)/i)
    ) {
      console.log(`⏭️  Skipping generic section: ${section.title}`);
      continue;
    }

    try {
      const result = await createIssue(
        section,
        targetVersion.version,
        options.dryRun,
      );
      results.push(result);
    } catch (error) {
      console.error(`Error creating issue: ${error.message}`);
    }
  }

  console.log(`\n✅ Issue creation complete!`);
  console.log(`   Created: ${results.filter((r) => !r.dryRun).length} issues`);

  if (options.dryRun) {
    console.log(`\n💡 Run without --dry-run to create issues`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
