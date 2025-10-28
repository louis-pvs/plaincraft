#!/usr/bin/env node

/**
 * Create Worktree + Branch + PR
 *
 * Creates a new git worktree with a branch and opens a PR linked to an issue.
 *
 * Usage:
 *   node scripts/create-worktree-pr.mjs 6                    # Create from issue #6
 *   node scripts/create-worktree-pr.mjs 6 --dry-run          # Preview without creating
 *   node scripts/create-worktree-pr.mjs 6 --dir ../my-dir    # Custom worktree location
 *
 * What it does:
 *   1. Fetches issue details from GitHub
 *   2. Generates branch name from issue title
 *   3. Creates git worktree with new branch
 *   4. Creates PR draft linked to the issue
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { access, writeFile, readFile } from "node:fs/promises";

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const IDEAS_DIR = join(ROOT_DIR, "ideas");

/**
 * Fetch issue details from GitHub
 */
async function getIssueDetails(issueNumber) {
  try {
    const { stdout } = await execAsync(
      `gh issue view ${issueNumber} --json number,title,labels,body`,
      { cwd: ROOT_DIR },
    );
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Failed to fetch issue #${issueNumber}: ${error.message}`);
  }
}

/**
 * Find idea file corresponding to an issue
 * Searches /ideas directory for matching file based on issue title/tag
 */
async function findIdeaFileForIssue(issueNumber) {
  try {
    // Get issue details to extract tag/title
    const issue = await getIssueDetails(issueNumber);
    const title = issue.title;

    // Extract tag from title (e.g., "[ARCH-ideas-pr-integration]" -> "ARCH-ideas-pr-integration")
    const tagMatch = title.match(/^\[?([A-Z]+-[a-z-]+)\]?/i);
    if (!tagMatch) {
      return null;
    }

    const tag = tagMatch[1];
    const ideaFileName = `${tag}.md`;
    const ideaFilePath = join(IDEAS_DIR, ideaFileName);

    // Check if file exists
    try {
      await access(ideaFilePath);
      return ideaFilePath;
    } catch {
      return null;
    }
  } catch (error) {
    console.warn(`Could not find idea file for issue #${issueNumber}`);
    return null;
  }
}

/**
 * Parse idea file and extract metadata
 */
async function parseIdeaFile(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");

    const metadata = {
      issueNumber: null,
      purpose: "",
      problem: "",
      proposal: "",
      acceptance: [],
    };

    // Extract Issue number
    const issueMatch = content.match(/Issue:\s*#(\d+)/i);
    if (issueMatch) {
      metadata.issueNumber = parseInt(issueMatch[1], 10);
    }

    // Extract Purpose
    const purposeMatch = content.match(/Purpose:\s*(.+?)(?:\n|$)/i);
    if (purposeMatch) {
      metadata.purpose = purposeMatch[1].trim();
    }

    // Extract Problem section
    const problemRegex = /## Problem\s*([\s\S]*?)(?=\n##|$)/;
    const problemMatch = content.match(problemRegex);
    if (problemMatch) {
      metadata.problem = problemMatch[1].trim();
    }

    // Extract Proposal section
    const proposalRegex = /## Proposal\s*([\s\S]*?)(?=\n##|$)/;
    const proposalMatch = content.match(proposalRegex);
    if (proposalMatch) {
      metadata.proposal = proposalMatch[1].trim();
    }

    // Extract acceptance checklist
    const checklistRegex = /## Acceptance Checklist\s*([\s\S]*?)(?=\n##|\n$)/;
    const checklistMatch = content.match(checklistRegex);
    if (checklistMatch) {
      const items = checklistMatch[1]
        .split("\n")
        .filter((line) => line.trim().startsWith("- [ ]"))
        .map((line) => line.trim());
      metadata.acceptance = items;
    }

    return metadata;
  } catch (error) {
    console.warn(`Could not parse idea file: ${error.message}`);
    return null;
  }
}

/**
 * Generate branch name from issue title
 * Example: "[B-pr-template-enforcement] PR template gaps" -> "fix/pr-template-enforcement"
 */
function generateBranchName(issueTitle) {
  // Extract tag if present: [B-something] or [U-something]
  const tagMatch = issueTitle.match(/^\[([A-Z]-[a-z-]+)\]/);
  const tag = tagMatch ? tagMatch[1].toLowerCase() : "";

  // Determine prefix based on tag type
  let prefix = "feat";
  if (tag.startsWith("b-")) {
    prefix = "fix";
  } else if (tag.startsWith("arch-")) {
    prefix = "refactor";
  } else if (tag.startsWith("d-") || tag.startsWith("pb-")) {
    prefix = "chore";
  }

  // Clean the tag or use title
  const name =
    tag ||
    issueTitle
      .toLowerCase()
      .replace(/^\[.*?\]\s*/, "") // Remove tag prefix
      .replace(/[^a-z0-9-\s]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Spaces to hyphens
      .substring(0, 50); // Limit length

  return `${prefix}/${name}`;
}

/**
 * Generate worktree directory name
 */
function generateWorktreePath(branchName, customDir = null) {
  if (customDir) {
    return customDir;
  }

  // Default: ../plaincraft-{branch-name}
  const baseName = branchName.replace(/\//g, "-");
  return join(ROOT_DIR, "..", `plaincraft-${baseName}`);
}

/**
 * Check if directory exists
 */
async function directoryExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if branch exists locally
 */
async function branchExistsLocally(branchName) {
  try {
    const { stdout } = await execAsync(`git branch --list "${branchName}"`, {
      cwd: ROOT_DIR,
    });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Create git worktree with new branch
 */
async function createWorktree(worktreePath, branchName, baseBranch = "main") {
  console.log(`Creating worktree at: ${worktreePath}`);
  console.log(`Branch: ${branchName}`);
  console.log(`Base: ${baseBranch}`);

  try {
    // Check if worktree directory already exists
    const dirExists = await directoryExists(worktreePath);
    if (dirExists) {
      throw new Error(
        `Worktree directory already exists: ${worktreePath}\nRemove it first: rm -rf "${worktreePath}"`,
      );
    }

    // Check if branch already exists
    const branchExists = await branchExistsLocally(branchName);

    if (branchExists) {
      console.log(
        `⚠️  Branch '${branchName}' already exists. Checking it out...`,
      );
      // Check out existing branch instead of creating new one
      const { stdout } = await execAsync(
        `git worktree add "${worktreePath}" "${branchName}"`,
        { cwd: ROOT_DIR },
      );
      console.log(stdout);
    } else {
      // Create new branch
      const { stdout } = await execAsync(
        `git worktree add "${worktreePath}" -b "${branchName}" "${baseBranch}"`,
        { cwd: ROOT_DIR },
      );
      console.log(stdout);
    }

    return worktreePath;
  } catch (error) {
    throw new Error(`Failed to create worktree: ${error.message}`);
  }
}

/**
 * Run post-checkout setup in worktree
 * This installs dependencies, sets git config, and publishes the branch
 */
async function runPostCheckout(worktreePath) {
  console.log("\n🔧 Running post-checkout setup...");
  try {
    // Set SKIP_SIMPLE_GIT_HOOKS to prevent hook installation issues in worktree
    // Worktrees share .git/hooks with main repo, so hooks are already set up
    const { stdout, stderr } = await execAsync(
      "SKIP_SIMPLE_GIT_HOOKS=1 node scripts/post-checkout.mjs",
      {
        cwd: worktreePath,
        env: { ...process.env, SKIP_SIMPLE_GIT_HOOKS: "1" },
      },
    );
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes("warning")) console.error(stderr);
    return true;
  } catch (error) {
    console.warn(`⚠️  Post-checkout setup had issues: ${error.message}`);
    console.warn(
      "You may need to run manually: cd ${worktreePath} && pnpm install",
    );
    return false;
  }
}

/**
 * Verify branch exists on remote
 */
async function verifyBranchOnRemote(branchName) {
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
 * Generate PR body from issue and optional idea file
 */
async function generatePRBody(issue, ideaFilePath = null) {
  const labels = issue.labels.map((l) => l.name).join(", ");

  // Try to use idea file content if available
  if (ideaFilePath) {
    const ideaMetadata = await parseIdeaFile(ideaFilePath);
    if (ideaMetadata) {
      const ideaFileName = ideaFilePath.split("/").pop();

      let body = `Closes #${ideaMetadata.issueNumber || issue.number}\n\n`;

      // Add Purpose
      if (ideaMetadata.purpose) {
        body += `**Purpose:** ${ideaMetadata.purpose}\n\n`;
      }

      // Add Problem section
      if (ideaMetadata.problem) {
        body += `## Problem\n\n${ideaMetadata.problem}\n\n`;
      }

      // Add Proposal section
      if (ideaMetadata.proposal) {
        body += `## Proposal\n\n${ideaMetadata.proposal}\n\n`;
      }

      // Add Acceptance Checklist
      if (ideaMetadata.acceptance && ideaMetadata.acceptance.length > 0) {
        body += `## Acceptance Checklist\n\n`;
        ideaMetadata.acceptance.forEach((item) => {
          body += `${item}\n`;
        });
        body += `\n`;
      }

      // Add footer
      body += `---\n\n`;
      body += `**Issue**: #${issue.number}\n`;
      body += `**Labels**: ${labels}\n`;
      body += `**Source**: \`/ideas/${ideaFileName}\`\n`;

      return body;
    }
  }

  // Fallback to generic template if no idea file
  return `Closes #${issue.number}

## Summary

${issue.title}

## Changes

- [ ] TODO: List changes here

## Testing

- [ ] TODO: Describe testing steps

---

**Issue**: #${issue.number}
**Labels**: ${labels}
`;
}

/**
 * Check if there are commits to create a PR
 */
async function hasCommitsForPR(branchName, baseBranch = "main") {
  try {
    const { stdout } = await execAsync(
      `git rev-list --count ${baseBranch}..${branchName}`,
      { cwd: ROOT_DIR },
    );
    return parseInt(stdout.trim(), 10) > 0;
  } catch {
    return false;
  }
}

/**
 * Create bootstrap commit to ensure PR can be created
 */
async function createBootstrapCommit(
  worktreePath,
  issueNumber,
  branchName,
  bootstrapFile = ".worktree-bootstrap.md",
) {
  const timestamp = new Date().toISOString();
  const bootstrapContent = `# Worktree Bootstrap

This file was auto-generated by \`pnpm gh:worktree\` to ensure the branch has at least one commit for PR creation.

- **Issue**: #${issueNumber}
- **Branch**: ${branchName}
- **Created**: ${timestamp}

You can safely delete this file or amend this commit once you've added your actual changes.
`;

  const bootstrapPath = join(worktreePath, bootstrapFile);

  try {
    // Write bootstrap file
    await writeFile(bootstrapPath, bootstrapContent, "utf-8");

    // Stage the file
    await execAsync(`git add ${bootstrapFile}`, { cwd: worktreePath });

    // Commit with skip-ci flag
    await execAsync(
      `git commit -m "[${branchName.split("/")[1]}] Bootstrap worktree for issue #${issueNumber} [skip ci]"`,
      { cwd: worktreePath },
    );

    // Push the commit with upstream tracking
    await execAsync(`git push --set-upstream origin ${branchName}`, {
      cwd: worktreePath,
    });

    return true;
  } catch (error) {
    console.error(`⚠️  Failed to create bootstrap commit: ${error.message}`);
    return false;
  }
}

/**
 * Create draft PR
 */
async function createPR(issueNumber, branchName, worktreePath, isDraft = true) {
  console.log(`\nCreating PR for branch: ${branchName}`);

  try {
    // Fetch issue details again to ensure we have latest
    const issue = await getIssueDetails(issueNumber);

    // Try to find corresponding idea file
    const ideaFilePath = await findIdeaFileForIssue(issueNumber);
    if (ideaFilePath) {
      console.log(`   Found idea file: ${ideaFilePath.split("/").pop()}`);
    }

    // Generate PR body (will use idea file if found, fallback to template)
    const prBody = await generatePRBody(issue, ideaFilePath);

    // Extract labels
    const labels = issue.labels.map((l) => l.name);
    const labelArgs =
      labels.length > 0 ? labels.map((l) => `--label "${l}"`).join(" ") : "";

    const draftFlag = isDraft ? "--draft" : "";

    // Use body-file to avoid escaping issues
    const bodyFile = `/tmp/pr-body-${Date.now()}.md`;
    await writeFile(bodyFile, prBody);

    const cmd = `gh pr create --title "${issue.title}" --body-file "${bodyFile}" ${labelArgs} ${draftFlag} --head "${branchName}"`;

    const { stdout } = await execAsync(cmd, { cwd: worktreePath });
    console.log(stdout);

    // Extract PR URL from output
    const urlMatch = stdout.match(/https:\/\/github\.com\/[^\s]+/);
    return urlMatch ? urlMatch[0] : null;
  } catch (error) {
    throw new Error(`Failed to create PR: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: node scripts/create-worktree-pr.mjs <issue-number> [options]

Options:
  --dry-run           Preview without creating
  --dir <path>        Custom worktree directory
  --base <branch>     Base branch (default: main)
  --no-draft          Create PR as ready for review (default: draft)
  --no-bootstrap      Skip creating bootstrap commit (default: creates commit)
  --force             Remove existing worktree/branch if they exist

Examples:
  node scripts/create-worktree-pr.mjs 6
  node scripts/create-worktree-pr.mjs 6 --dry-run
  node scripts/create-worktree-pr.mjs 6 --dir ../my-feature
  node scripts/create-worktree-pr.mjs 6 --base develop --no-draft
  node scripts/create-worktree-pr.mjs 6 --force  # Clean up existing first
  node scripts/create-worktree-pr.mjs 6 --no-bootstrap  # No auto-commit
`);
    process.exit(0);
  }

  const issueNumber = args[0];
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const customDir = args.includes("--dir")
    ? args[args.indexOf("--dir") + 1]
    : null;
  const baseBranch = args.includes("--base")
    ? args[args.indexOf("--base") + 1]
    : "main";
  const isDraft = !args.includes("--no-draft");
  const noBootstrap = args.includes("--no-bootstrap");

  if (!issueNumber || isNaN(issueNumber)) {
    console.error("❌ Error: Please provide a valid issue number");
    process.exit(1);
  }

  console.log(`\n🔍 Fetching issue #${issueNumber}...`);

  try {
    // Fetch issue details
    const issue = await getIssueDetails(issueNumber);
    console.log(`\n📋 Issue: ${issue.title}`);
    console.log(`   Labels: ${issue.labels.map((l) => l.name).join(", ")}`);

    // Generate branch name
    const branchName = generateBranchName(issue.title);
    console.log(`\n🌿 Branch: ${branchName}`);

    // Generate worktree path
    const worktreePath = generateWorktreePath(branchName, customDir);
    console.log(`📁 Worktree: ${worktreePath}`);

    if (dryRun) {
      console.log("\n✅ Dry run complete. No changes made.");
      console.log("\nTo create the worktree and PR, run without --dry-run:");
      console.log(`   node scripts/create-worktree-pr.mjs ${issueNumber}`);
      return;
    }

    // Clean up existing worktree/branch if --force is specified
    if (force) {
      console.log("\n🧹 Cleaning up existing worktree and branch...");

      // Check if worktree directory exists
      const dirExists = await directoryExists(worktreePath);
      if (dirExists) {
        console.log(`   Removing worktree directory: ${worktreePath}`);
        try {
          await execAsync(`git worktree remove "${worktreePath}" --force`, {
            cwd: ROOT_DIR,
          });
        } catch {
          // If worktree remove fails, try manual removal
          await execAsync(`rm -rf "${worktreePath}"`, { cwd: ROOT_DIR });
        }
      }

      // Check if branch exists locally
      const branchExists = await branchExistsLocally(branchName);
      if (branchExists) {
        console.log(`   Deleting branch: ${branchName}`);
        try {
          await execAsync(`git branch -D "${branchName}"`, { cwd: ROOT_DIR });
        } catch (error) {
          console.warn(`   Could not delete branch: ${error.message}`);
        }
      }

      console.log("✅ Cleanup complete");
    }

    // Create worktree
    console.log("\n🔨 Creating worktree...");
    await createWorktree(worktreePath, branchName, baseBranch);

    // Run post-checkout setup (installs deps, sets git config, publishes branch)
    await runPostCheckout(worktreePath);

    // Verify branch is on remote before creating PR
    console.log("\n🔍 Verifying branch on remote...");
    const branchExists = await verifyBranchOnRemote(branchName);

    if (!branchExists) {
      console.error("❌ Branch not found on remote. Cannot create PR.");
      console.error("Try pushing manually:");
      console.error(
        `   cd ${worktreePath} && git push -u origin ${branchName}`,
      );
      process.exit(1);
    }

    console.log("✅ Branch verified on remote");

    // Check if there are commits to create PR from
    console.log("\n🔍 Checking for commits...");
    let hasCommits = await hasCommitsForPR(branchName, baseBranch);

    if (!hasCommits && !noBootstrap) {
      console.log(
        "⚠️  No commits on branch. Creating bootstrap commit for PR...",
      );
      const bootstrapCreated = await createBootstrapCommit(
        worktreePath,
        issueNumber,
        branchName,
      );

      if (bootstrapCreated) {
        console.log("✅ Bootstrap commit created");
        hasCommits = true;
      } else {
        console.log("⚠️  Bootstrap commit failed, continuing without PR");
      }
    }

    if (!hasCommits) {
      console.log("⚠️  No commits on branch yet. Skipping PR creation.");
      console.log("\n✅ Worktree and branch created successfully!");
      console.log(`\n📂 Worktree: ${worktreePath}`);
      console.log(`\nTo create a PR after making commits:`);
      console.log(`   cd ${worktreePath}`);
      console.log(`   # Make your changes and commit`);
      console.log(`   gh pr create --fill --draft`);
      return;
    }

    // Create PR
    console.log("\n📤 Creating PR...");
    const prUrl = await createPR(
      issueNumber,
      branchName,
      worktreePath,
      isDraft,
    );

    console.log("\n✅ Success!");
    console.log(`\n📂 Worktree: ${worktreePath}`);
    if (prUrl) {
      console.log(`🔗 PR: ${prUrl}`);
    }
    console.log(`\nTo start working:`);
    console.log(`   cd ${worktreePath}`);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
