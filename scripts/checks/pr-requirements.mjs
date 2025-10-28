#!/usr/bin/env node
/**
 * pr-requirements.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * PR requirements automation and verification
 *
 * Automates PR operations: create issues, apply labels, verify requirements.
 * Integrates with GitHub CLI for issue/PR management.
 */

import { z } from "zod";
import { Logger, parseFlags, fail, succeed } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";

const SCRIPT_NAME = "pr-requirements";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  action: z
    .enum([
      "create-issue",
      "verify-pr",
      "check-pr",
      "apply-label",
      "link-project",
    ])
    .optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  lane: z.enum(["A", "B", "C", "D"]).optional(),
  type: z.enum(["unit", "composition", "bug", "architecture"]).default("unit"),
  labels: z.array(z.string()).default([]),
  prNumber: z.number().optional(),
  issueNumber: z.number().optional(),
  projectId: z.string().optional(),
  tag: z.string().optional(),
});

// Lane mapping
const LANE_MAP = {
  A: { label: "lane:A", pair: "Pair A - Components", tags: ["U"] },
  B: { label: "lane:B", pair: "Pair B - Documentation", tags: ["B"] },
  C: { label: "lane:C", pair: "Pair C - CI/DevOps", tags: ["C", "ARCH"] },
  D: { label: "lane:D", pair: "Pair D - Project/Playbook", tags: ["D", "PB"] },
};

// Type labels
const TYPE_LABELS = {
  unit: "type:unit",
  composition: "type:composition",
  bug: "type:bug",
  architecture: "type:architecture",
};

/**
 * Detect lane from commit tag
 * @param {string} tag - Commit tag (e.g., [U-feature])
 * @returns {string|null} Lane letter
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
 * Generate acceptance checklist
 * @param {string} type - Issue type
 * @returns {string} Checklist markdown
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
 * Create issue with lane labels
 * @param {object} options - Issue options
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Issue result
 */
async function createIssueWithLane(options, dryRun, log) {
  const { title, body, lane, type, labels } = options;

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

  if (dryRun) {
    log.info("[DRY-RUN] Would create issue:");
    log.info(`  Title: ${title}`);
    log.info(`  Labels: ${allLabels.join(", ")}`);
    log.info(`  Lane: ${laneConfig?.label || "none"}`);
    log.info(`  Type: ${type}`);
    return {
      number: null,
      url: null,
      created: false,
      title,
      labels: allLabels,
    };
  }

  try {
    const { stdout } = await execCommand("gh", [
      "issue",
      "create",
      "--title",
      title,
      "--body",
      issueBody,
      ...(allLabels.length > 0 ? ["--label", allLabels.join(",")] : []),
    ]);

    const issueUrl = stdout.trim();
    const issueNumber = issueUrl.split("/").pop();

    log.info(`Created issue #${issueNumber}`);
    log.info(`URL: ${issueUrl}`);
    log.info(`Lane: ${laneConfig?.label || "none"}`);
    log.info(`Type: ${type}`);

    return {
      number: parseInt(issueNumber, 10),
      url: issueUrl,
      created: true,
      title,
      labels: allLabels,
    };
  } catch (error) {
    throw new Error(`Failed to create issue: ${error.message}`);
  }
}

/**
 * Check if PR is issue-exempt
 * @param {object} pr - PR data
 * @returns {boolean} Is exempt
 */
function isIssueExempt(pr) {
  const prTitle = pr.title || "";
  const prBody = pr.body || "";

  const exemptTags = ["ARCH", "C-", "B-", "PB-"];
  const hasExemptTag = pr.commits?.some((c) => {
    const headline = c.messageHeadline || "";
    return exemptTags.some((tag) => headline.includes(`[${tag}`));
  });

  const exemptKeywords = [
    "chore:",
    "docs:",
    "ci:",
    "build:",
    "test:",
    "refactor:",
  ];
  const hasExemptKeyword = exemptKeywords.some(
    (kw) => prTitle.toLowerCase().startsWith(kw) || prBody.includes(kw),
  );

  const hasExemptLabel = pr.labels?.some((l) =>
    ["lane:B", "lane:C", "lane:D", "type:architecture"].includes(l.name),
  );

  return hasExemptTag || hasExemptKeyword || hasExemptLabel;
}

/**
 * Verify PR requirements
 * @param {number} prNumber - PR number
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Verification result
 */
async function verifyPrRequirements(prNumber, log) {
  if (!prNumber) {
    throw new Error("PR number is required");
  }

  try {
    const { stdout } = await execCommand("gh", [
      "pr",
      "view",
      prNumber.toString(),
      "--json",
      "body,labels,title,commits",
    ]);

    const pr = JSON.parse(stdout);
    const issues = [];
    const warnings = [];

    const prBody = pr.body || "";
    const hasIssueRef = /closes\s+#\d+|fixes\s+#\d+|resolves\s+#\d+/i.test(
      prBody,
    );
    const exempt = isIssueExempt(pr);

    if (!hasIssueRef && !exempt) {
      issues.push("Missing issue reference (Closes #123)");
    } else if (!hasIssueRef && exempt) {
      warnings.push("No issue reference (exempt: architecture/ci/docs change)");
    }

    const hasLaneLabel = pr.labels.some((l) => l.name.startsWith("lane:"));
    if (!hasLaneLabel) {
      issues.push("Missing lane label");
    }

    const commits = pr.commits || [];
    const missingTags = commits.filter(
      (c) => !c.messageHeadline || !c.messageHeadline.match(/^\[[\w-]+\]/),
    );
    if (missingTags.length > 0) {
      issues.push(`${missingTags.length} commit(s) missing tag prefix`);
    }

    const hasChecklist = prBody.includes("- [ ]") || prBody.includes("- [x]");
    if (!hasChecklist && !exempt) {
      issues.push("Missing acceptance checklist");
    } else if (!hasChecklist && exempt) {
      warnings.push("No acceptance checklist (optional for this type)");
    }

    const passed = issues.length === 0;

    if (passed) {
      log.info(`PR #${prNumber} meets all requirements`);
      if (warnings.length > 0) {
        warnings.forEach((w) => log.warn(w));
      }
    } else {
      log.error(`PR #${prNumber} has ${issues.length} issue(s)`);
      issues.forEach((i) => log.error(`  - ${i}`));
    }

    return { passed, issues, warnings, prNumber };
  } catch (error) {
    throw new Error(`Failed to verify PR: ${error.message}`);
  }
}

/**
 * Apply lane label to PR
 * @param {number} prNumber - PR number
 * @param {string} lane - Lane letter
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Result
 */
async function applyLaneToPr(prNumber, lane, dryRun, log) {
  if (!prNumber || !lane) {
    throw new Error("PR number and lane are required");
  }

  const laneConfig = LANE_MAP[lane];
  if (!laneConfig) {
    throw new Error(`Invalid lane: ${lane}. Must be A, B, C, or D`);
  }

  if (dryRun) {
    log.info(`[DRY-RUN] Would apply ${laneConfig.label} to PR #${prNumber}`);
    return { prNumber, lane, label: laneConfig.label, applied: false };
  }

  try {
    await execCommand("gh", [
      "pr",
      "edit",
      prNumber.toString(),
      "--add-label",
      laneConfig.label,
    ]);
    log.info(`Applied ${laneConfig.label} to PR #${prNumber}`);

    return { prNumber, lane, label: laneConfig.label, applied: true };
  } catch (error) {
    throw new Error(`Failed to apply label: ${error.message}`);
  }
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  try {
    // Detect action from flags or positional args
    let action = flags.action;
    if (!action && flags._ && flags._.length > 0) {
      action = flags._[0];
    }

    // Parse other args
    const prNumber = flags.prNumber || flags.pr || parseInt(flags._?.[1], 10);
    const issueNumber =
      flags.issueNumber || flags.issue || parseInt(flags._?.[1], 10);

    // Detect lane from tag if provided
    let lane = flags.lane;
    if (flags.tag && !lane) {
      lane = detectLane(flags.tag);
    }

    const args = ArgsSchema.parse({
      ...flags,
      action,
      prNumber,
      issueNumber,
      lane,
    });

    if (args.help || !args.action) {
      console.log(`
Usage: ${SCRIPT_NAME} <action> [options]

PR requirements automation and verification.

Actions:
  create-issue              Create issue with lane labels
  verify-pr                 Verify PR requirements
  check-pr                  Check PR (CI mode - exit 1 if fails)
  apply-label               Apply lane label to PR
  link-project              Link issue to project (not implemented)

Options:
  --help                    Show this help message
  --dry-run                 Preview without making changes
  --output <fmt>            Output format: text (default), json
  --log-level <lvl>         Log level: error, warn, info (default), debug, trace
  --cwd <path>              Working directory (default: current)

Create Issue Options:
  --title <text>            Issue title (required)
  --body <text>             Issue body
  --lane <A|B|C|D>         Lane assignment
  --type <type>             Issue type: unit, composition, bug, architecture
  --tag <tag>               Commit tag (auto-detects lane)
  --label <label>           Additional label

Verify/Check PR Options:
  --pr-number <N>           PR number
  --pr <N>                  Alias for --pr-number

Apply Label Options:
  --pr-number <N>           PR number
  --lane <A|B|C|D>         Lane to apply

Lane Detection:
  [U-*] → lane:A (Pair A - Components)
  [B-*] → lane:B (Pair B - Documentation)
  [C-*], [ARCH-*] → lane:C (Pair C - CI/DevOps)
  [D-*], [PB-*] → lane:D (Pair D - Project/Playbook)

Examples:
  ${SCRIPT_NAME} create-issue --title "Add Button" --tag U-button
  ${SCRIPT_NAME} verify-pr --pr 123
  ${SCRIPT_NAME} check-pr --pr 123              # Exit 1 if fails
  ${SCRIPT_NAME} apply-label --pr 123 --lane C

Exit codes:
  0  - Success
  1  - Failed (check-pr: requirements not met)
  10 - Precondition failed (gh not authenticated)
  11 - Validation failed

Prerequisites:
  - GitHub CLI must be authenticated (gh auth login)
`);
      process.exit(0);
    }

    // Check gh CLI
    try {
      await execCommand("gh", ["--version"]);
    } catch {
      fail({
        script: SCRIPT_NAME,
        message: "GitHub CLI (gh) not installed",
        exitCode: 10,
        output: args.output,
      });
    }

    // Execute action
    let result;
    switch (args.action) {
      case "create-issue":
        if (!args.title) {
          throw new Error("--title required for create-issue action");
        }
        result = await createIssueWithLane(
          {
            title: args.title,
            body: args.body,
            lane: args.lane,
            type: args.type,
            labels: args.labels,
          },
          args.dryRun,
          log,
        );
        break;

      case "verify-pr":
        if (!args.prNumber) {
          throw new Error("--pr-number required for verify-pr action");
        }
        result = await verifyPrRequirements(args.prNumber, log);
        break;

      case "check-pr":
        if (!args.prNumber) {
          throw new Error("--pr-number required for check-pr action");
        }
        result = await verifyPrRequirements(args.prNumber, log);
        if (!result.passed) {
          fail({
            script: SCRIPT_NAME,
            message: "PR requirements not met",
            exitCode: 1,
            output: args.output,
            data: result,
          });
        }
        break;

      case "apply-label":
        if (!args.prNumber || !args.lane) {
          throw new Error(
            "--pr-number and --lane required for apply-label action",
          );
        }
        result = await applyLaneToPr(
          args.prNumber,
          args.lane,
          args.dryRun,
          log,
        );
        break;

      default:
        throw new Error(
          `Unknown action: ${args.action}. Use --help for usage.`,
        );
    }

    succeed({
      script: SCRIPT_NAME,
      message: `${args.action} completed`,
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

    log.error(`${flags.action || "Action"} failed:`, error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
