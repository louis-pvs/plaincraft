/**
 * project-helpers.mjs
 * @since 2025-11-02
 * Additional project integration helpers
 */

import path from "node:path";
import { readFile } from "node:fs/promises";
import { execa } from "execa";
import { graphqlRequest } from "./github.mjs";
import { repoRoot } from "./core.mjs";

/**
 * Get issue node ID from issue number
 * @param {number} issueNumber - Issue number
 * @param {string} [cwd] - Working directory
 * @returns {Promise<string>} Issue node ID
 */
export async function getIssueNodeId(issueNumber, cwd = process.cwd()) {
  const { stdout } = await execa(
    "gh",
    ["issue", "view", String(issueNumber), "--json", "id"],
    { cwd },
  );
  const data = JSON.parse(stdout);
  return data.id;
}

/**
 * Add an issue or PR to a GitHub Project
 * @param {object} options
 * @param {string} options.projectId - Project node ID
 * @param {string} options.contentId - Issue or PR node ID
 * @param {string} [options.cwd] - Working directory
 * @returns {Promise<{itemId: string}>}
 */
export async function addIssueToProject(options) {
  const { projectId, contentId, cwd = process.cwd() } = options;

  const mutation = `
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {
        projectId: $projectId
        contentId: $contentId
      }) {
        item {
          id
        }
      }
    }
  `;

  const result = await graphqlRequest(mutation, { projectId, contentId }, cwd);

  return {
    itemId: result.data.addProjectV2ItemById.item.id,
  };
}

/**
 * Add issue to project by issue number
 * @param {object} options
 * @param {number} options.issueNumber - Issue number
 * @param {string} options.projectId - Project node ID
 * @param {string} [options.cwd] - Working directory
 * @returns {Promise<{itemId: string, issueNodeId: string}>}
 */
export async function addIssueByNumber(options) {
  const { issueNumber, projectId, cwd = process.cwd() } = options;

  // Get issue node ID
  const issueNodeId = await getIssueNodeId(issueNumber, cwd);

  // Add to project
  const { itemId } = await addIssueToProject({
    projectId,
    contentId: issueNodeId,
    cwd,
  });

  return { itemId, issueNodeId };
}

/**
 * Load project cache from .repo/projects.json
 * @param {object} [options]
 * @param {string} [options.cwd] - Working directory
 * @returns {Promise<{cache: object, path: string, root: string}>}
 */
export async function loadProjectCache(options = {}) {
  const root = await repoRoot(options.cwd);
  const cachePath = path.join(root, ".repo", "projects.json");
  const contents = await readFile(cachePath, "utf-8");
  return { cache: JSON.parse(contents), path: cachePath, root };
}

/**
 * Map field values from GraphQL response nodes
 * @private
 */
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
 * @param {number} [options.retries] - Number of retries for eventual consistency (default: 3)
 * @param {number} [options.retryDelay] - Initial retry delay in ms (default: 1000)
 * @returns {Promise<{item: object, fields: Map<string, object>}|null>}
 */
export async function findProjectItemByFieldValue(options) {
  const {
    projectId,
    fieldId,
    value,
    cwd,
    retries = 3,
    retryDelay = 1000,
  } = options;
  if (!projectId || !fieldId) {
    throw new Error("projectId and fieldId required to locate project item");
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await findProjectItemByFieldValueOnce({
        projectId,
        fieldId,
        value,
        cwd,
      });
      if (result) return result;

      // Item not found, retry if attempts remain
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}

/**
 * Find a project item (single attempt, no retry)
 * @private
 */
async function findProjectItemByFieldValueOnce(options) {
  const { projectId, fieldId, value, cwd } = options;
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
                    field { 
                      ... on ProjectV2Field { id name }
                      ... on ProjectV2SingleSelectField { id name }
                      ... on ProjectV2IterationField { id name }
                    }
                  }
                  ... on ProjectV2ItemFieldNumberValue { 
                    number 
                    field { 
                      ... on ProjectV2Field { id name }
                      ... on ProjectV2SingleSelectField { id name }
                      ... on ProjectV2IterationField { id name }
                    }
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue { 
                    name 
                    optionId 
                    field { 
                      ... on ProjectV2Field { id name }
                      ... on ProjectV2SingleSelectField { id name }
                      ... on ProjectV2IterationField { id name }
                    }
                  }
                  ... on ProjectV2ItemFieldDateValue { 
                    date 
                    field { 
                      ... on ProjectV2Field { id name }
                      ... on ProjectV2SingleSelectField { id name }
                      ... on ProjectV2IterationField { id name }
                    }
                  }
                  ... on ProjectV2ItemFieldIterationValue { 
                    title 
                    field { 
                      ... on ProjectV2Field { id name }
                      ... on ProjectV2SingleSelectField { id name }
                      ... on ProjectV2IterationField { id name }
                    }
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
 * Ensure project status matches desired value for an item by ID
 * @param {object} options
 * @param {string} options.id - Lifecycle identifier (e.g. ARCH-123)
 * @param {string} options.status - Desired status value
 * @param {object|null} [options.cacheInfo] - Result from loadProjectCache
 * @param {string} [options.cwd] - Working directory
 * @param {object|null} [options.itemOverride] - Pre-fetched project item (optional)
 * @param {Function} [options.updateFn] - Custom updater function (primarily for testing)
 * @returns {Promise<{updated: boolean, previous: string|null, message: string}>}
 */
export async function ensureProjectStatus({
  id,
  status,
  cacheInfo = null,
  cwd = process.cwd(),
  itemOverride = null,
  updateFn = updateProjectSingleSelectField,
}) {
  try {
    const info = cacheInfo ?? (await loadProjectCache({ cwd }));
    const project = info.cache.project;
    const statusField = project.fields?.Status;
    const idField = project.fields?.ID;

    if (!statusField?.id || !idField?.id) {
      return {
        updated: false,
        previous: null,
        message:
          "Project cache missing ID or Status field metadata. Run: node scripts/ops/refresh-project-cache.mjs",
      };
    }

    const option = (statusField.options || []).find(
      (candidate) => candidate.name === status,
    );
    if (!option) {
      const availableOptions = (statusField.options || [])
        .map((o) => o.name)
        .join(", ");
      return {
        updated: false,
        previous: null,
        message: `Status option "${status}" not found in project cache. Available: [${availableOptions}]. Add via GitHub Project web UI, then run: node scripts/ops/refresh-project-cache.mjs`,
      };
    }

    const item =
      itemOverride ??
      (await findProjectItemByFieldValue({
        projectId: project.id,
        fieldId: idField.id,
        value: id,
        cwd,
      }));

    if (!item) {
      return {
        updated: false,
        previous: null,
        message: `Project item for ${id} not found. Ensure the issue/PR is added to the project, or use: node scripts/_lib/project-helpers.mjs (addIssueByNumber)`,
      };
    }

    const currentValue = item.fields.get(statusField.id)?.value || null;
    if (currentValue === status) {
      return {
        updated: false,
        previous: currentValue,
        message: `Project status already ${status}.`,
      };
    }

    await updateFn({
      projectId: project.id,
      itemId: item.item.id,
      fieldId: statusField.id,
      optionId: option.id,
      cwd,
    });

    return {
      updated: true,
      previous: currentValue,
      message: `Project status updated to ${status}.`,
    };
  } catch (error) {
    const errMsg = error?.message || String(error);
    let remediation = "";

    if (errMsg.includes("INSUFFICIENT_SCOPES") || errMsg.includes("scope")) {
      remediation =
        " Check token scopes with: gh auth status. Refresh with: gh auth refresh -s read:project -s project";
    } else if (errMsg.includes("NOT_FOUND")) {
      remediation =
        " Verify project exists and is accessible. Run: node scripts/ops/refresh-project-cache.mjs";
    }

    return {
      updated: false,
      previous: null,
      message: errMsg + remediation,
    };
  }
}
