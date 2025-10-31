/**
 * lifecycle.mjs
 * @since 2025-11-03
 * @version 0.1.0
 * Shared loader for Scripts-First lifecycle configuration
 */

import path from "node:path";
import { z } from "zod";
import { repoRoot, readJSON } from "./core.mjs";

export const LifecycleConfigSchema = z.object({
  version: z.string().min(1),
  project: z.object({
    id: z.union([z.string().min(1), z.number()]),
    fields: z.object({
      id: z.string().min(1),
      type: z.string().min(1),
      lane: z.string().min(1),
      status: z.string().min(1),
      owner: z.string().min(1),
      priority: z.string().min(1),
      release: z.string().min(1),
    }),
    statuses: z.array(z.string().min(1)).nonempty(),
    types: z.array(z.string().min(1)).nonempty(),
    lanes: z.array(z.string().min(1)).nonempty(),
    priorities: z.array(z.string().min(1)).nonempty(),
  }),
  branches: z.object({
    allowedPrefixes: z.array(z.string().regex(/^[a-z0-9-]+$/)).nonempty(),
    pattern: z.string().min(1),
  }),
  commits: z.object({
    pattern: z.string().min(1),
  }),
  pullRequests: z.object({
    titlePattern: z.string().min(1),
  }),
  ideas: z.object({
    directory: z.string().min(1),
    requiredFields: z.array(z.string().min(1)).nonempty(),
  }),
});

let cachedConfig = null;
let cachedKey = null;

/**
 * Load and validate lifecycle configuration.
 * Returns normalized structure with compiled regular expressions and lookup sets.
 * @param {object} [options]
 * @param {string} [options.cwd] - Working directory to resolve repo root
 * @param {boolean} [options.forceReload] - Force reload ignoring cache
 * @returns {Promise<object>} Normalized lifecycle configuration
 */
export async function loadLifecycleConfig(options = {}) {
  const { cwd, forceReload = false } = options;
  const root = await repoRoot(cwd);
  const configPath = path.join(root, "scripts", "config", "lifecycle.json");

  if (!forceReload && cachedConfig && cachedKey === configPath) {
    return cachedConfig;
  }

  const rawConfig = await readJSON(configPath);
  const parsed = LifecycleConfigSchema.parse(rawConfig);

  let branchRegex;
  let commitRegex;
  let prRegex;

  try {
    branchRegex = new RegExp(parsed.branches.pattern);
  } catch (error) {
    throw new Error(
      `Invalid branch pattern in lifecycle config: ${error.message}`,
    );
  }

  try {
    commitRegex = new RegExp(parsed.commits.pattern);
  } catch (error) {
    throw new Error(
      `Invalid commit pattern in lifecycle config: ${error.message}`,
    );
  }

  try {
    prRegex = new RegExp(parsed.pullRequests.titlePattern);
  } catch (error) {
    throw new Error(
      `Invalid pull request title pattern in lifecycle config: ${error.message}`,
    );
  }

  const normalized = Object.freeze({
    version: parsed.version,
    project: {
      id: String(parsed.project.id),
      fields: parsed.project.fields,
      statuses: parsed.project.statuses,
      types: parsed.project.types,
      lanes: parsed.project.lanes,
      priorities: parsed.project.priorities,
      statusSet: new Set(parsed.project.statuses),
      typeSet: new Set(parsed.project.types),
      laneSet: new Set(parsed.project.lanes),
      prioritySet: new Set(parsed.project.priorities),
    },
    branches: {
      allowedPrefixes: parsed.branches.allowedPrefixes,
      pattern: parsed.branches.pattern,
      regex: branchRegex,
      prefixSet: new Set(parsed.branches.allowedPrefixes),
    },
    commits: {
      pattern: parsed.commits.pattern,
      regex: commitRegex,
    },
    pullRequests: {
      titlePattern: parsed.pullRequests.titlePattern,
      regex: prRegex,
    },
    ideas: {
      directory: parsed.ideas.directory,
      requiredFields: parsed.ideas.requiredFields,
      requiredFieldSet: new Set(parsed.ideas.requiredFields),
    },
    paths: {
      root,
      configPath,
    },
  });

  cachedConfig = normalized;
  cachedKey = configPath;
  return cachedConfig;
}

/**
 * Clear cached lifecycle configuration (for testing)
 */
export function clearLifecycleConfigCache() {
  cachedConfig = null;
  cachedKey = null;
}
