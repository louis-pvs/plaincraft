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
 * Get repository owner/name from gh context
 * @param {string} cwd - Working directory
 * @returns {Promise<{owner: string, name: string}>}
 */
export async function getRepoInfo(cwd = process.cwd()) {
  const { stdout } = await execa(
    "gh",
    ["repo", "view", "--json", "name,owner"],
    { cwd },
  );
  const data = JSON.parse(stdout);
  return {
    owner: data.owner?.login || data.owner?.name || data.owner,
    name: data.name,
  };
}

/**
 * Execute a GitHub GraphQL query via gh api
 * @param {string} query - GraphQL query string
 * @param {object} variables - Variables map
 * @param {string} cwd - Working directory
 * @returns {Promise<object>} GraphQL response JSON
 */
export async function graphqlRequest(
  query,
  variables = {},
  cwd = process.cwd(),
) {
  const args = [
    "api",
    "graphql",
    "-f",
    `query=${query.replace(/\s+/g, " ").trim()}`,
  ];

  for (const [key, value] of Object.entries(variables)) {
    if (value === undefined || value === null) continue;
    args.push("-F", `${key}=${value}`);
  }

  const { stdout } = await execa("gh", args, { cwd });
  return JSON.parse(stdout);
}

function mapFieldValues(nodes) {
  const map = new Map();
  for (const node of nodes || []) {
    const fieldId = node?.field?.id;
    if (!fieldId) continue;
    map.set(fieldId, {
      id: fieldId,
      name: node.field.name,
      type: node.__typename,
      value:
        node.__typename === "ProjectV2ItemFieldSingleSelectValue"
          ? node.name
          : node.__typename === "ProjectV2ItemFieldTextValue"
            ? node.text
            : node.__typename === "ProjectV2ItemFieldNumberValue"
              ? node.number
              : node.__typename === "ProjectV2ItemFieldDateValue"
                ? node.date
                : node.__typename === "ProjectV2ItemFieldIterationValue"
                  ? node.title
                  : null,
      optionId:
        node.__typename === "ProjectV2ItemFieldSingleSelectValue"
          ? node.optionId
          : null,
    });
  }
  return map;
}

/**
 * Find a project item whose text field matches a value
 * @param {object} options
 * @param {string} options.projectId - Project node ID
 * @param {string} options.fieldId - Field ID containing the lookup value
 * @param {string} options.value - Value to match exactly
 * @param {string} [options.cwd] - Working directory
 * @returns {Promise<{item: object, fields: Map<string, object>}|null>}
 */
export async function findProjectItemByFieldValue(options) {
  const { projectId, fieldId, value, cwd } = options;
  if (!projectId || !fieldId) {
    throw new Error("projectId and fieldId required to locate project item");
  }
  let cursor = null;

  const query = `
    query($projectId: ID!, $after: String) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 50, after: $after) {
            nodes {
              id
              content {
                __typename
                ... on Issue { number title }
                ... on PullRequest { number title }
              }
              fieldValues(first: 50) {
                nodes {
                  __typename
                  ... on ProjectV2ItemFieldTextValue { 
                    text 
                    field { id name }
                  }
                  ... on ProjectV2ItemFieldNumberValue { 
                    number 
                    field { id name }
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue { 
                    name 
                    optionId 
                    field { id name }
                  }
                  ... on ProjectV2ItemFieldDateValue { 
                    date 
                    field { id name }
                  }
                  ... on ProjectV2ItemFieldIterationValue { 
                    title 
                    field { id name }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  `;

  while (true) {
    const variables = { projectId, after: cursor ?? "" };
    const response = await graphqlRequest(query, variables, cwd);
    const project = response?.data?.node;
    if (!project) {
      return null;
    }

    const items = project.items?.nodes || [];
    for (const item of items) {
      const fieldMap = mapFieldValues(item.fieldValues?.nodes || []);
      const match = fieldMap.get(fieldId);
      if (!match) continue;
      if (String(match.value).trim() === String(value).trim()) {
        return { item, fields: fieldMap };
      }
    }

    const pageInfo = project.items?.pageInfo;
    if (!pageInfo?.hasNextPage) {
      break;
    }
    cursor = pageInfo.endCursor;
  }

  return null;
}

/**
 * Update a single-select project field value
 * @param {object} options
 * @param {string} options.projectId - Project node ID
 * @param {string} options.itemId - Item node ID
 * @param {string} options.fieldId - Field ID to update
 * @param {string} options.optionId - Target single-select option ID
 * @param {string} [options.cwd] - Working directory
 * @returns {Promise<void>}
 */
export async function updateProjectSingleSelectField(options) {
  const { projectId, itemId, fieldId, optionId, cwd } = options;
  const mutation = `
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { singleSelectOptionId: $optionId }
        }
      ) {
        projectV2Item { id }
      }
    }
  `;

  await graphqlRequest(mutation, { projectId, itemId, fieldId, optionId }, cwd);
}

/**
 * Convert PR to draft state
 * @param {object} params
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.pullNumber - Pull request number
 * @param {string} [params.cwd]
 * @returns {Promise<void>}
 */
export async function convertPrToDraft({ owner, repo, pullNumber, cwd }) {
  await execa(
    "gh",
    [
      "api",
      `repos/${owner}/${repo}/pulls/${pullNumber}/convert_to_draft`,
      "--method",
      "POST",
    ],
    { cwd },
  );
}

/**
 * Mark PR ready for review
 * @param {object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {number} params.pullNumber
 * @param {string} [params.cwd]
 * @returns {Promise<void>}
 */
export async function markPrReadyForReview({ owner, repo, pullNumber, cwd }) {
  await execa(
    "gh",
    [
      "api",
      `repos/${owner}/${repo}/pulls/${pullNumber}/ready_for_review`,
      "--method",
      "POST",
    ],
    { cwd },
  );
}

/**
 * Find PR by head branch
 * @param {string} branch - Branch name
 * @param {string} [cwd]
 * @returns {Promise<object|null>}
 */
export async function findPullRequestByBranch(branch, cwd = process.cwd()) {
  const { stdout } = await execa(
    "gh",
    [
      "pr",
      "list",
      "--state",
      "all",
      "--head",
      branch,
      "--json",
      "number,title,body,isDraft,state,headRefName,baseRefName,labels,url",
    ],
    { cwd },
  );
  const prs = JSON.parse(stdout);
  return prs[0] || null;
}

/**
 * Update PR labels to match desired set
 * @param {number} prNumber - Pull request number
 * @param {string[]} labels - Desired labels
 * @param {string} cwd - Working directory
 * @returns {Promise<void>}
 */
export async function syncPullRequestLabels(
  prNumber,
  labels,
  cwd = process.cwd(),
  options = {},
) {
  const { mode = "replace" } = options;
  const current = await getPR(prNumber, cwd);
  const currentNames = new Set(
    (current.labels || []).map((label) => label.name),
  );
  const desiredSet = new Set(labels);

  const toAdd = labels.filter((label) => !currentNames.has(label));
  const toRemove =
    mode === "replace"
      ? [...currentNames].filter((label) => !desiredSet.has(label))
      : [];

  if (toAdd.length === 0 && toRemove.length === 0) {
    return;
  }

  const args = ["pr", "edit", String(prNumber)];
  for (const label of toAdd) {
    args.push("--add-label", label);
  }
  for (const label of toRemove) {
    args.push("--remove-label", label);
  }

  await execa("gh", args, { cwd });
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
      "number,title,body,state,labels,url,mergedAt,mergedBy",
    ],
    { cwd },
  );
  const pr = JSON.parse(stdout);
  // Add merged flag based on mergedAt presence
  pr.merged = Boolean(pr.mergedAt);
  return pr;
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

  if (updates.bodyFile) {
    args.push("--body-file", updates.bodyFile);
  } else if (updates.body) {
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
