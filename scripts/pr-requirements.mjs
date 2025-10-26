#!/usr/bin/env node

/**
 * PR Requirements Automation Script
 *
 * Automates PR-related GitHub operations using `gh` CLI:
 * - Create issues from commit messages/changelog
 * - Apply lane labels to issues/PRs
 * - Link issues to GitHub projects
 * - Generate acceptance checklists
 * - Verify PR requirements (ticket reference, lane labels)
 *
 * Usage:
 *   node scripts/pr-requirements.mjs --create-issue "Title" --lane A --tag U-feature
 *   node scripts/pr-requirements.mjs --verify-pr 123
 *   node scripts/pr-requirements.mjs --link-project 456 --project-id PVT_kwDOA
 *   node scripts/pr-requirements.mjs --check-pr 789
 *
 * Requires:
 *   - GitHub CLI authenticated (`gh auth login`)
 *   - Repo access (`gh repo view`)
 *   - Issues/PR write permissions
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Lane mapping
const LANE_MAP = {
  A: { label: "lane:A", pair: "Pair A - Components", tags: ["U"] },
  B: { label: "lane:B", pair: "Pair B - Documentation", tags: ["B"] },
  C: { label: "lane:C", pair: "Pair C - CI/DevOps", tags: ["C", "ARCH"] },
  D: { label: "lane:D", pair: "Pair D - Project/Playbook", tags: ["D", "PB"] },
};

// Issue type labels
const TYPE_LABELS = {
  unit: "type:unit",
  composition: "type:composition",
  bug: "type:bug",
  architecture: "type:architecture",
};

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
}

/**
 * Detect lane from commit tag
 */
function detectLane(tag) {
  if (!tag) return null;

  const prefix = tag.replace(/^\[/, "").replace(/\].*$/, "").split("-")[0];

  for (const [lane, config] of Object.entries(LANE_MAP)) {
    if (config.tags.includes(prefix)) {
      return lane;
    }
  }

  return null;
}

/**
 * Generate acceptance checklist based on type
 */
function generateChecklist(type) {
  const common = [
    "- [ ] Code follows project conventions",
    "- [ ] Tests added/updated",
    "- [ ] Documentation updated",
    "- [ ] No breaking changes (or documented)",
    "- [ ] Lane label applied",
  ];

  const typeSpecific = {
    unit: [
      "- [ ] Component implements headless pattern",
      "- [ ] View layer separated from controller",
      "- [ ] Storybook stories added",
      "- [ ] Accessibility tested",
      "- [ ] Visual regression baseline updated",
    ],
    composition: [
      "- [ ] Multiple units integrated correctly",
      "- [ ] State management documented",
      "- [ ] Integration tests added",
      "- [ ] Performance implications documented",
    ],
    bug: [
      "- [ ] Root cause identified",
      "- [ ] Fix verified with tests",
      "- [ ] Regression test added",
      "- [ ] Related issues checked",
    ],
    architecture: [
      "- [ ] Architecture decision documented",
      "- [ ] Migration path defined",
      "- [ ] Impact on existing code assessed",
      "- [ ] Rollback plan documented",
    ],
  };

  return [...common, ...(typeSpecific[type] || [])].join("\n");
}

/**
 * Create GitHub issue
 */
async function createIssue(options) {
  const {
    title,
    body,
    lane,
    type = "unit",
    labels = [],
    assignees = [],
  } = options;

  if (!title) {
    throw new Error("Issue title is required");
  }

  const laneConfig = lane ? LANE_MAP[lane] : null;
  const allLabels = [
    ...(laneConfig ? [laneConfig.label] : []),
    ...(type ? [TYPE_LABELS[type] || type] : []),
    ...labels,
  ].filter(Boolean);

  const checklist = generateChecklist(type);
  const issueBody = body
    ? `${body}\n\n## Acceptance Checklist\n\n${checklist}`
    : `## Acceptance Checklist\n\n${checklist}`;

  const labelArgs =
    allLabels.length > 0 ? `--label "${allLabels.join(",")}"` : "";
  const assigneeArgs =
    assignees.length > 0 ? `--assignee "${assignees.join(",")}"` : "";

  try {
    const { stdout } = await execAsync(
      `gh issue create --title "${title}" --body "${issueBody}" ${labelArgs} ${assigneeArgs}`,
    );

    const issueUrl = stdout.trim();
    const issueNumber = issueUrl.split("/").pop();

    console.log(`✅ Issue created: #${issueNumber}`);
    console.log(`   URL: ${issueUrl}`);
    console.log(`   Lane: ${laneConfig?.label || "none"}`);
    console.log(`   Type: ${type}`);

    return { number: issueNumber, url: issueUrl };
  } catch (error) {
    console.error("❌ Failed to create issue:", error.message);
    throw error;
  }
}

/**
 * Link issue to GitHub project
 */
async function linkToProject(issueNumber, projectId) {
  if (!issueNumber || !projectId) {
    throw new Error("Issue number and project ID are required");
  }

  try {
    // Note: This requires project beta API access
    await execAsync(
      `gh project item-add ${projectId} --owner @me --url "$(gh issue view ${issueNumber} --json url -q .url)"`,
    );

    console.log(`✅ Linked issue #${issueNumber} to project ${projectId}`);
  } catch (error) {
    console.error("❌ Failed to link to project:", error.message);
    console.error("   Note: Requires project beta API access");
    throw error;
  }
}

/**
 * Verify PR requirements
 */
async function verifyPr(prNumber) {
  if (!prNumber) {
    throw new Error("PR number is required");
  }

  try {
    const { stdout } = await execAsync(
      `gh pr view ${prNumber} --json body,labels,title,commits`,
    );

    const pr = JSON.parse(stdout);
    const issues = [];

    // Check for issue reference
    const hasIssueRef = /closes\s+#\d+|fixes\s+#\d+|resolves\s+#\d+/i.test(
      pr.body,
    );
    if (!hasIssueRef) {
      issues.push("❌ Missing issue reference (Closes #123)");
    }

    // Check for lane label
    const hasLaneLabel = pr.labels.some((l) => l.name.startsWith("lane:"));
    if (!hasLaneLabel) {
      issues.push("❌ Missing lane label");
    }

    // Check commit tags
    const commits = await getCommits(prNumber);
    const missingTags = commits.filter(
      (c) => !c.messageHeadline.match(/^\[[\w-]+\]/),
    );
    if (missingTags.length > 0) {
      issues.push(`❌ ${missingTags.length} commit(s) missing tag prefix`);
    }

    // Check for acceptance checklist
    const hasChecklist = pr.body.includes("- [ ]") || pr.body.includes("- [x]");
    if (!hasChecklist) {
      issues.push("❌ Missing acceptance checklist");
    }

    if (issues.length === 0) {
      console.log(`✅ PR #${prNumber} meets all requirements`);
      return { passed: true, issues: [] };
    } else {
      console.log(`❌ PR #${prNumber} has ${issues.length} issue(s):\n`);
      issues.forEach((issue) => console.log(`   ${issue}`));
      return { passed: false, issues };
    }
  } catch (error) {
    console.error("❌ Failed to verify PR:", error.message);
    throw error;
  }
}

/**
 * Get commits for a PR
 */
async function getCommits(prNumber) {
  const { stdout } = await execAsync(
    `gh pr view ${prNumber} --json commits -q '.commits[]'`,
  );
  return JSON.parse(`[${stdout.trim().replace(/\n/g, ",")}]`);
}

/**
 * Check PR status (for CI pipeline)
 */
async function checkPr(prNumber) {
  if (!prNumber) {
    // Check current branch's PR
    try {
      const { stdout } = await execAsync("gh pr view --json number -q .number");
      prNumber = stdout.trim();
    } catch {
      console.error("❌ Not on a PR branch");
      process.exit(1);
    }
  }

  const verification = await verifyPr(prNumber);

  if (!verification.passed) {
    console.error("\n❌ PR requirements not met. Cannot merge.");
    process.exit(1);
  }

  console.log("\n✅ PR ready for review");
  process.exit(0);
}

/**
 * Apply lane label to PR
 */
async function applyLaneLabel(prNumber, lane) {
  if (!prNumber || !lane) {
    throw new Error("PR number and lane are required");
  }

  const laneConfig = LANE_MAP[lane];
  if (!laneConfig) {
    throw new Error(`Invalid lane: ${lane}. Must be A, B, C, or D`);
  }

  try {
    await execAsync(`gh pr edit ${prNumber} --add-label "${laneConfig.label}"`);
    console.log(`✅ Applied ${laneConfig.label} to PR #${prNumber}`);
  } catch (error) {
    console.error("❌ Failed to apply label:", error.message);
    throw error;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--create-issue":
        options.action = "create-issue";
        options.title = next;
        i++;
        break;
      case "--lane":
        options.lane = next;
        i++;
        break;
      case "--type":
        options.type = next;
        i++;
        break;
      case "--body":
        options.body = next;
        i++;
        break;
      case "--label":
        options.labels = options.labels || [];
        options.labels.push(next);
        i++;
        break;
      case "--assignee":
        options.assignees = options.assignees || [];
        options.assignees.push(next);
        i++;
        break;
      case "--verify-pr":
        options.action = "verify-pr";
        options.prNumber = next;
        i++;
        break;
      case "--check-pr":
        options.action = "check-pr";
        options.prNumber = next;
        i++;
        break;
      case "--link-project":
        options.action = "link-project";
        options.issueNumber = next;
        i++;
        break;
      case "--project-id":
        options.projectId = next;
        i++;
        break;
      case "--apply-label":
        options.action = "apply-label";
        options.prNumber = next;
        i++;
        break;
      case "--tag":
        options.tag = next;
        options.lane = options.lane || detectLane(next);
        i++;
        break;
      case "--help":
        options.action = "help";
        break;
    }
  }

  return options;
}

/**
 * Display help
 */
function showHelp() {
  console.log(`
PR Requirements Automation Script

Usage:
  # Create issue with lane label
  node scripts/pr-requirements.mjs --create-issue "Add feature" --lane A --type unit

  # Create issue with auto-detected lane from tag
  node scripts/pr-requirements.mjs --create-issue "Fix bug" --tag U-inline-edit

  # Verify PR meets requirements
  node scripts/pr-requirements.mjs --verify-pr 123

  # Check PR (exit 1 if requirements not met - for CI)
  node scripts/pr-requirements.mjs --check-pr 123

  # Apply lane label to PR
  node scripts/pr-requirements.mjs --apply-label 123 --lane C

  # Link issue to project
  node scripts/pr-requirements.mjs --link-project 456 --project-id PVT_kwDOA

Options:
  --create-issue <title>    Create new issue
  --lane <A|B|C|D>         Lane assignment
  --type <type>            Issue type (unit, composition, bug, architecture)
  --tag <tag>              Commit tag (auto-detects lane)
  --body <text>            Issue body text
  --label <label>          Additional label (repeatable)
  --assignee <user>        Assignee (repeatable)
  --verify-pr <number>     Verify PR requirements
  --check-pr <number>      Check PR (CI mode - exits with error)
  --apply-label <number>   Apply lane label to PR
  --link-project <number>  Link issue to project
  --project-id <id>        Project ID (PVT_...)
  --help                   Show this help

Lane Detection:
  [U-*] → lane:A (Pair A - Components)
  [B-*] → lane:B (Pair B - Documentation)
  [C-*], [ARCH-*] → lane:C (Pair C - CI/DevOps)
  [D-*], [PB-*] → lane:D (Pair D - Project/Playbook)

PR Requirements:
  ✓ Issue reference (Closes #123)
  ✓ Lane label (lane:A/B/C/D)
  ✓ Commit tags on all commits
  ✓ Acceptance checklist

Examples:
  # Create unit issue for Pair A
  npm run pr:create-issue -- --create-issue "Add Button component" --tag U-button

  # Verify PR before merge
  npm run pr:check -- --check-pr 123

  # Create architecture issue
  npm run pr:create-issue -- --create-issue "Refactor state" --lane C --type architecture
`);
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();

  if (options.action === "help" || !options.action) {
    showHelp();
    return;
  }

  await checkGhCli();

  switch (options.action) {
    case "create-issue":
      await createIssue(options);
      break;
    case "verify-pr":
      await verifyPr(options.prNumber);
      break;
    case "check-pr":
      await checkPr(options.prNumber);
      break;
    case "link-project":
      await linkToProject(options.issueNumber, options.projectId);
      break;
    case "apply-label":
      await applyLaneLabel(options.prNumber, options.lane);
      break;
    default:
      console.error(`Unknown action: ${options.action}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
