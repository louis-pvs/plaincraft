#!/usr/bin/env node

/**
 * Auto-tagging Script
 *
 * Creates git tags and GitHub releases based on version changes.
 * Automatically generates release notes from CHANGELOG.md.
 *
 * Usage:
 *   node scripts/auto-tag.mjs
 *   node scripts/auto-tag.mjs --version 0.2.0
 *   node scripts/auto-tag.mjs --create-release
 *
 * Requires:
 *   - Git repository
 *   - GitHub CLI for releases (optional)
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";

const execAsync = promisify(exec);

/**
 * Get current version from package.json
 */
async function getCurrentVersion() {
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  return pkg.version;
}

/**
 * Check if tag exists
 */
async function tagExists(tag) {
  try {
    await execAsync(`git rev-parse ${tag}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create git tag
 */
async function createTag(version, message) {
  const tag = `v${version}`;

  if (await tagExists(tag)) {
    console.log(`⚠️  Tag ${tag} already exists`);
    return { tag, existed: true };
  }

  try {
    await execAsync(`git tag -a ${tag} -m "${message}"`);
    console.log(`✅ Created tag: ${tag}`);
    return { tag, existed: false };
  } catch (error) {
    console.error(`❌ Failed to create tag:`, error.message);
    throw error;
  }
}

/**
 * Push tags to remote
 */
async function pushTags() {
  try {
    await execAsync("git push origin --tags");
    console.log("✅ Pushed tags to remote");
  } catch (error) {
    console.error("❌ Failed to push tags:", error.message);
    throw error;
  }
}

/**
 * Extract release notes from CHANGELOG.md for a specific version
 */
async function extractReleaseNotes(version) {
  const changelog = await readFile("CHANGELOG.md", "utf-8");
  const lines = changelog.split("\n");

  let inVersion = false;
  let notes = [];

  for (const line of lines) {
    // Start capturing when we find the version header
    if (line.match(new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\]`))) {
      inVersion = true;
      continue;
    }

    // Stop when we hit the next version
    if (inVersion && line.startsWith("## [")) {
      break;
    }

    if (inVersion) {
      notes.push(line);
    }
  }

  return notes.join("\n").trim();
}

/**
 * Create GitHub release
 */
async function createRelease(version, notes) {
  const tag = `v${version}`;

  try {
    // Check if gh CLI is available
    await execAsync("gh --version");
  } catch {
    console.log("⚠️  GitHub CLI not available, skipping release creation");
    console.log("   Install with: brew install gh");
    return;
  }

  try {
    await execAsync("gh auth status");
  } catch {
    console.log("⚠️  GitHub CLI not authenticated, skipping release creation");
    console.log("   Authenticate with: gh auth login");
    return;
  }

  try {
    // Create release with notes
    await execAsync(
      `gh release create ${tag} --title "Release ${version}" --notes "${notes.replace(/"/g, '\\"')}"`,
    );
    console.log(`✅ Created GitHub release: ${tag}`);
  } catch (error) {
    console.error("❌ Failed to create release:", error.message);
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
    createRelease: false,
    push: false,
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
      case "--create-release":
      case "-r":
        options.createRelease = true;
        break;
      case "--push":
      case "-p":
        options.push = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Auto-tagging Script

Usage:
  node scripts/auto-tag.mjs [options]

Options:
  --version, -v <version>    Specific version to tag (default: from package.json)
  --create-release, -r       Create GitHub release
  --push, -p                 Push tags to remote
  --help, -h                 Show this help

Examples:
  # Tag current version from package.json
  node scripts/auto-tag.mjs

  # Tag specific version
  node scripts/auto-tag.mjs --version 0.2.0

  # Tag and create GitHub release
  node scripts/auto-tag.mjs --create-release

  # Tag, create release, and push
  node scripts/auto-tag.mjs --create-release --push
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

  console.log("🏷️  Auto-tagging Script\n");

  // Get version
  const version = options.version || (await getCurrentVersion());
  console.log(`Version: ${version}`);

  // Extract release notes
  const notes = await extractReleaseNotes(version);
  if (!notes) {
    console.warn("⚠️  No release notes found in CHANGELOG.md");
  }

  // Create tag
  const { tag, existed } = await createTag(
    version,
    `Release ${version}\n\n${notes}`,
  );

  // Push tags if requested
  if (options.push && !existed) {
    await pushTags();
  }

  // Create GitHub release if requested
  if (options.createRelease) {
    await createRelease(version, notes);
  }

  console.log("\n✅ Auto-tagging complete!");
  console.log(`\nTag: ${tag}`);
  if (!options.push) {
    console.log("\n💡 To push tags, run:");
    console.log("   git push origin --tags");
  }
  if (!options.createRelease) {
    console.log("\n💡 To create GitHub release, run:");
    console.log(`   node scripts/auto-tag.mjs --create-release`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
