#!/usr/bin/env node
/**
 * Pre-commit hook to auto-generate changelog if temporary summary files exist
 * @version 1.0.0
 */

// Check for --help first
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Pre-commit hook to auto-generate changelog

Checks if _tmp/ folder has any .md files.
If yes and CHANGELOG.md not staged, runs consolidation.
Auto-consolidates and stages CHANGELOG.md if summary files exist.

USAGE:
  node scripts/pre-commit-changelog.mjs [options]

OPTIONS:
  --help   Show this help

EXAMPLES:
  node scripts/pre-commit-changelog.mjs
`);
  process.exit(0);
}

import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const TMP_DIR = join(ROOT, "_tmp");

/**
 * Execute a shell command
 */
function exec(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

/**
 * Get list of staged files
 */
function getStagedFiles() {
  return new Promise((resolve, reject) => {
    const proc = spawn("git", ["diff", "--cached", "--name-only"], {
      cwd: ROOT,
    });

    let output = "";
    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim().split("\n").filter(Boolean));
      } else {
        reject(new Error(`git diff failed with code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

/**
 * Check if summary folder has any markdown files
 */
function hasSummaryFiles() {
  if (!existsSync(TMP_DIR)) {
    return false;
  }

  try {
    const files = readdirSync(TMP_DIR);
    return files.some((file) => file.endsWith(".md"));
  } catch {
    return false;
  }
}

/**
 * Check if CHANGELOG.md is staged
 */
function isChangelogStaged(stagedFiles) {
  return stagedFiles.includes("CHANGELOG.md");
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check if summary files exist
    if (!hasSummaryFiles()) {
      // No summary files, proceed normally
      process.exit(0);
    }

    // Get staged files
    const stagedFiles = await getStagedFiles();

    // Check if CHANGELOG.md is already staged
    if (isChangelogStaged(stagedFiles)) {
      // CHANGELOG.md already staged, proceed normally
      process.exit(0);
    }

    console.log(
      "⚠️  Summary files exist but CHANGELOG.md not staged. Consolidating...",
    );

    // Run changelog consolidation
    await exec("node", ["scripts/ops/consolidate-changelog.mjs"]);

    // Check if CHANGELOG.md was modified
    if (existsSync(join(ROOT, "CHANGELOG.md"))) {
      console.log("✅ CHANGELOG.md updated, staging...");
      await exec("git", ["add", "CHANGELOG.md"]);
    }

    console.log("✅ Pre-commit hook completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Pre-commit hook failed:", error.message);
    process.exit(1);
  }
}

main();
