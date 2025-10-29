/**
 * git.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Git operations helpers
 */

import { execa } from "execa";

/**
 * Check if git working directory is clean
 * @param {string} cwd - Working directory
 * @returns {Promise<boolean>} True if clean
 */
export async function isGitClean(cwd = process.cwd()) {
  try {
    const { stdout } = await execa("git", ["status", "--porcelain"], { cwd });
    return stdout.trim().length === 0;
  } catch {
    return false;
  }
}

/**
 * Get current git branch
 * @param {string} cwd - Working directory
 * @returns {Promise<string>} Branch name
 */
export async function getCurrentBranch(cwd = process.cwd()) {
  const { stdout } = await execa("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd,
  });
  return stdout.trim();
}

/**
 * Check if branch exists
 * @param {string} branchName - Branch name
 * @param {string} cwd - Working directory
 * @returns {Promise<boolean>} True if exists
 */
export async function branchExists(branchName, cwd = process.cwd()) {
  try {
    await execa("git", ["rev-parse", "--verify", branchName], { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get recent commit messages
 * @param {number} count - Number of commits
 * @param {string} cwd - Working directory
 * @returns {Promise<string[]>} Commit messages
 */
export async function getRecentCommits(count = 10, cwd = process.cwd()) {
  const { stdout } = await execa(
    "git",
    ["log", `-${count}`, "--pretty=format:%s"],
    { cwd },
  );
  return stdout.split("\n").filter(Boolean);
}

/**
 * Create a new worktree
 * @param {string} path - Worktree path
 * @param {string} branch - Branch name
 * @param {object} options - Options
 * @param {string} options.cwd - Working directory
 * @param {string} options.baseBranch - Base branch to branch from
 * @returns {Promise<void>}
 */
export async function createWorktree(path, branch, options = {}) {
  const { cwd = process.cwd(), baseBranch = "main" } = options;
  await execa("git", ["worktree", "add", "-b", branch, path, baseBranch], {
    cwd,
  });
}

/**
 * Remove a worktree
 * @param {string} path - Worktree path
 * @param {string} cwd - Working directory
 * @returns {Promise<void>}
 */
export async function removeWorktree(path, cwd = process.cwd()) {
  await execa("git", ["worktree", "remove", path], { cwd });
}

/**
 * List all worktrees
 * @param {string} cwd - Working directory
 * @returns {Promise<Array<{path: string, branch: string}>>} Worktrees
 */
export async function listWorktrees(cwd = process.cwd()) {
  const { stdout } = await execa("git", ["worktree", "list", "--porcelain"], {
    cwd,
  });

  const worktrees = [];
  const lines = stdout.split("\n");
  let current = {};

  for (const line of lines) {
    if (line.startsWith("worktree ")) {
      current.path = line.slice(9);
    } else if (line.startsWith("branch ")) {
      current.branch = line.slice(7).replace("refs/heads/", "");
    } else if (line === "") {
      if (current.path) worktrees.push(current);
      current = {};
    }
  }

  if (current.path) worktrees.push(current);
  return worktrees;
}

/**
 * Execute a command (alias for execa)
 * @param {string} command - Command to execute
 * @param {string[]} args - Command arguments
 * @param {object} options - Options
 * @returns {Promise<{stdout: string, stderr: string}>} Result
 */
export async function execCommand(command, args, options = {}) {
  return await execa(command, args, options);
}
