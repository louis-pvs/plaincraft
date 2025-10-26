#!/usr/bin/env node
/**
 * Prepare local environment for GitHub CLI (gh) workflows
 *
 * This script checks if gh CLI is installed and authenticated,
 * provides setup instructions if needed.
 *
 * Usage:
 *   node scripts/prepare-gh.mjs
 */

import { spawn } from "node:child_process";

/**
 * Execute a shell command and capture output
 */
function exec(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
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
        reject(new Error(stderr || `Command failed with code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

/**
 * Check if gh CLI is installed
 */
async function checkGhInstalled() {
  try {
    const version = await exec("gh", ["--version"]);
    console.log("✅ GitHub CLI installed");
    console.log(`   ${version.split("\n")[0]}`);
    return true;
  } catch {
    console.log("❌ GitHub CLI not installed\n");
    console.log("📦 Install instructions:");
    console.log("");
    console.log("   macOS:");
    console.log("     brew install gh");
    console.log("");
    console.log("   Linux:");
    console.log(
      "     curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg",
    );
    console.log(
      "     sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg",
    );
    console.log(
      '     echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null',
    );
    console.log("     sudo apt update");
    console.log("     sudo apt install gh");
    console.log("");
    console.log("   Or visit: https://cli.github.com/manual/installation");
    console.log("");
    return false;
  }
}

/**
 * Check if gh CLI is authenticated
 */
async function checkGhAuth() {
  try {
    const status = await exec("gh", ["auth", "status"]);
    console.log("✅ GitHub CLI authenticated");
    const lines = status.split("\n");
    const accountLine = lines.find((line) => line.includes("Logged in to"));
    if (accountLine) {
      console.log(`   ${accountLine.trim()}`);
    }
    return true;
  } catch {
    console.log("❌ GitHub CLI not authenticated\n");
    console.log("🔑 Authentication required:");
    console.log("");
    console.log("   Run:");
    console.log("     gh auth login");
    console.log("");
    console.log("   Then follow the prompts to:");
    console.log("     1. Choose 'GitHub.com'");
    console.log("     2. Choose authentication method (HTTPS recommended)");
    console.log("     3. Authenticate via web browser or token");
    console.log("");
    return false;
  }
}

/**
 * Check repository access
 */
async function checkRepoAccess() {
  try {
    const repo = await exec("gh", ["repo", "view", "--json", "nameWithOwner"]);
    const data = JSON.parse(repo);
    console.log("✅ Repository access verified");
    console.log(`   ${data.nameWithOwner}`);
    return true;
  } catch {
    console.log("⚠️  Could not verify repository access");
    console.log("   Make sure you're in a git repository and have access");
    return false;
  }
}

/**
 * Test CI monitoring commands
 */
async function testCiCommands() {
  console.log("\n📋 Testing CI monitoring commands...\n");

  try {
    console.log("   Running: gh run list --limit 1");
    const runs = await exec("gh", [
      "run",
      "list",
      "--limit",
      "1",
      "--json",
      "name,status,conclusion",
    ]);
    const data = JSON.parse(runs);

    if (data && data.length > 0) {
      console.log("✅ CI monitoring works");
      console.log(`   Latest run: ${data[0].name} - ${data[0].status}`);
    } else {
      console.log("ℹ️  No workflow runs found (repo may be new)");
    }
    return true;
  } catch (error) {
    console.log("⚠️  CI monitoring command failed");
    console.log(`   ${error.message}`);
    return false;
  }
}

/**
 * Show available commands
 */
function showCommands() {
  console.log("\n🛠️  Available CI commands:\n");
  console.log("   pnpm ci:check       - Check latest CI status");
  console.log("   pnpm ci:watch       - Watch CI status (auto-refresh)");
  console.log("   pnpm pr:generate    - Generate PR title/body from changelog");
  console.log("");
  console.log("   Manual commands:");
  console.log(
    "   gh run list                         - List all workflow runs",
  );
  console.log("   gh run view <run-id>                - View specific run");
  console.log("   gh run watch                        - Watch current run");
  console.log("   gh workflow run <workflow.yml>      - Trigger workflow");
  console.log("");
}

/**
 * Main execution
 */
async function main() {
  console.log("🔧 GitHub CLI Environment Check\n");

  let allGood = true;

  // Check installation
  const installed = await checkGhInstalled();
  if (!installed) {
    allGood = false;
  }

  console.log("");

  // Check authentication (only if installed)
  if (installed) {
    const authenticated = await checkGhAuth();
    if (!authenticated) {
      allGood = false;
    }

    console.log("");

    // Check repo access (only if authenticated)
    if (authenticated) {
      const repoAccess = await checkRepoAccess();
      if (!repoAccess) {
        allGood = false;
      }

      // Test CI commands (only if we have repo access)
      if (repoAccess) {
        await testCiCommands();
      }
    }
  }

  // Show available commands
  if (allGood) {
    showCommands();
    console.log("✅ GitHub CLI ready! All checks passed.\n");
    process.exit(0);
  } else {
    console.log("\n⚠️  Setup incomplete. Follow instructions above.\n");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
