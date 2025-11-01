#!/usr/bin/env node
/**
 * refresh-project-cache.mjs
 * @since 2025-11-02
 * @version 0.1.0
 * Refresh GitHub Project metadata cache
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { parseFlags, fail, succeed, repoRoot, now } from "../_lib/core.mjs";
import { graphqlRequest } from "../_lib/github.mjs";

const FLAG_SCHEMA = z.object({
  help: z.boolean().default(false),
  output: z.string().optional(),
  logLevel: z.string().optional(),
  cwd: z.string().optional(),
  projectNumber: z.number().optional().default(1),
});

(async () => {
  try {
    const rawFlags = parseFlags(process.argv.slice(2));
    if (rawFlags.help) {
      console.log(`
Usage: node scripts/ops/refresh-project-cache.mjs [options]

Fetches latest GitHub Project metadata and updates .repo/projects.json cache.

Options:
  --project-number <n>  Project number to fetch (default: 1)
  --output <format>     Output format: text|json (default: text)
  --log-level <lvl>     Logging level (default: info)
  --cwd <path>          Working directory

Examples:
  node scripts/ops/refresh-project-cache.mjs
  node scripts/ops/refresh-project-cache.mjs --project-number=1
`);
      process.exit(0);
    }

    const flags = FLAG_SCHEMA.parse(rawFlags);
    const root = await repoRoot(flags.cwd);

    console.log(`[INFO] Fetching project #${flags.projectNumber} metadata...`);

    // Get current user
    const userQuery = `query { viewer { login } }`;
    const userData = await graphqlRequest(userQuery, {}, flags.cwd);
    const username = userData.viewer.login;

    // Fetch project metadata
    const projectQuery = `
      query($login: String!, $number: Int!) {
        user(login: $login) {
          projectV2(number: $number) {
            id
            number
            title
            url
            fields(first: 50) {
              nodes {
                __typename
                ... on ProjectV2Field {
                  id
                  name
                  dataType
                }
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  dataType
                  options {
                    id
                    name
                    color
                  }
                }
                ... on ProjectV2IterationField {
                  id
                  name
                  dataType
                  configuration {
                    iterations {
                      id
                      title
                      startDate
                      duration
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await graphqlRequest(
      projectQuery,
      { login: username, number: flags.projectNumber },
      flags.cwd,
    );

    if (!result.user?.projectV2) {
      return fail(
        `Project #${flags.projectNumber} not found for user ${username}`,
      );
    }

    const project = result.user.projectV2;

    // Transform to cache format
    const fields = {};
    for (const field of project.fields.nodes) {
      const fieldData = {
        id: field.id,
        type:
          field.dataType ||
          field.__typename
            .replace("ProjectV2", "")
            .replace("Field", "")
            .toUpperCase(),
      };

      if (field.__typename === "ProjectV2SingleSelectField" && field.options) {
        fieldData.options = field.options.map((opt) => ({
          id: opt.id,
          name: opt.name,
          ...(opt.color && { color: opt.color }),
        }));
        fieldData.required = true;
      }

      if (field.__typename === "ProjectV2Field") {
        fieldData.description = field.name;
        fieldData.required = [
          "ID",
          "Type",
          "Lane",
          "Status",
          "Owner",
          "Priority",
        ].includes(field.name);
      }

      fields[field.name] = fieldData;
    }

    const cache = {
      cachedAt: now(),
      version: 3,
      project: {
        id: project.id,
        number: project.number,
        name: project.title,
        url: project.url,
        fields,
      },
    };

    // Write cache
    const cachePath = path.join(root, ".repo", "projects.json");
    await writeFile(cachePath, JSON.stringify(cache, null, 2) + "\n", "utf-8");

    console.log(`[INFO] Cache updated: ${cachePath}`);
    console.log(`[INFO] Project: ${project.title}`);
    console.log(`[INFO] Fields: ${Object.keys(fields).join(", ")}`);

    if (fields.Status?.options) {
      console.log(
        `[INFO] Status options: ${fields.Status.options.map((o) => o.name).join(", ")}`,
      );
    }

    return succeed("Project cache refreshed successfully", {
      cachePath,
      project: {
        id: project.id,
        name: project.title,
        fieldCount: Object.keys(fields).length,
        statusOptions: fields.Status?.options?.length || 0,
      },
    });
  } catch (error) {
    return fail(error?.message || String(error));
  }
})();
