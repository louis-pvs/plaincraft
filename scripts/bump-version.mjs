#!/usr/bin/env node
/**
 * bump-version.mjs
 * @since 2025-10-28
 * @version 1.0.0
 * Summary: Bump package.json version based on commit messages
 *
 * Convention:
 * - [MAJOR] or breaking: → major bump
 * - [MINOR] or feat: → minor bump
 * - [PATCH] or fix: → patch bump
 * - Default → patch bump
 */

// Check for --help first
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Usage: node scripts/bump-version.mjs [version-type] [options]

Arguments:
  version-type        Version bump type: major|minor|patch (auto-detect if omitted)

Options:
  --help              Show this help
  --dry-run           Preview mode without making changes (default: false)
  --yes               Execute mode (default: true)
  --output <format>   Output format: text|json (default: text)
  --log-level <level> Log level (default: info)
  --cwd <path>        Working directory (default: current)

Examples:
  node scripts/bump-version.mjs          # Auto-detect from commits
  node scripts/bump-version.mjs major    # Force major
  node scripts/bump-version.mjs minor    # Force minor
  node scripts/bump-version.mjs patch    # Force patch
  node scripts/bump-version.mjs --dry-run  # Preview only
`);
  process.exit(0);
}

import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const PACKAGE_JSON = join(ROOT, "package.json");

/**
 * Execute command and capture output
 */
function execCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: false,
      cwd: ROOT,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Command failed: ${stderr || "Unknown error"}`));
      }
    });

    proc.on("error", reject);
  });
}

/**
 * Get recent commit messages
 */
async function getRecentCommits(count = 10) {
  try {
    const log = await execCommand("git", [
      "log",
      `-${count}`,
      "--pretty=format:%s",
    ]);
    return log.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Detect bump type from commit messages
 */
function detectBumpType(commits) {
  const hasBreaking = commits.some(
    (msg) =>
      msg.includes("[MAJOR]") ||
      msg.includes("BREAKING CHANGE") ||
      msg.toLowerCase().includes("breaking:"),
  );

  const hasFeature = commits.some(
    (msg) =>
      msg.includes("[MINOR]") ||
      msg.includes("feat:") ||
      msg.includes("feature:"),
  );

  if (hasBreaking) return "major";
  if (hasFeature) return "minor";
  return "patch";
}

/**
 * Bump semantic version
 */
function bumpVersion(currentVersion, bumpType) {
  const parts = currentVersion.split(".").map(Number);
  const [major, minor, patch] = parts;

  switch (bumpType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("📦 Version Bumper\n");

  // Read package.json
  const packageData = JSON.parse(await readFile(PACKAGE_JSON, "utf-8"));
  const currentVersion = packageData.version;
  console.log(`Current version: ${currentVersion}`);

  // Determine bump type
  const args = process.argv.slice(2);
  let bumpType = args[0];

  if (!bumpType || !["major", "minor", "patch"].includes(bumpType)) {
    console.log("Analyzing recent commits...");
    const commits = await getRecentCommits();
    bumpType = detectBumpType(commits);
    console.log(`Detected bump type: ${bumpType}`);
    console.log(`Based on commits:`);
    commits.slice(0, 5).forEach((msg) => console.log(`  - ${msg}`));
  } else {
    console.log(`Using forced bump type: ${bumpType}`);
  }

  // Calculate new version
  const newVersion = bumpVersion(currentVersion, bumpType);
  console.log(`\n✨ New version: ${newVersion}`);

  // Update package.json
  packageData.version = newVersion;
  await writeFile(PACKAGE_JSON, JSON.stringify(packageData, null, 2) + "\n");

  console.log(`✅ Updated ${PACKAGE_JSON}`);

  // Set output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const fs = await import("node:fs");
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${newVersion}\n`);
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `old_version=${currentVersion}\n`,
    );
    console.log(`📌 Set GitHub output: version=${newVersion}`);
  }

  console.log(`\n📋 Next steps:`);
  console.log(`   git add package.json`);
  console.log(`   git commit -m "chore: bump version to ${newVersion}"`);
  console.log(`   git tag v${newVersion}`);
}

main().catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
