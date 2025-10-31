/**
 * github.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * GitHub API helpers using gh CLI
 */

import { execa } from "execa";

/**
 * Check if gh CLI is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
export async function isGhAuthenticated() {
  try {
    await execa("gh", ["auth", "status"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get issue details
 * @param {number} issueNumber - Issue number
 * @param {string} cwd - Working directory
 * @returns {Promise<object>} Issue data
 */
export async function getIssue(issueNumber, cwd = process.cwd()) {
  const { stdout } = await execa(
    "gh",
    [
      "issue",
      "view",
      String(issueNumber),
      "--json",
      "number,title,labels,body,state",
    ],
    { cwd },
  );
  return JSON.parse(stdout);
}

/**
 * Create a PR
 * @param {object} options - PR options
 * @param {string} options.title - PR title
 * @param {string} options.body - PR body (use bodyFile for multiline content)
 * @param {string} options.bodyFile - Path to file containing PR body
 * @param {string} options.base - Base branch
 * @param {boolean} options.draft - Create as draft
 * @param {string} cwd - Working directory
 * @returns {Promise<object>} PR data
 */
export async function createPR(options, cwd = process.cwd()) {
  const args = ["pr", "create", "--title", options.title];

  // Prefer bodyFile over body to avoid shell escaping issues
  if (options.bodyFile) {
    args.push("--body-file", options.bodyFile);
  } else if (options.body) {
    args.push("--body", options.body);
  } else {
    args.push("--body", "");
  }

  args.push("--base", options.base || "main");

  if (options.draft) {
    args.push("--draft");
  }

  if (options.head) {
    args.push("--head", options.head);
  }

  const { stdout } = await execa("gh", args, { cwd });
  return { url: stdout.trim() };
}

/**
 * List issues with filters
 * @param {object} filters - Filter options
 * @param {string} filters.state - Issue state (open/closed/all)
 * @param {string} filters.label - Label filter
 * @param {string} cwd - Working directory
 * @returns {Promise<Array>} Issues
 */
export async function listIssues(filters = {}, cwd = process.cwd()) {
  const args = ["issue", "list", "--json", "number,title,labels,state"];

  if (filters.state) {
    args.push("--state", filters.state);
  }

  if (filters.label) {
    args.push("--label", filters.label);
  }

  const { stdout } = await execa("gh", args, { cwd });
  return JSON.parse(stdout);
}

/**
 * Get PR details
 * @param {number} prNumber - PR number
 * @param {string} cwd - Working directory
 * @returns {Promise<object>} PR data
 */
export async function getPR(prNumber, cwd = process.cwd()) {
  const { stdout } = await execa(
    "gh",
    [
      "pr",
      "view",
      String(prNumber),
      "--json",
      "number,title,body,state,labels",
    ],
    { cwd },
  );
  return JSON.parse(stdout);
}

/**
 * Update PR
 * @param {number} prNumber - PR number
 * @param {object} updates - Fields to update
 * @param {string} cwd - Working directory
 * @returns {Promise<void>}
 */
export async function updatePR(prNumber, updates, cwd = process.cwd()) {
  const args = ["pr", "edit", String(prNumber)];

  if (updates.title) {
    args.push("--title", updates.title);
  }

  if (updates.body) {
    args.push("--body", updates.body);
  }

  await execa("gh", args, { cwd });
}

/**
 * Create or update a label
 * @param {object} label - Label definition
 * @param {string} label.name - Label name
 * @param {string} label.color - Hex color
 * @param {string} label.description - Label description
 * @param {string} cwd - Working directory
 * @returns {Promise<void>}
 */
export async function createLabel(label, cwd = process.cwd()) {
  const args = [
    "label",
    "create",
    label.name,
    "--color",
    label.color,
    "--description",
    label.description || "",
    "--force",
  ];

  await execa("gh", args, { cwd });
}

/**
 * Create a new issue
 * @param {string} title - Issue title
 * @param {string} body - Issue body
 * @param {boolean} assignToMe - Assign to current user
 * @param {string[]} labels - Labels to add
 * @param {string} cwd - Working directory
 * @returns {Promise<string>} Issue URL
 */
export async function createIssue(
  title,
  body,
  assignToMe = false,
  labels = [],
  cwd = process.cwd(),
) {
  const args = ["issue", "create", "--title", title, "--body", body];

  if (assignToMe) {
    args.push("--assignee", "@me");
  }

  if (labels.length > 0) {
    args.push("--label", labels.join(","));
  }

  const { stdout } = await execa("gh", args, { cwd });
  return stdout.trim();
}

/**
 * Update an issue
 * @param {number} issueNumber - Issue number
 * @param {object} updates - Fields to update
 * @param {string} cwd - Working directory
 * @returns {Promise<void>}
 */
export async function updateIssue(issueNumber, updates, cwd = process.cwd()) {
  const args = ["issue", "edit", String(issueNumber)];

  if (updates.title) args.push("--title", updates.title);
  if (updates.body) args.push("--body", updates.body);
  if (updates.addLabels) args.push("--add-label", updates.addLabels.join(","));
  if (updates.removeLabels)
    args.push("--remove-label", updates.removeLabels.join(","));

  await execa("gh", args, { cwd });
}
