#!/usr/bin/env node

/**
 * Post-Checkout Hook
 *
 * Automatically runs after git checkout to:
 *   1. Install/update dependencies with pnpm
 *   2. Set local git config from package.json author
 *   3. Publish branch to remote if not already published
 *
 * Usage (automatically via git hooks or manual):
 *   node scripts/post-checkout.mjs
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

/**
 * Get package.json content
 */
async function getPackageJson() {
  const content = await readFile(join(ROOT_DIR, "package.json"), "utf-8");
  return JSON.parse(content);
}

/**
 * Get current branch name
 */
async function getCurrentBranch() {
  try {
    const { stdout } = await execAsync("git branch --show-current", {
      cwd: ROOT_DIR,
    });
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to get current branch: ${error.message}`);
  }
}

/**
 * Check if branch exists on remote
 */
async function branchExistsOnRemote(branchName) {
  try {
    const { stdout } = await execAsync(
      `git ls-remote --heads origin ${branchName}`,
      { cwd: ROOT_DIR },
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Install dependencies
 */
async function installDependencies() {
  console.log("📦 Installing dependencies...");
  try {
    const { stdout, stderr } = await execAsync("pnpm install", {
      cwd: ROOT_DIR,
    });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log("✅ Dependencies installed");
  } catch (error) {
    console.error(`❌ Failed to install dependencies: ${error.message}`);
    throw error;
  }
}

/**
 * Set git config locally from package.json
 */
async function setGitConfig(author) {
  console.log(`\n👤 Setting git config...`);

  if (!author || !author.name || !author.email) {
    console.warn("⚠️  No author info in package.json, skipping git config");
    return;
  }

  try {
    // Set local (repository-specific) git config
    // Use --replace-all to handle multiple values
    await execAsync(
      `git config --local --replace-all user.name "${author.name}"`,
      {
        cwd: ROOT_DIR,
      },
    );
    console.log(`   user.name: ${author.name}`);

    await execAsync(
      `git config --local --replace-all user.email "${author.email}"`,
      {
        cwd: ROOT_DIR,
      },
    );
    console.log(`   user.email: ${author.email}`);

    console.log("✅ Git config set");
  } catch (error) {
    console.error(`❌ Failed to set git config: ${error.message}`);
    throw error;
  }
}

/**
 * Publish branch to remote
 */
async function publishBranch(branchName, cwd = ROOT_DIR) {
  console.log(`\n🚀 Publishing branch to remote...`);

  try {
    // Check if branch exists on remote
    const exists = await branchExistsOnRemote(branchName);

    if (exists) {
      console.log(`   Branch '${branchName}' already exists on remote`);
      return true;
    }

    // Push branch and set upstream
    const { stdout, stderr } = await execAsync(
      `git push -u origin ${branchName}`,
      { cwd },
    );
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ Branch '${branchName}' published to origin`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to publish branch: ${error.message}`);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("\n🔧 Post-checkout setup starting...\n");

  try {
    // Get package.json
    const pkg = await getPackageJson();

    // Get current branch
    const currentBranch = await getCurrentBranch();
    console.log(`📍 Current branch: ${currentBranch}\n`);

    // Skip if on main or develop
    const protectedBranches = ["main", "develop", "master"];
    const isProtected = protectedBranches.includes(currentBranch);

    // 1. Install dependencies
    await installDependencies();

    // 2. Set git config
    await setGitConfig(pkg.author);

    // 3. Publish branch (skip for protected branches)
    if (!isProtected) {
      await publishBranch(currentBranch);
    } else {
      console.log(
        `\n⏭️  Skipping branch publish (protected branch: ${currentBranch})`,
      );
    }

    console.log("\n✅ Post-checkout setup complete!\n");
  } catch (error) {
    console.error(`\n❌ Post-checkout setup failed: ${error.message}\n`);
    process.exit(1);
  }
}

main();
