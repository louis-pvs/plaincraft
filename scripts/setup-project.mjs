#!/usr/bin/env node

/**
 * GitHub Project Setup Script
 *
 * Creates and configures GitHub Projects (v2) for the Plaincraft Roadmap.
 * Sets up views, fields, and automation according to ROADMAP-GUIDE.md.
 *
 * Usage:
 *   node scripts/setup-project.mjs
 *   node scripts/setup-project.mjs --project-name "Plaincraft Roadmap"
 *   node scripts/setup-project.mjs --dry-run
 *
 * Requires:
 *   - GitHub CLI authenticated with project permissions
 *   - GraphQL API access for Projects v2
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";

const execAsync = promisify(exec);

/**
 * Check if gh CLI is installed and authenticated
 */
async function checkGhCli() {
  try {
    await execAsync("gh --version");
  } catch {
    console.error("❌ GitHub CLI not installed. Run: brew install gh");
    process.exit(1);
  }

  try {
    await execAsync("gh auth status");
  } catch {
    console.error("❌ GitHub CLI not authenticated. Run: gh auth login");
    process.exit(1);
  }

  // Check for project permissions
  try {
    await execAsync("gh api graphql -f query='{ viewer { login } }'");
  } catch {
    console.error(
      "❌ GitHub CLI needs GraphQL permissions. Run: gh auth refresh -s project",
    );
    process.exit(1);
  }
}

/**
 * Get repository owner and name
 */
async function getRepoInfo() {
  try {
    const { stdout } = await execAsync(
      "gh repo view --json owner,name -q '{owner: .owner.login, name: .name}'",
    );
    return JSON.parse(stdout);
  } catch (error) {
    console.error("❌ Failed to get repository info:", error.message);
    throw error;
  }
}

/**
 * Create GitHub Project
 */
async function createProject(owner, projectName, dryRun = false) {
  if (dryRun) {
    console.log(`[DRY RUN] Would create project: ${projectName}`);
    return { id: "DRY_RUN_PROJECT_ID", number: 1 };
  }

  try {
    // Create project using GraphQL API
    const mutation = `
      mutation {
        createProjectV2(input: {
          ownerId: "${await getOwnerId(owner)}",
          title: "${projectName}"
        }) {
          projectV2 {
            id
            number
            title
          }
        }
      }
    `;

    const { stdout } = await execAsync(
      `gh api graphql -f query='${mutation.replace(/\n/g, " ")}'`,
    );
    const result = JSON.parse(stdout);
    const project = result.data.createProjectV2.projectV2;

    console.log(`✅ Created project: ${project.title} (#${project.number})`);
    return project;
  } catch (error) {
    console.error("❌ Failed to create project:", error.message);
    throw error;
  }
}

/**
 * Get owner ID (organization or user)
 */
async function getOwnerId(owner) {
  try {
    const query = `
      query {
        repositoryOwner(login: "${owner}") {
          id
        }
      }
    `;

    const { stdout } = await execAsync(
      `gh api graphql -f query='${query.replace(/\n/g, " ")}'`,
    );
    const result = JSON.parse(stdout);
    return result.data.repositoryOwner.id;
  } catch (error) {
    console.error("❌ Failed to get owner ID:", error.message);
    throw error;
  }
}

/**
 * Create project fields
 */
async function createProjectFields(projectId, dryRun = false) {
  const fields = [
    {
      name: "ID",
      dataType: "TEXT",
      description: "Ticket ID (U-..., C-..., B-..., etc.)",
    },
    {
      name: "Lane",
      dataType: "SINGLE_SELECT",
      description: "Development lane (A, B, C, D)",
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
      description: "Acceptance checklist from issue",
    },
    {
      name: "Units",
      dataType: "TEXT",
      description: "List of unit dependencies (for compositions)",
    },
    {
      name: "Metric",
      dataType: "TEXT",
      description: "Success metric hypothesis",
    },
  ];

  if (dryRun) {
    console.log(`[DRY RUN] Would create ${fields.length} fields`);
    fields.forEach((f) => console.log(`  - ${f.name} (${f.dataType})`));
    return;
  }

  console.log("\nCreating project fields...");

  for (const field of fields) {
    try {
      if (field.dataType === "SINGLE_SELECT") {
        // Create single select field with options
        const optionsJson = JSON.stringify(field.options);
        const mutation = `
          mutation {
            createProjectV2Field(input: {
              projectId: "${projectId}",
              dataType: ${field.dataType},
              name: "${field.name}",
              singleSelectOptions: ${optionsJson}
            }) {
              projectV2Field {
                id
                name
              }
            }
          }
        `;

        await execAsync(
          `gh api graphql -f query='${mutation.replace(/\n/g, " ")}'`,
        );
      } else {
        // Create text field
        const mutation = `
          mutation {
            createProjectV2Field(input: {
              projectId: "${projectId}",
              dataType: ${field.dataType},
              name: "${field.name}"
            }) {
              projectV2Field {
                id
                name
              }
            }
          }
        `;

        const query = mutation.replace(/\n/g, " ");
        await execAsync(`gh api graphql -f query='${query}'`);
      }

      console.log(`  ✓ Created field: ${field.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to create field ${field.name}:`, error.message);
    }
  }
}

/**
 * Update pipeline config with project info
 */
async function updatePipelineConfig(projectId, projectNumber, dryRun = false) {
  const configPath = ".github/pipeline-config.json";

  if (dryRun) {
    console.log(`[DRY RUN] Would update ${configPath} with project info`);
    return;
  }

  try {
    let config = {};
    try {
      const content = await readFile(configPath, "utf-8");
      config = JSON.parse(content);
    } catch {
      // File doesn't exist, create new
    }

    config.project = {
      id: projectId,
      number: projectNumber,
      name: "Plaincraft Roadmap",
      updated: new Date().toISOString(),
    };

    await writeFile(configPath, JSON.stringify(config, null, 2) + "\n");
    console.log(`\n✅ Updated ${configPath} with project info`);
  } catch (error) {
    console.error("❌ Failed to update pipeline config:", error.message);
    throw error;
  }
}

/**
 * Display setup instructions
 */
function displayInstructions(projectNumber) {
  console.log(`
📋 Manual Setup Required:

The project has been created, but some steps require manual configuration:

1. **Create Views:**
   - Go to: https://github.com/orgs/YOUR_ORG/projects/${projectNumber}
   - Create 4 views: "Lane A", "Lane B", "Lane C", "Lane D"
   - Filter each by label (lane:A, lane:B, lane:C, lane:D)
   - Set WIP limit to 3 for each view

2. **Configure Automation:**
   - Open Project Settings → Workflows
   - Add rule: "Item added → Set Lane based on label"
   - Add rule: "Item added → Comment about PR requirements"

3. **Test the Setup:**
   - Create a test issue with lane:A label
   - Verify it appears in the project
   - Check that Lane field is set automatically

4. **Update Issue Templates:**
   - Ensure .github/ISSUE_TEMPLATE/*.yml reference the project

See guides/ROADMAP-GUIDE.md for detailed instructions.
`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const options = {
    projectName: "Plaincraft Roadmap",
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--project-name":
      case "-n":
        options.projectName = next;
        i++;
        break;
      case "--dry-run":
      case "-d":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        console.log(`
GitHub Project Setup Script

Usage:
  node scripts/setup-project.mjs [options]

Options:
  --project-name, -n <name>  Project name (default: "Plaincraft Roadmap")
  --dry-run, -d             Show what would be created without creating
  --help, -h                Show this help

Examples:
  # Create default project
  node scripts/setup-project.mjs

  # Custom project name
  node scripts/setup-project.mjs --project-name "My Roadmap"

  # Preview without creating
  node scripts/setup-project.mjs --dry-run
`);
        process.exit(0);
    }
  }

  return options;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();

  console.log("🚀 GitHub Project Setup\n");

  if (!options.dryRun) {
    await checkGhCli();
  }

  // Get repository info
  const repo = options.dryRun
    ? { owner: "YOUR_ORG", name: "YOUR_REPO" }
    : await getRepoInfo();

  console.log(`Repository: ${repo.owner}/${repo.name}`);
  console.log(`Project: ${options.projectName}\n`);

  // Create project
  const project = await createProject(
    repo.owner,
    options.projectName,
    options.dryRun,
  );

  // Create fields
  await createProjectFields(project.id, options.dryRun);

  // Update config
  await updatePipelineConfig(project.id, project.number, options.dryRun);

  if (!options.dryRun) {
    displayInstructions(project.number);
  }

  console.log("\n✅ Project setup complete!");
  console.log(`\nNext steps:`);
  console.log(`  1. Follow manual setup instructions above`);
  console.log(`  2. Run: pnpm gh:setup-labels (if not done)`);
  console.log(`  3. Test with a new issue`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
