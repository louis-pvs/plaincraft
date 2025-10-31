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
import { tmpdir } from "node:os";
import {
  access,
  rm,
  writeFile,
  readFile,
  mkdtemp,
  chmod,
} from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { execa } from "execa";
import {
  Logger,
  parseFlags,
  fail,
  succeed,
  repoRoot,
  atomicWrite,
} from "../_lib/core.mjs";
import { createWorktree, removeWorktree } from "../_lib/git.mjs";
import { getIssue, createPR } from "../_lib/github.mjs";
import {
  findIdeaFiles,
  loadIdeaFile,
  extractChecklistItems,
} from "../_lib/ideas.mjs";

const SCRIPT_NAME = "create-worktree-pr";

/**
 * Provide env vars that disable interactive git hooks during automation commits.
 * Hooks rely on node_modules and user-specific config that aren't available yet
 * in freshly bootstrapped worktrees, so we bypass them explicitly.
 */
function getBootstrapCommitEnv() {
  return {
    ...process.env,
    SKIP_SIMPLE_GIT_HOOKS: "1",
    SIMPLE_GIT_HOOKS_BYPASS: "1",
  };
}

/**
 * Central helper to run the bootstrap commit with consistent flags/env.
 * Keeps real execution and dry-run verification in sync.
 * @param {string} cwd - Working directory for git commit
 * @param {string} commitMessage - Commit message
 */
async function runBootstrapCommit(cwd, commitMessage) {
  await execa("git", ["commit", "--no-gpg-sign", "-m", commitMessage], {
    cwd,
    env: getBootstrapCommitEnv(),
  });
}

/**
 * Push bootstrap commit to origin, optionally forcing update if branch exists.
 * @param {string} cwd - Worktree path
 * @param {string} branchName - Branch being pushed
 * @param {Logger} log - Logger
 * @param {object} options - Push options
 */
async function pushBootstrapCommit(cwd, branchName, log, options = {}) {
  const { force = false } = options;
  const args = ["push", "--set-upstream", "origin", branchName];

  if (force) {
    args.splice(1, 0, "--force-with-lease");
  }

  try {
    await execa("git", args, { cwd });
  } catch (error) {
    const details = error.stderr || error.stdout || error.message;

    if (details && details.includes("non-fast-forward")) {
      const guidance = force
        ? "Force push failed even with --force-with-lease; investigate remote branch history."
        : "Remote branch already exists. Re-run with `--force` to replace it or clean up the remote branch manually.";
      log.warn(guidance);
    }

    throw error;
  }
}

/**
 * Inspect remote branch to determine if it already exists and whether it only
 * contains a previous bootstrap commit that can be safely replaced.
 * @param {string} root - Repository root
 * @param {string} branchName - Branch name
 * @param {Logger} log - Logger
 * @returns {Promise<{exists: boolean, bootstrap: boolean}>}
 */
async function analyzeRemoteBootstrapState(root, branchName, log) {
  let lsRemoteResult;
  try {
    lsRemoteResult = await execa(
      "git",
      ["ls-remote", "--heads", "origin", branchName],
      { cwd: root },
    );
  } catch (error) {
    throw new Error(
      `Failed to inspect remote branch state: ${error.stderr || error.message}`,
    );
  }

  if (!lsRemoteResult.stdout.trim()) {
    return { exists: false, bootstrap: false };
  }

  try {
    await execa("git", ["fetch", "--quiet", "origin", branchName], {
      cwd: root,
    });
  } catch (error) {
    log.warn(
      `Failed to fetch existing remote branch ${branchName}: ${error.stderr || error.message}`,
    );
    return { exists: true, bootstrap: false };
  }

  try {
    const { stdout } = await execa(
      "git",
      ["log", "-1", "--pretty=%s", `origin/${branchName}`],
      { cwd: root },
    );
    const subject = stdout.trim();
    const isBootstrapCommit =
      subject.includes("Bootstrap worktree for issue") &&
      subject.startsWith("[");

    return { exists: true, bootstrap: isBootstrapCommit };
  } catch {
    return { exists: true, bootstrap: false };
  }
}

/**
 * Validate during dry-run that the bootstrap commit pipeline works end-to-end.
 * Spins up a temporary repo with the real commit-msg hook to catch failures early.
 * @param {string} root - Repository root
 * @param {Logger} log - Logger
 */
async function verifyBootstrapCommitPipeline(root, log) {
  log.info("Dry-run: verifying bootstrap commit pipeline...");
  const tempDir = await mkdtemp(
    path.join(tmpdir(), "plaincraft-bootstrap-check-"),
  );

  try {
    try {
      await execa("git", ["init", "--initial-branch=main"], { cwd: tempDir });
    } catch {
      await execa("git", ["init"], { cwd: tempDir });
    }

    await execa("git", ["config", "user.name", "Worktree Bootstrap"], {
      cwd: tempDir,
    });
    await execa("git", ["config", "user.email", "automation@plaincraft.dev"], {
      cwd: tempDir,
    });

    // Install the real commit-msg hook so we exercise the same guardrail.
    const hookSource = `#!/bin/sh\n"${process.execPath}" "${path.join(
      root,
      "scripts",
      "ops",
      "commit-msg-hook.mjs",
    )}" "$1"\n`;
    const hookPath = path.join(tempDir, ".git", "hooks", "commit-msg");
    await writeFile(hookPath, hookSource);
    await chmod(hookPath, 0o755);

    const probeFile = path.join(tempDir, "bootstrap-check.md");
    await writeFile(probeFile, "bootstrap dry-run verification\n", "utf-8");
    await execa("git", ["add", path.basename(probeFile)], { cwd: tempDir });

    // Use an intentionally invalid commit message; without the env flags this would fail.
    await runBootstrapCommit(tempDir, "bootstrap dry-run probe");

    log.info("Dry-run: bootstrap commit pipeline passed");
  } catch (error) {
    throw new Error(
      `Bootstrap commit dry-run failed: ${error.stderr || error.message}`,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * Dry-run helper to check whether the bootstrap push would succeed.
 * Performs a git push --dry-run against origin to surface conflicts early.
 * @param {string} root - Repository root
 * @param {string} branchName - Target branch name
 * @param {string} baseBranch - Base branch name
 * @param {Logger} log - Logger instance
 * @param {object} options - Options
 */
async function verifyBootstrapPushFeasibility(
  root,
  branchName,
  baseBranch,
  log,
  options = {},
) {
  const { forcePush = false } = options;
  log.info("Dry-run: checking bootstrap push feasibility...");

  const args = [
    "push",
    "--dry-run",
    "--porcelain",
    "origin",
    `${baseBranch}:${branchName}`,
  ];

  if (forcePush) {
    args.splice(1, 0, "--force-with-lease");
  }

  try {
    await execa("git", args, { cwd: root });
    log.info("Dry-run: push would succeed");
  } catch (error) {
    throw new Error(
      `Bootstrap push dry-run failed: ${error.stderr || error.message}`,
    );
  }
}

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  yes: z.boolean().default(false),
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
 * Bootstrap node_modules into the worktree so pnpm is available offline
 * @param {string} sourceRoot - Main repository root
 * @param {string} worktreePath - Target worktree directory
 * @param {Logger} log - Logger
 * @returns {Promise<boolean>} Success
 */
async function bootstrapNodeModules(sourceRoot, worktreePath, log) {
  const sourceNodeModules = path.join(sourceRoot, "node_modules");
  const targetNodeModules = path.join(worktreePath, "node_modules");

  try {
    await access(sourceNodeModules);
  } catch {
    log.warn("Skipping dependency bootstrap: source node_modules missing");
    return false;
  }

  if (path.resolve(sourceRoot) === path.resolve(worktreePath)) {
    return false;
  }

  try {
    await rm(targetNodeModules, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors; force handles most cases
  }

  log.info(
    "Bootstrapping node_modules into worktree (this may take a minute)...",
  );
  try {
    // Use cp command for faster copying with progress indication
    const startTime = Date.now();
    await execa("cp", ["-rL", sourceNodeModules, targetNodeModules], {
      cwd: worktreePath,
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log.info(`node_modules bootstrapped in ${duration}s`);
    return true;
  } catch (error) {
    log.warn(`Failed to bootstrap node_modules: ${error.message}`);
    log.warn("Worktree will need to run pnpm install manually");
    return false;
  }
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
    const ideaContent = await loadIdeaFile(ideaFilePath);
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
      const checklistItems = extractChecklistItems(metadata);
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
  options = {},
) {
  const { ideaFilePath = null, forcePush = false } = options;
  const commitMessage = `[${branchName.split("/")[1]}] Bootstrap worktree for issue #${issueNumber} [skip ci]`;

  if (ideaFilePath) {
    try {
      const changed = await ensureIdeaMetadataForBootstrap(
        ideaFilePath,
        issueNumber,
      );

      if (changed) {
        const relativeIdeaPath = path.relative(worktreePath, ideaFilePath);

        await execa("git", ["add", relativeIdeaPath], { cwd: worktreePath });
        await runBootstrapCommit(worktreePath, commitMessage);
        await pushBootstrapCommit(worktreePath, branchName, log, {
          force: forcePush,
        });

        log.info("Created bootstrap commit from idea file");
        return true;
      }

      log.info(
        "Idea metadata already aligned; falling back to bootstrap placeholder",
      );
    } catch (error) {
      log.warn(`Failed to bootstrap using idea file: ${error.message}`);
    }
  }

  return await createBootstrapStubCommit(
    worktreePath,
    issueNumber,
    branchName,
    log,
    commitMessage,
    { forcePush },
  );
}

async function createBootstrapStubCommit(
  worktreePath,
  issueNumber,
  branchName,
  log,
  commitMessage,
  options = {},
) {
  const { forcePush = false } = options;
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
    await execa("git", ["add", bootstrapFile], { cwd: worktreePath });
    await runBootstrapCommit(worktreePath, commitMessage);

    // Push with upstream tracking
    await pushBootstrapCommit(worktreePath, branchName, log, {
      force: forcePush,
    });

    log.info("Created bootstrap commit");
    return true;
  } catch (error) {
    log.warn(`Failed to create bootstrap commit: ${error.message}`);
    return false;
  }
}

/**
 * Ensure idea metadata reflects active worktree
 * @param {string} ideaFilePath - Absolute path to idea file
 * @param {number} issueNumber - Issue number
 * @returns {Promise<boolean>} True if file was modified
 */
export async function ensureIdeaMetadataForBootstrap(
  ideaFilePath,
  issueNumber,
) {
  const original = await readFile(ideaFilePath, "utf-8");
  const lines = original.split(/\r?\n/);

  const desiredIssueLine = `Issue: #${issueNumber}`;
  const desiredStatusLine = "Status: in-progress";

  const lowerLines = lines.map((line) => line.trim().toLowerCase());

  let changed = false;

  let issueIndex = lowerLines.findIndex((line) => line.startsWith("issue:"));
  const laneIndex = lowerLines.findIndex((line) => line.startsWith("lane:"));

  if (issueIndex >= 0) {
    if (lines[issueIndex].trim() !== desiredIssueLine) {
      lines[issueIndex] = desiredIssueLine;
      lowerLines[issueIndex] = desiredIssueLine.toLowerCase();
      changed = true;
    }
  } else {
    const insertIndex =
      laneIndex >= 0 ? laneIndex + 1 : Math.min(2, lines.length);
    lines.splice(insertIndex, 0, desiredIssueLine);
    lowerLines.splice(insertIndex, 0, desiredIssueLine.toLowerCase());
    issueIndex = insertIndex;
    changed = true;
  }

  let statusIndex = lowerLines.findIndex((line) => line.startsWith("status:"));
  if (statusIndex >= 0) {
    if (
      lines[statusIndex].trim().toLowerCase() !==
      desiredStatusLine.toLowerCase()
    ) {
      lines[statusIndex] = desiredStatusLine;
      lowerLines[statusIndex] = desiredStatusLine.toLowerCase();
      changed = true;
    }
  } else {
    const insertIndex = issueIndex >= 0 ? issueIndex + 1 : lines.length;
    lines.splice(insertIndex, 0, desiredStatusLine);
    lowerLines.splice(insertIndex, 0, desiredStatusLine.toLowerCase());
    statusIndex = insertIndex;
    changed = true;
  }

  const nextLine = lines[statusIndex + 1];
  if (nextLine !== undefined && nextLine.trim() !== "") {
    lines.splice(statusIndex + 1, 0, "");
    lowerLines.splice(statusIndex + 1, 0, "");
    changed = true;
  }

  if (!changed) {
    return false;
  }

  if (lines.length === 0 || lines[lines.length - 1] !== "") {
    lines.push("");
  }

  await writeFile(ideaFilePath, lines.join("\n"), "utf-8");
  return true;
}

/**
 * Run post-checkout setup in worktree
 * @param {string} worktreePath - Worktree directory
 * @param {Logger} log - Logger
 * @returns {Promise<boolean>} Success
 */
async function runPostCheckout(worktreePath, log, options = {}) {
  log.info("Running post-checkout setup...");
  try {
    const postCheckoutScript = path.join(
      worktreePath,
      "scripts",
      "post-checkout.mjs",
    );

    const env = { ...process.env, SKIP_SIMPLE_GIT_HOOKS: "1" };
    if (options.bootstrappedDependencies) {
      env.PLAINCRAFT_BOOTSTRAPPED_NODE_MODULES = "1";
    }

    await execa("node", [postCheckoutScript], {
      cwd: worktreePath,
      env,
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
    const { stdout } = await execa(
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
  log.info(`Base branch: ${args.baseBranch}`);

  // Generate worktree path
  const worktreePath = generateWorktreePath(branchName, args.worktreeDir, root);
  log.info(`Worktree: ${worktreePath}`);

  const remoteState = await analyzeRemoteBootstrapState(root, branchName, log);
  let forcePushBootstrap = args.force;

  if (!forcePushBootstrap && remoteState.bootstrap) {
    log.info(
      "Remote branch already has an automation bootstrap commit; will replace it with --force-with-lease.",
    );
    forcePushBootstrap = true;
  }

  if (remoteState.exists && !forcePushBootstrap) {
    throw new Error(
      `Remote branch origin/${branchName} already exists. Re-run with --force to replace it or clean up the remote branch manually.`,
    );
  }

  if (args.dryRun) {
    if (args.bootstrap) {
      await verifyBootstrapCommitPipeline(root, log);
      await verifyBootstrapPushFeasibility(
        root,
        branchName,
        args.baseBranch,
        log,
        { forcePush: forcePushBootstrap },
      );
    }

    return {
      issue,
      branchName,
      worktreePath,
      forcePushBootstrap,
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
      await execa("git", ["branch", "-D", branchName], { cwd: root });
      log.debug("Deleted existing branch");
    } catch {
      // Ignore errors
    }
  }

  // Create worktree
  log.info("Creating worktree...");
  await createWorktree(worktreePath, branchName, {
    cwd: root,
    baseBranch: args.baseBranch,
  });

  const bootstrappedDependencies = await bootstrapNodeModules(
    root,
    worktreePath,
    log,
  );

  // Run post-checkout setup
  await runPostCheckout(worktreePath, log, {
    bootstrappedDependencies,
  });

  const ideaFilePathInWorktree = await findIdeaForIssue(
    args.issueNumber,
    issue.title,
    worktreePath,
  );
  if (ideaFilePathInWorktree) {
    log.info(
      `Found idea file in worktree: ${path.basename(ideaFilePathInWorktree)}`,
    );
  }

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
      {
        ideaFilePath: ideaFilePathInWorktree,
        forcePush: forcePushBootstrap,
      },
    );
    if (created) {
      hasCommitsForPR = true;
    } else {
      log.warn("Bootstrap commit failed; install dependencies and retry.");
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
  let ideaFilePath = ideaFilePathInWorktree;
  if (!ideaFilePath) {
    ideaFilePath = await findIdeaForIssue(args.issueNumber, issue.title, root);
    if (ideaFilePath) {
      log.info(`Found idea file: ${path.basename(ideaFilePath)}`);
    }
  }

  // Generate PR body
  const prBody = await generatePRBody(issue, ideaFilePath);

  // Write body to temp file using OS temp directory
  const bodyFile = path.join(tmpdir(), `pr-body-${Date.now()}.md`);
  await atomicWrite(bodyFile, prBody);

  // Create PR
  log.info("Creating PR...");
  const prResult = await createPR(
    {
      title: issue.title,
      bodyFile,
      base: args.baseBranch,
      draft: args.draft,
      head: branchName,
    },
    worktreePath,
  );

  return {
    issue,
    branchName,
    worktreePath,
    prUrl: prResult.url,
  };
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  // Show help first, before any validation
  if (flags.help) {
    console.log(`
Usage: ${SCRIPT_NAME} <issue-number> [options]

Create git worktree with branch and draft PR from GitHub issue.

Options:
  --help              Show this help message
  --dry-run           Preview without creating
  --yes               Execute mode (confirms execution, overrides --dry-run)
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
`);
    process.exit(0);
  }

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

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
