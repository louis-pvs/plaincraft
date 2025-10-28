#!/usr/bin/env node
/**
 * setup-project.mjs
 * @since 2025-10-28
 * @version 1.0.0
 * Summary: Create and configure the Plaincraft Roadmap GitHub Project (v2).
 */

import path from "node:path";
import { z } from "zod";
import { execa } from "execa";
import {
  parseFlags,
  Logger,
  repoRoot,
  fail,
  succeed,
  generateRunId,
  readJSON,
  writeJSON,
} from "../_lib/core.mjs";

const SCRIPT_NAME = "setup-project";
const start = Date.now();
const rawArgs = parseFlags(process.argv.slice(2));

if (rawArgs.help) {
  printHelp();
  process.exit(0);
}

const ArgsSchema = z.object({
  projectName: z.string().default("Plaincraft Roadmap"),
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  cwd: z.string().min(1),
});

const argsForValidation = {
  projectName: rawArgs["project-name"] || rawArgs.projectName,
  dryRun: coerceBoolean(rawArgs.dryRun, true),
  yes: coerceBoolean(rawArgs.yes, false),
  output: rawArgs.output,
  logLevel: rawArgs.logLevel,
  cwd: rawArgs.cwd || process.cwd(),
};

const parsed = ArgsSchema.safeParse(argsForValidation);
if (!parsed.success) {
  fail({
    exitCode: 11,
    message: "validation_error",
    error: parsed.error.format(),
    output: rawArgs.output || "text",
    script: SCRIPT_NAME,
  });
}

const args = parsed.data;
const logger = new Logger(args.logLevel);
const runId = generateRunId();

async function main() {
  const root = await repoRoot(args.cwd);
  const projectName = args.projectName;
  const dryRun = args.dryRun && !args.yes;

  logger.info("🚀 Plaincraft GitHub Project setup");
  logger.info(dryRun ? "[DRY-RUN] Preview mode" : "Executing setup");

  if (!dryRun) {
    await ensureGhReady(root);
  }

  const repoInfo = await resolveRepoInfo(root, dryRun);
  logger.info(`Repository: ${repoInfo.owner}/${repoInfo.name}`);
  logger.info(`Project name: ${projectName}`);

  const projectInfo = await createProject(
    repoInfo.owner,
    projectName,
    dryRun,
    root,
  );
  await createFields(projectInfo.id, dryRun, root);
  await updatePipelineConfig(root, projectInfo, dryRun);

  logger.info(buildManualInstructions(projectInfo.number));

  succeed({
    output: args.output,
    script: SCRIPT_NAME,
    runId,
    dryRun,
    project: projectInfo,
    repository: repoInfo,
    durationMs: Date.now() - start,
  });
}

main().catch((error) => {
  fail({
    exitCode: 13,
    message: "unexpected_error",
    error: error instanceof Error ? error.message : String(error),
    output: args.output,
    script: SCRIPT_NAME,
  });
});

async function ensureGhReady(cwd) {
  try {
    await execa("gh", ["--version"], { cwd });
  } catch {
    throw new Error(
      "GitHub CLI not installed. Install via https://cli.github.com/",
    );
  }

  try {
    await execa("gh", ["auth", "status"], { cwd });
  } catch {
    throw new Error("GitHub CLI not authenticated. Run: gh auth login");
  }

  try {
    await execa("gh", ["api", "graphql", "-f", "query={ viewer { login } }"], {
      cwd,
    });
  } catch {
    throw new Error(
      "GitHub CLI requires project GraphQL scope. Run: gh auth refresh -s project",
    );
  }
}

async function resolveRepoInfo(cwd, dryRun) {
  if (dryRun) {
    try {
      const { stdout } = await execa(
        "gh",
        [
          "repo",
          "view",
          "--json",
          "owner,name",
          "-q",
          "{owner: .owner.login, name: .name}",
        ],
        { cwd },
      );
      return JSON.parse(stdout);
    } catch {
      return { owner: "preview", name: "preview" };
    }
  }

  const { stdout } = await execa(
    "gh",
    [
      "repo",
      "view",
      "--json",
      "owner,name",
      "-q",
      "{owner: .owner.login, name: .name}",
    ],
    { cwd },
  );
  return JSON.parse(stdout);
}

async function createProject(owner, projectName, dryRun, cwd) {
  if (dryRun) {
    return {
      id: "dry-run-project-id",
      number: 0,
      title: projectName,
    };
  }

  const ownerId = await getOwnerId(owner, cwd);
  const mutation =
    "mutation ($ownerId: ID!, $title: String!) { createProjectV2(input: { ownerId: $ownerId, title: $title }) { projectV2 { id number title } } }";
  const data = await graphql(mutation, { ownerId, title: projectName }, cwd);
  const project = data.data?.createProjectV2?.projectV2;
  if (!project) {
    throw new Error("Failed to create project (no response payload).");
  }

  logger.info(`Created project #${project.number}: ${project.title}`);
  return project;
}

async function getOwnerId(owner, cwd) {
  const query =
    "query ($login: String!) { repositoryOwner(login: $login) { id login } }";
  const data = await graphql(query, { login: owner }, cwd);
  const ownerId = data.data?.repositoryOwner?.id;
  if (!ownerId) {
    throw new Error(`Unable to resolve owner id for ${owner}`);
  }
  return ownerId;
}

async function createFields(projectId, dryRun, cwd) {
  const fields = [
    {
      name: "ID",
      dataType: "TEXT",
      description: "Ticket reference (U-*, C-*, B-*, etc.)",
    },
    {
      name: "Lane",
      dataType: "SINGLE_SELECT",
      description: "Delivery lane",
      options: [
        { name: "A", color: "GREEN" },
        { name: "B", color: "BLUE" },
        { name: "C", color: "PURPLE" },
        { name: "D", color: "ORANGE" },
      ],
    },
    {
      name: "Acceptance",
      dataType: "TEXT",
      description: "Acceptance checklist snapshot",
    },
    {
      name: "Units",
      dataType: "TEXT",
      description: "Related units (for compositions)",
    },
    {
      name: "Metric",
      dataType: "TEXT",
      description: "Success metric hypothesis",
    },
  ];

  if (dryRun) {
    logger.info(`[DRY-RUN] Would create ${fields.length} project fields`);
    fields.forEach((field) =>
      logger.info(`  - ${field.name} (${field.dataType})`),
    );
    return;
  }

  for (const field of fields) {
    try {
      const mutation =
        "mutation ($input: CreateProjectV2FieldInput!) { createProjectV2Field(input: $input) { projectV2Field { id name } } }";

      const input = {
        projectId,
        name: field.name,
        dataType: field.dataType,
        description: field.description,
      };

      if (field.dataType === "SINGLE_SELECT") {
        input.singleSelectOptions = field.options;
        delete input.description;
      }

      await graphql(mutation, { input }, cwd);
      logger.info(`Created field: ${field.name}`);
    } catch (error) {
      logger.warn(
        `Failed to create field ${field.name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

async function updatePipelineConfig(root, projectInfo, dryRun) {
  const configPath = path.join(root, ".github", "pipeline-config.json");
  if (dryRun) {
    logger.info(`[DRY-RUN] Would update ${path.relative(root, configPath)}`);
    return;
  }

  let config = {};
  try {
    config = await readJSON(configPath);
  } catch {
    config = {};
  }

  config.project = {
    id: projectInfo.id,
    number: projectInfo.number,
    name: projectInfo.title,
    updated: new Date().toISOString(),
  };

  await writeJSON(configPath, config);
  logger.info(`Updated ${path.relative(root, configPath)} with project info`);
}

function buildManualInstructions(projectNumber) {
  return [
    "",
    "📋 Manual Setup Checklist:",
    "",
    `1. Create lane views at https://github.com/orgs/YOUR_ORG/projects/${projectNumber}`,
    "   - Views: Lane A/B/C/D → filter by label (lane-A, lane-B, lane-C, lane-D)",
    "   - Set WIP limit to 3 for each lane view",
    "2. Configure workflows: Settings → Workflows",
    "   - When item added → set Lane based on label",
    "   - When item added → add PR requirements comment",
    "3. Test automation with a lane-A issue",
    "4. Ensure issue templates reference the project and lane labels",
    "",
  ].join("\n");
}

async function graphql(query, variables = {}, cwd = process.cwd()) {
  const args = ["api", "graphql", "-f", `query=${compress(query)}`];
  if (Object.keys(variables).length > 0) {
    args.push("-f", `variables=${JSON.stringify(variables)}`);
  }

  const { stdout } = await execa("gh", args, { cwd });
  return JSON.parse(stdout);
}

function compress(str) {
  return str.replace(/\s+/g, " ").trim();
}

function coerceBoolean(value, defaultValue) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === "boolean") return value;
  const normalized = String(value).toLowerCase();
  if (["false", "0", "no"].includes(normalized)) return false;
  if (["true", "1", "yes"].includes(normalized)) return true;
  return defaultValue;
}

function printHelp() {
  console.log(`
Create and configure the Plaincraft Roadmap GitHub Project (v2)

Usage:
  node scripts/ops/${SCRIPT_NAME}.mjs [options]

Options:
  --project-name <name>  Project name (default: "Plaincraft Roadmap")
  --yes                  Execute setup (default: dry-run preview)
  --dry-run              Preview actions (default behaviour)
  --output <mode>        Output format: text|json (default: text)
  --log-level <level>    trace|debug|info|warn|error (default: info)
  --cwd <path>           Working directory (default: current)
  --help                 Show this help

Exit codes:
  0  Success
  10 Precondition failed (gh CLI missing/auth)
  11 Validation failed
  13 Unexpected error
`);
}
