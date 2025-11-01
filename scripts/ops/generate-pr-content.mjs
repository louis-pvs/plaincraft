#!/usr/bin/env node
/**
 * generate-pr-content.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Generate PR title and body from CHANGELOG.md or idea files
 *
 * Extracts latest version's changes for PR description.
 * Integrates with PR template structure and issue metadata.
 */

import { existsSync, appendFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import {
  Logger,
  parseFlags,
  fail,
  succeed,
  repoRoot,
  generateRunId,
} from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";
import { getIssue } from "../_lib/github.mjs";
import {
  loadIdeaFile,
  findIdeaFiles,
  extractChecklistItems,
} from "../_lib/ideas.mjs";

const SCRIPT_NAME = "generate-pr-content";
const rawArgs = parseFlags(process.argv.slice(2));
const runId = generateRunId();
const start = Date.now();

// Zod schema for CLI args
const ArgsSchema = z.object({
  dryRun: z.boolean().default(true),
  yes: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  issueNumber: z.number().nullable().optional(),
  source: z.enum(["idea", "changelog", "auto"]).default("auto"),
});

/**
 * Find idea file for issue
 * @param {number} issueNumber - Issue number
 * @param {Logger} log - Logger
 * @returns {Promise<string|null>} Idea file path
 */
async function findIdeaFileForIssue(issueNumber, log, root) {
  try {
    const issue = await getIssue(issueNumber);
    const { title, body } = issue;

    log.debug(`Searching for idea file for issue #${issueNumber}`);

    const ideasDir = join(root, "ideas");

    // Method 1: Check body for source reference
    let match = body.match(/Source:\s*`([^`]+)`/);
    if (match) {
      const filePath = match[1];
      const normalized = filePath.replace(/^\/+/, "");
      const fullPath = normalized.startsWith("ideas/")
        ? join(root, normalized)
        : join(ideasDir, normalized);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 2: Check for "See /ideas/..." reference
    match = body.match(/See\s+\/ideas\/([^\s]+\.md)/);
    if (match) {
      const fullPath = join(ideasDir, match[1]);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 3: Derive from title (e.g., [ARCH-example])
    const titleMatch = title.match(/^\[?([A-Z]+-[a-z0-9-]+)\]?/i);
    if (titleMatch) {
      const tag = titleMatch[1];
      const fullPath = join(ideasDir, `${tag}.md`);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 4: Search all idea files for matching issue
    const allIdeas = await findIdeaFiles(ideasDir);
    for (const ideaFile of allIdeas) {
      const ideaPath = join(ideasDir, ideaFile);
      const parsed = await loadIdeaFile(ideaPath);
      if (parsed.metadata.issue === issueNumber) return ideaPath;
    }

    return null;
  } catch (error) {
    log.error(`Error finding idea file: ${error.message}`);
    return null;
  }
}

/**
 * Extract acceptance checklist from issue
 * @param {number} issueNumber - Issue number
 * @param {Logger} log - Logger
 * @returns {Promise<Array<string>>} Checklist items
 */
async function fetchAcceptanceChecklist(issueNumber, log) {
  try {
    const issue = await getIssue(issueNumber);
    const { body } = issue;

    // Extract acceptance checklist section
    const checklistRegex =
      /## Acceptance Checklist\s*([\s\S]*?)(?=\n##|\n$|$)/i;
    const match = body.match(checklistRegex);

    if (match) {
      const checklistContent = match[1];
      const items = checklistContent
        .split("\n")
        .filter((line) => line.trim().match(/^- \[[ x]\]/))
        .map((line) => line.trim());

      if (items.length > 0) return items;
    }

    // Fallback to default checklist
    return [
      "- [ ] All CI checks passing",
      "- [ ] Code reviewed",
      "- [ ] Documentation updated",
      "- [ ] Integration window (at :00 or :30)",
    ];
  } catch (error) {
    log.warn(
      `Failed to fetch checklist from issue #${issueNumber}: ${error.message}`,
    );
    return [
      "- [ ] All CI checks passing",
      "- [ ] Code reviewed",
      "- [ ] Documentation updated",
      "- [ ] Integration window (at :00 or :30)",
    ];
  }
}

/**
 * Parse CHANGELOG.md and extract latest version entries
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Changelog data
 */
async function parseChangelog(log, root) {
  const changelogPath = join(root, "CHANGELOG.md");

  if (!existsSync(changelogPath)) {
    log.debug("No CHANGELOG.md found");
    return { version: null, sections: [] };
  }

  const content = await readFile(changelogPath, "utf-8");
  const lines = content.split("\n");

  // Find first version header: ## [x.y.z] - YYYY-MM-DD
  let versionLine = -1;
  let version = null;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^##\s+\[([^\]]+)\]\s+-\s+/);
    if (match) {
      versionLine = i;
      version = match[1];
      break;
    }
  }

  if (versionLine === -1) {
    log.debug("No version sections found in CHANGELOG.md");
    return { version: null, sections: [] };
  }

  // Find end of this version section (next ## or end of file)
  let endLine = lines.length;
  for (let i = versionLine + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      endLine = i;
      break;
    }
  }

  // Extract sections (### headers with content)
  const sections = [];
  let currentSection = null;

  for (let i = versionLine + 1; i < endLine; i++) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: line.replace(/^###\s*/, "").trim(),
        content: [],
      };
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }

  if (currentSection) sections.push(currentSection);

  return {
    version,
    sections: sections.map((s) => ({
      title: s.title,
      content: s.content.join("\n").trim(),
    })),
  };
}

/**
 * Generate PR title from changelog sections
 * @param {Array<object>} sections - Changelog sections
 * @param {string} version - Version
 * @returns {string} PR title
 */
function generateTitle(sections, version) {
  if (sections.length === 0) {
    return version ? `Release v${version}` : "";
  }

  const titles = sections.map((s) => s.title);
  const firstTitle = titles[0];
  const tagMatch = firstTitle.match(/^\[[\w-]+\]/);
  const tag = tagMatch ? tagMatch[0] : null;

  const cleanTitles = titles.map((t) => t.replace(/^\[[\w-]+\]\s*/, "").trim());

  if (cleanTitles.length === 1) {
    return tag ? `${tag} ${cleanTitles[0]}` : cleanTitles[0];
  }

  const titleList = cleanTitles.join(", ");
  return tag ? `${tag} ${titleList}` : titleList;
}

/**
 * Extract all ticket tags from changelog sections
 * @param {Array<object>} sections - Changelog sections
 * @returns {Array<string>} Tags
 */
function extractAllTags(sections) {
  const tags = new Set();

  for (const section of sections) {
    const titleTagMatch = section.title.match(/\[[\w-]+\]/g);
    if (titleTagMatch) {
      titleTagMatch.forEach((tag) => tags.add(tag));
    }
  }

  if (tags.size === 0) {
    for (const section of sections) {
      const contentLines = section.content.split("\n");
      for (const line of contentLines) {
        const tagMatch = line.match(/\[[\w-]+\]/g);
        if (tagMatch) {
          tagMatch.forEach((tag) => tags.add(tag));
        }
      }
    }
  }

  return Array.from(tags);
}

/**
 * Generate PR body from changelog sections
 * @param {Array<object>} sections - Changelog sections
 * @param {string} version - Version
 * @param {Logger} log - Logger
 * @returns {Promise<string>} PR body
 */
async function generateBodyFromChangelog(sections, version, log, root) {
  if (sections.length === 0) {
    return version
      ? `## Release v${version}\n\nSee CHANGELOG.md for details.`
      : "";
  }

  const allTags = extractAllTags(sections);
  const firstTag = allTags.length > 0 ? allTags[0] : "";
  const ticketMatch = firstTag.match(/^\[([\w-]+)\]$/);
  const ticketId = ticketMatch ? ticketMatch[1] : null;

  // Determine lane from first tag
  let lane = "";
  if (firstTag.startsWith("[U-")) lane = "lane:A";
  else if (firstTag.startsWith("[B-")) lane = "lane:B";
  else if (firstTag.startsWith("[C-") || firstTag.startsWith("[ARCH-"))
    lane = "lane:C";
  else if (firstTag.startsWith("[D-") || firstTag.startsWith("[PB-"))
    lane = "lane:D";

  // Generate scope summary from first bullet
  const firstSection = sections[0];
  const contentLines = firstSection.content.split("\n").filter((l) => l.trim());
  const firstBullet = contentLines.find((l) => l.trim().startsWith("-"));

  let scopeSummary = "See changes below.";
  if (firstBullet) {
    const cleanLine = firstBullet
      .replace(/^[-*]\s*/, "")
      .replace(/\[[\w-]+\]\s*/, "")
      .trim();

    const sentenceMatch = cleanLine.match(/^[^.!?]+[.!?](?:\s|$)/);
    if (sentenceMatch) {
      scopeSummary = sentenceMatch[0].trim();
    } else if (cleanLine.endsWith(".")) {
      scopeSummary = cleanLine;
    } else {
      scopeSummary =
        cleanLine.length > 150
          ? cleanLine.substring(0, 147) + "..."
          : cleanLine + ".";
    }
  }

  // Try to find issue
  let issueNumber = null;
  let issueReference = "";
  let acceptanceChecklist = [
    "- [ ] All CI checks passing",
    "- [ ] Code reviewed",
    "- [ ] Documentation updated",
    "- [ ] Integration window (at :00 or :30)",
  ];

  if (ticketId) {
    log.info(`Searching for issue with ticket ID: ${ticketId}`);
    try {
      const { stdout } = await execCommand(
        "gh",
        [
          "issue",
          "list",
          "--search",
          `${ticketId} in:title`,
          "--json",
          "number,title",
          "--limit",
          "10",
        ],
        { cwd: root },
      );

      const issues = JSON.parse(stdout);
      const match = issues.find((issue) =>
        issue.title.match(new RegExp(`\\[${ticketId}\\]`, "i")),
      );

      if (match) {
        issueNumber = match.number;
        log.info(`Found issue #${issueNumber}`);
        issueReference = `Closes #${issueNumber}`;
        acceptanceChecklist = await fetchAcceptanceChecklist(issueNumber, log);
      }
    } catch (error) {
      log.warn(`Failed to search for issue: ${error.message}`);
    }
  }

  const issueCheckbox = issueNumber
    ? `- [x] I referenced the ticket with \`Closes #${issueNumber}\` (required for merge)`
    : `- [ ] I referenced the ticket with \`Closes #<issue-number>\` (required for merge)`;

  const ticketIdField = ticketId ? `\`${ticketId}\`` : "``";

  const body = `${issueReference ? `${issueReference}\n\n` : ""}# Related Issue

${issueCheckbox}
- [ ] Every commit message begins with the ticket ID in brackets (e.g. \`${firstTag}\`)
- Ticket ID: ${ticketIdField}

# Lane + Contracts

- Lane label applied: \`${lane}\`
- Scope summary: ${scopeSummary}
- Rollout notes: ${version ? `Release v${version}` : "See details below"}

# Acceptance Checklist

${acceptanceChecklist.join("\n")}

---

# Changes (from CHANGELOG.md v${version || "latest"})

${sections
  .map((section, index) => {
    const separator = index > 0 ? "\n---\n" : "";
    return `${separator}\n## ${section.title}\n\n${section.content}`;
  })
  .join("\n")}

---

**Auto-generated from CHANGELOG.md** ${version ? `(v${version})` : ""}  
${issueNumber ? `**Linked issue**: #${issueNumber}` : "*Update with ticket reference and acceptance checklist*"}
`;

  return body;
}

/**
 * Generate PR content from idea file
 * @param {string} ideaFilePath - Path to idea file
 * @param {number} issueNumber - Issue number
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Title and body
 */
async function generateContentFromIdea(ideaFilePath, issueNumber, log) {
  log.info(`Generating PR content from idea file: ${ideaFilePath}`);

  const parsed = await loadIdeaFile(ideaFilePath);
  const ideaFileName = ideaFilePath.split("/").pop();
  const metadata = parsed.metadata || {};

  const purpose = metadata.purpose ? metadata.purpose.trim() : "";
  const fallbackSection = (regex) => {
    const match = parsed.content.match(regex);
    return match ? match[1].trim() : "";
  };

  const problem =
    metadata.problem?.trim() ||
    fallbackSection(/## Problem\s*([\s\S]*?)(?=\n##|$)/i);
  const proposal =
    metadata.proposal?.trim() ||
    fallbackSection(/## Proposal\s*([\s\S]*?)(?=\n##|$)/i);

  let acceptanceItems = extractChecklistItems(metadata);
  if (acceptanceItems.length === 0) {
    acceptanceItems = [
      "All CI checks passing",
      "Code reviewed",
      "Documentation updated",
      "Integration window (at :00 or :30)",
    ];
  }

  acceptanceItems = acceptanceItems.map((item) => item.trim()).filter(Boolean);

  const acceptanceLines = acceptanceItems.map((item) => {
    const trimmed = item.trim();
    if (/^- \[[x\s]\]/i.test(trimmed)) {
      return trimmed.replace(/\s+$/, "");
    }
    return `- [ ] ${trimmed}`;
  });

  const parentIssueNumber =
    typeof metadata.parentIssue === "number" ? metadata.parentIssue : null;
  let parentTitle = metadata.parentSlug || "";
  const hasParentSlug = Boolean(metadata.parentSlug);

  if (parentIssueNumber) {
    try {
      const parentIssue = await getIssue(parentIssueNumber);
      if (parentIssue?.title) {
        parentTitle = parentIssue.title;
      }
    } catch (error) {
      log.warn(
        `Failed to fetch parent issue #${parentIssueNumber}: ${error.message}`,
      );
    }
  }

  const parentBanner =
    parentIssueNumber !== null
      ? `Part of #${parentIssueNumber}${parentTitle ? ` ${parentTitle}` : ""}`
      : hasParentSlug
        ? `Part of ${parentTitle}`
        : "";

  const headerLines = [`Closes #${issueNumber}`];
  if (parentBanner) {
    headerLines.push(parentBanner);
  }

  const title = metadata.title || `Issue #${issueNumber}`;
  const problemSection =
    problem && problem.length > 0
      ? problem
      : "_No problem statement provided._";
  const proposalSection =
    proposal && proposal.length > 0
      ? proposal
      : "_No proposal details provided._";

  const metaLines = [];
  if (parentIssueNumber !== null) {
    metaLines.push(
      `**Parent:** #${parentIssueNumber}${
        parentTitle ? ` - ${parentTitle}` : ""
      }`,
    );
  } else if (hasParentSlug) {
    metaLines.push(`**Parent:** ${parentTitle}`);
  }
  metaLines.push(`**Source:** \`/ideas/${ideaFileName}\``);

  const bodySegments = [
    headerLines.join("\n"),
    "",
    purpose ? `**Purpose:** ${purpose}` : null,
    purpose ? "" : null,
    "## Problem",
    "",
    problemSection,
    "",
    "## Proposal",
    "",
    proposalSection,
    "",
    "## Acceptance Checklist",
    "",
    acceptanceLines.join("\n"),
    "",
    "---",
    "",
    metaLines.join("\n"),
  ].filter((segment) => segment !== null);

  const body = `${bodySegments.join("\n")}\n`;

  return { title, body };
}

/**
 * Write to GITHUB_OUTPUT
 * @param {string} key - Output key
 * @param {string} value - Output value
 */
function setOutput(key, value) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) {
    console.log(`${key}=${value}`);
    return;
  }

  const delimiter = `EOF_${Date.now()}`;
  const content = `${key}<<${delimiter}\n${value}\n${delimiter}\n`;
  appendFileSync(output, content, "utf-8");
}

/**
 * Generate PR content
 * @param {object} args - Parsed args
 * @param {Logger} log - Logger
 * @returns {Promise<object>} Title and body
 */
async function generatePRContent(args, log, root) {
  let title = "";
  let body = "";

  // Try idea file first if issue number provided or auto mode
  if ((args.source === "auto" || args.source === "idea") && args.issueNumber) {
    log.info(`Looking for idea file for issue #${args.issueNumber}...`);
    const ideaFilePath = await findIdeaFileForIssue(
      args.issueNumber,
      log,
      root,
    );

    if (ideaFilePath) {
      log.info(`Found idea file: ${ideaFilePath.split("/").pop()}`);
      const content = await generateContentFromIdea(
        ideaFilePath,
        args.issueNumber,
        log,
      );
      return content;
    } else if (args.source === "idea") {
      throw new Error(`No idea file found for issue #${args.issueNumber}`);
    }

    log.info("No idea file found, falling back to CHANGELOG.md");
  }

  // Fallback to CHANGELOG.md
  if (args.source === "auto" || args.source === "changelog") {
    log.info("Reading CHANGELOG.md...");
    const { version, sections } = await parseChangelog(log, root);

    if (sections.length === 0) {
      log.info("No version sections found in CHANGELOG.md");
      return { title: "", body: "" };
    }

    log.info(`Found version ${version} with ${sections.length} section(s)`);
    title = generateTitle(sections, version);
    body = await generateBodyFromChangelog(sections, version, log, root);

    return { title, body };
  }

  return { title, body };
}
if (rawArgs.help) {
  printHelp();
  process.exit(0);
}

const rawIssueNumber =
  parseInt(process.env.PR_NUMBER || process.env.ISSUE_NUMBER || "", 10) ||
  (Array.isArray(rawArgs._) ? parseInt(rawArgs._[0], 10) : null);

const argsForValidation = {
  dryRun: coerceBoolean(rawArgs.dryRun, true),
  yes: coerceBoolean(rawArgs.yes, false),
  output: rawArgs.output,
  logLevel: rawArgs.logLevel,
  cwd: rawArgs.cwd,
  source: rawArgs.source,
  issueNumber:
    Number.isFinite(rawIssueNumber) && !Number.isNaN(rawIssueNumber)
      ? rawIssueNumber
      : null,
};

const parsedArgs = ArgsSchema.safeParse(argsForValidation);

if (!parsedArgs.success) {
  fail({
    exitCode: 11,
    script: SCRIPT_NAME,
    message: "Invalid arguments",
    error: parsedArgs.error.format(),
    output: rawArgs.output || "text",
    runId,
  });
}

const args = {
  ...parsedArgs.data,
  dryRun: parsedArgs.data.yes ? false : parsedArgs.data.dryRun,
};

const log = new Logger(args.logLevel);

/**
 * Main entry point
 */
async function main() {
  let root;
  try {
    root = await repoRoot(args.cwd);
    const { title, body } = await generatePRContent(args, log, root);
    const durationMs = Date.now() - start;

    if (!title && !body) {
      log.warn("No content generated");
      succeed({
        output: args.output,
        script: SCRIPT_NAME,
        runId,
        dryRun: args.dryRun,
        noop: true,
        title: "",
        body: "",
        durationMs,
      });
      return;
    }

    if (args.dryRun) {
      log.info("[DRY-RUN] Generated PR content");
      log.info(`Title: ${title}`);
      log.info(`Body length: ${body.length} characters`);
    } else {
      setOutput("title", title);
      setOutput("body", body);
    }

    succeed({
      output: args.output,
      script: SCRIPT_NAME,
      runId,
      dryRun: args.dryRun,
      title,
      body,
      length: body.length,
      durationMs,
    });
  } catch (error) {
    const outputMode = args.output || rawArgs.output || "text";

    if (error instanceof z.ZodError) {
      log.error("Validation error:", error.errors);
      fail({
        exitCode: 11,
        script: SCRIPT_NAME,
        message: "Invalid arguments",
        error: error.format(),
        output: outputMode,
        runId,
      });
      return;
    }

    log.error(
      "Failed to generate PR content:",
      error instanceof Error ? error.message : String(error),
    );

    fail({
      exitCode: 13,
      script: SCRIPT_NAME,
      message: error instanceof Error ? error.message : String(error),
      error,
      output: outputMode,
      runId,
    });
  }
}

main();

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
Generate PR title and body from CHANGELOG.md or idea files.

Usage:
  node scripts/ops/${SCRIPT_NAME}.mjs [issue-number] [options]

Options:
  --source <mode>        Source mode: idea|changelog|auto (default: auto)
  --yes                  Execute (disable dry-run preview)
  --dry-run              Preview output without emitting GITHUB_OUTPUT (default)
  --output <format>      text|json (default: text)
  --log-level <level>    trace|debug|info|warn|error (default: info)
  --cwd <path>           Working directory (default: current)
  --help                 Show this help message

Examples:
  node scripts/ops/${SCRIPT_NAME}.mjs --dry-run --output json
  node scripts/ops/${SCRIPT_NAME}.mjs 123 --yes --source idea

Exit codes:
  0  Success
  11 Validation error
  13 Unexpected error
`);
}
