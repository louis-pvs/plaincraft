#!/usr/bin/env node
/**
 * create-worktree-pr.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Create git worktree with branch and draft PR from GitHub issue
 *
 * Orchestrates full workflow:
 * 1. Fetch issue details from GitHub
 * 2. Generate branch name from issue title
 * 3. Create git worktree with new branch
 * 4. Create draft PR linked to issue
 * 5. Optional: Create bootstrap commit for immediate PR creation
 */

import path from "node:path";
import { writeFile } from "node:fs/promises";
import { z } from "zod";
import {
  Logger,
  parseFlags,
  fail,
  succeed,
  repoRoot,
  atomicWrite,
} from "../_lib/core.mjs";
import { createWorktree, removeWorktree, execCommand } from "../_lib/git.mjs";
import { getIssue, createPR } from "../_lib/github.mjs";
import { findIdeaFiles, parseIdeaFile } from "../_lib/ideas.mjs";

const SCRIPT_NAME = "create-worktree-pr";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  issueNumber: z.number(),
  worktreeDir: z.string().optional(),
  baseBranch: z.string().default("main"),
  draft: z.boolean().default(true),
  bootstrap: z.boolean().default(true),
  force: z.boolean().default(false),
});

/**
 * Generate branch name from issue title
 * @param {string} title - Issue title
 * @returns {string} Branch name (e.g., "feat/my-feature")
 */
function generateBranchName(title) {
  // Extract tag if present: [B-something] or [U-something]
  const tagMatch = title.match(/^\[([A-Z]+-[a-z-]+)\]/);
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
    title
      .toLowerCase()
      .replace(/^\[.*?\]\s*/, "") // Remove tag prefix
      .replace(/[^a-z0-9-\s]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Spaces to hyphens
      .substring(0, 50); // Limit length

  return `${prefix}/${name}`;
}

/**
 * Generate worktree directory path
 * @param {string} branchName - Branch name
 * @param {string} [customDir] - Custom directory
 * @param {string} root - Repository root
 * @returns {string} Worktree path
 */
function generateWorktreePath(branchName, customDir, root) {
  if (customDir) {
    return path.resolve(customDir);
  }

  // Default: ../plaincraft-{branch-name}
  const baseName = branchName.replace(/\//g, "-");
  return path.join(root, "..", `plaincraft-${baseName}`);
}

/**
 * Find idea file for issue
 * @param {number} issueNumber - Issue number
 * @param {string} issueTitle - Issue title
 * @param {string} root - Repository root
 * @returns {Promise<string|null>} Idea file path or null
 */
async function findIdeaForIssue(issueNumber, issueTitle, root) {
  const ideasDir = path.join(root, "ideas");

  // Extract tag from title
  const tagMatch = issueTitle.match(/^\[?([A-Z]+-[a-z-]+)\]?/i);
  if (!tagMatch) {
    return null;
  }

  const tag = tagMatch[1];
  const ideaFiles = await findIdeaFiles(ideasDir, tag);

  return ideaFiles.length > 0 ? path.join(ideasDir, ideaFiles[0]) : null;
}

/**
 * Generate PR body from issue and optional idea file
 * @param {object} issue - Issue details
 * @param {string|null} ideaFilePath - Path to idea file
 * @returns {Promise<string>} PR body
 */
async function generatePRBody(issue, ideaFilePath) {
  const labels = (issue.labels || []).map((l) => l.name).join(", ");

  // Use idea file if available
  if (ideaFilePath) {
    const ideaContent = await parseIdeaFile(ideaFilePath);
    if (ideaContent && ideaContent.metadata) {
      const { metadata } = ideaContent;
      const ideaFileName = path.basename(ideaFilePath);

      let body = `Closes #${issue.number}\n\n`;

      // Add sections from metadata
      if (metadata.title) {
        body += `## ${metadata.title}\n\n`;
      }

      // Add lane info
      if (metadata.lane) {
        body += `**Lane**: ${metadata.lane}\n\n`;
      }

      // Add acceptance checklist
      const checklistItems = ideaContent.checklistItems || [];
      if (checklistItems.length > 0) {
        body += `## Acceptance Checklist\n\n`;
        checklistItems.forEach((item) => {
          body += `- [ ] ${item}\n`;
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

  // Fallback template
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
 * Create bootstrap commit to enable PR creation
 * @param {string} worktreePath - Worktree directory
 * @param {number} issueNumber - Issue number
 * @param {string} branchName - Branch name
 * @param {Logger} log - Logger
 * @returns {Promise<boolean>} Success
 */
async function createBootstrapCommit(
  worktreePath,
  issueNumber,
  branchName,
  log,
) {
  const bootstrapFile = ".worktree-bootstrap.md";
  const timestamp = new Date().toISOString();
  const content = `# Worktree Bootstrap

This file was auto-generated to ensure the branch has at least one commit for PR creation.

- **Issue**: #${issueNumber}
- **Branch**: ${branchName}
- **Created**: ${timestamp}

You can safely delete this file or amend this commit once you've added your actual changes.
`;

  try {
    const filePath = path.join(worktreePath, bootstrapFile);
    await writeFile(filePath, content, "utf-8");

    // Stage and commit
    await execCommand("git", ["add", bootstrapFile], { cwd: worktreePath });
    await execCommand(
      "git",
      [
        "commit",
        "-m",
        `[${branchName.split("/")[1]}] Bootstrap worktree for issue #${issueNumber} [skip ci]`,
      ],
      { cwd: worktreePath },
    );

    // Push with upstream tracking
    await execCommand("git", ["push", "--set-upstream", "origin", branchName], {
      cwd: worktreePath,
    });

    log.info("Created bootstrap commit");
    return true;
  } catch (error) {
    log.warn(`Failed to create bootstrap commit: ${error.message}`);
    return false;
  }
}

/**
 * Run post-checkout setup in worktree
 * @param {string} worktreePath - Worktree directory
 * @param {Logger} log - Logger
 * @returns {Promise<boolean>} Success
 */
async function runPostCheckout(worktreePath, log) {
  log.info("Running post-checkout setup...");
  try {
    const postCheckoutScript = path.join(
      worktreePath,
      "scripts",
      "post-checkout.mjs",
    );

    await execCommand("node", [postCheckoutScript], {
      cwd: worktreePath,
      env: { ...process.env, SKIP_SIMPLE_GIT_HOOKS: "1" },
    });

    log.info("Post-checkout setup complete");
    return true;
  } catch (error) {
    log.warn(`Post-checkout setup had issues: ${error.message}`);
    log.warn("You may need to run manually: pnpm install");
    return false;
  }
}

/**
 * Check if branch has commits ahead of base
 * @param {string} branchName - Branch name
 * @param {string} baseBranch - Base branch
 * @param {string} cwd - Working directory
 * @returns {Promise<boolean>} Has commits
 */
async function hasCommits(branchName, baseBranch, cwd) {
  try {
    const { stdout } = await execCommand(
      "git",
      ["rev-list", "--count", `${baseBranch}..${branchName}`],
      { cwd },
    );
    return parseInt(stdout.trim(), 10) > 0;
  } catch {
    return false;
  }
}

/**
 * Execute worktree + PR creation workflow
 * @param {object} args - Parsed arguments
 * @param {Logger} log - Logger instance
 * @returns {Promise<object>} Result
 */
async function executeWorkflow(args, log) {
  const root = await repoRoot(args.cwd);

  log.info(`Fetching issue #${args.issueNumber}...`);
  const issue = await getIssue(args.issueNumber);

  if (!issue) {
    throw new Error(`Issue #${args.issueNumber} not found`);
  }

  log.info(`Issue: ${issue.title}`);
  const labels = (issue.labels || []).map((l) => l.name).join(", ");
  log.info(`Labels: ${labels}`);

  // Generate branch name
  const branchName = generateBranchName(issue.title);
  log.info(`Branch: ${branchName}`);

  // Generate worktree path
  const worktreePath = generateWorktreePath(branchName, args.worktreeDir, root);
  log.info(`Worktree: ${worktreePath}`);

  if (args.dryRun) {
    return {
      issue,
      branchName,
      worktreePath,
      dryRun: true,
    };
  }

  // Clean up if force flag
  if (args.force) {
    log.info("Force mode: cleaning up existing worktree...");
    try {
      await removeWorktree(worktreePath, true);
      log.debug("Removed existing worktree");
    } catch {
      // Ignore errors
    }

    // Delete branch if exists
    try {
      await execCommand("git", ["branch", "-D", branchName], { cwd: root });
      log.debug("Deleted existing branch");
    } catch {
      // Ignore errors
    }
  }

  // Create worktree
  log.info("Creating worktree...");
  await createWorktree(worktreePath, branchName, args.baseBranch);

  // Run post-checkout setup
  await runPostCheckout(worktreePath, log);

  // Check for commits
  log.info("Checking for commits...");
  let hasCommitsForPR = await hasCommits(branchName, args.baseBranch, root);

  if (!hasCommitsForPR && args.bootstrap) {
    log.info("No commits found, creating bootstrap commit...");
    const created = await createBootstrapCommit(
      worktreePath,
      args.issueNumber,
      branchName,
      log,
    );
    if (created) {
      hasCommitsForPR = true;
    }
  }

  if (!hasCommitsForPR) {
    log.warn("No commits on branch, skipping PR creation");
    return {
      issue,
      branchName,
      worktreePath,
      prUrl: null,
    };
  }

  // Find idea file
  const ideaFilePath = await findIdeaForIssue(
    args.issueNumber,
    issue.title,
    root,
  );
  if (ideaFilePath) {
    log.info(`Found idea file: ${path.basename(ideaFilePath)}`);
  }

  // Generate PR body
  const prBody = await generatePRBody(issue, ideaFilePath);

  // Write body to temp file
  const bodyFile = `/tmp/pr-body-${Date.now()}.md`;
  await atomicWrite(bodyFile, prBody);

  // Create PR
  log.info("Creating PR...");
  const prUrl = await createPR(
    issue.title,
    branchName,
    prBody,
    args.draft,
    issue.labels,
  );

  return {
    issue,
    branchName,
    worktreePath,
    prUrl,
  };
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  try {
    // Parse issue number from positional arg
    const issueNumber = parseInt(flags._?.[0], 10);
    if (!issueNumber || isNaN(issueNumber)) {
      throw new Error("Issue number required as first argument");
    }

    const args = ArgsSchema.parse({
      ...flags,
      issueNumber,
      worktreeDir: flags.dir,
      baseBranch: flags.base || "main",
      draft: !flags.noDraft,
      bootstrap: !flags.noBootstrap,
    });

    if (args.help) {
      console.log(`
Usage: ${SCRIPT_NAME} <issue-number> [options]

Create git worktree with branch and draft PR from GitHub issue.

Options:
  --help              Show this help message
  --dry-run           Preview without creating
  --output <fmt>      Output format: text (default), json
  --log-level <lvl>   Log level: error, warn, info (default), debug, trace
  --cwd <path>        Working directory (default: current)
  --dir <path>        Custom worktree directory
  --base <branch>     Base branch (default: main)
  --no-draft          Create ready-for-review PR (default: draft)
  --no-bootstrap      Skip bootstrap commit (default: creates commit)
  --force             Remove existing worktree/branch first

Examples:
  ${SCRIPT_NAME} 6                      # Create from issue #6
  ${SCRIPT_NAME} 6 --dry-run             # Preview
  ${SCRIPT_NAME} 6 --dir ../my-feature   # Custom location
  ${SCRIPT_NAME} 6 --base develop        # Different base
  ${SCRIPT_NAME} 6 --force               # Clean up existing first

Exit codes:
  0  - Success
  10 - Precondition failed (gh not authenticated, git not clean)
  11 - Validation failed
  13 - Unsafe operation
`);
      process.exit(0);
    }

    // Execute workflow
    const result = await executeWorkflow(args, log);

    if (args.dryRun) {
      succeed({
        script: SCRIPT_NAME,
        message: "Dry-run complete",
        output: args.output,
        data: result,
      });
    }

    succeed({
      script: SCRIPT_NAME,
      message: result.prUrl
        ? `Created worktree and PR`
        : `Created worktree (no PR)`,
      output: args.output,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error("Validation error:", error.errors);
      fail({
        script: SCRIPT_NAME,
        message: "Invalid arguments",
        exitCode: 11,
        output: flags.output || "text",
        error,
      });
    }

    log.error("Failed to create worktree/PR:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
