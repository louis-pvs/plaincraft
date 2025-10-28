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

import { existsSync } from "node:fs";
import { appendFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, repoRoot } from "../_lib/core.mjs";
import { execCommand } from "../_lib/git.mjs";
import { getIssue } from "../_lib/github.mjs";
import { parseIdeaFile, findIdeaFiles } from "../_lib/ideas.mjs";

const SCRIPT_NAME = "generate-pr-content";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  issueNumber: z.number().optional(),
  source: z.enum(["idea", "changelog", "auto"]).default("auto"),
});

/**
 * Find idea file for issue
 * @param {number} issueNumber - Issue number
 * @param {Logger} log - Logger
 * @returns {Promise<string|null>} Idea file path
 */
async function findIdeaFileForIssue(issueNumber, log) {
  try {
    const issue = await getIssue(issueNumber);
    const { title, body } = issue;

    log.debug(`Searching for idea file for issue #${issueNumber}`);

    // Method 1: Check body for source reference
    let match = body.match(/Source:\s*`([^`]+)`/);
    if (match) {
      const filePath = match[1];
      const fullPath = filePath.startsWith("/ideas/")
        ? join(repoRoot(), filePath.slice(1))
        : join(repoRoot(), "ideas", filePath);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 2: Check for "See /ideas/..." reference
    match = body.match(/See\s+\/ideas\/([^\s]+\.md)/);
    if (match) {
      const fullPath = join(repoRoot(), "ideas", match[1]);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 3: Derive from title (e.g., [ARCH-example])
    const titleMatch = title.match(/^\[?([A-Z]+-[a-z0-9-]+)\]?/i);
    if (titleMatch) {
      const tag = titleMatch[1];
      const fullPath = join(repoRoot(), "ideas", `${tag}.md`);
      if (existsSync(fullPath)) return fullPath;
    }

    // Method 4: Search all idea files for matching issue
    const allIdeas = await findIdeaFiles();
    for (const ideaPath of allIdeas) {
      const parsed = await parseIdeaFile(ideaPath);
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
async function parseChangelog(log) {
  const changelogPath = join(repoRoot(), "CHANGELOG.md");

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
async function generateBodyFromChangelog(sections, version, log) {
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
      const { stdout } = await execCommand("gh", [
        "issue",
        "list",
        "--search",
        `${ticketId} in:title`,
        "--json",
        "number,title",
        "--limit",
        "10",
      ]);

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

  const parsed = await parseIdeaFile(ideaFilePath);
  const ideaFileName = ideaFilePath.split("/").pop();

  // Extract sections from parsed content
  const problemMatch = parsed.content.match(
    /## Problem\s*([\s\S]*?)(?=\n##|$)/,
  );
  const proposalMatch = parsed.content.match(
    /## Proposal\s*([\s\S]*?)(?=\n##|$)/,
  );
  const checklistMatch = parsed.content.match(
    /## Acceptance Checklist\s*([\s\S]*?)(?=\n##|\n$)/,
  );

  const problem = problemMatch ? problemMatch[1].trim() : "";
  const proposal = proposalMatch ? proposalMatch[1].trim() : "";

  let acceptance = [];
  if (checklistMatch) {
    acceptance = checklistMatch[1]
      .split("\n")
      .filter((line) => line.trim().startsWith("- [ ]"))
      .map((line) => line.trim());
  }

  if (acceptance.length === 0) {
    acceptance = [
      "- [ ] All CI checks passing",
      "- [ ] Code reviewed",
      "- [ ] Documentation updated",
      "- [ ] Integration window (at :00 or :30)",
    ];
  }

  const title = parsed.metadata.title || `Issue #${issueNumber}`;
  const purpose = parsed.metadata.purpose || "";

  const body = `Closes #${issueNumber}

${purpose ? `**Purpose:** ${purpose}\n` : ""}
## Problem

${problem}

## Proposal

${proposal}

## Acceptance Checklist

${acceptance.join("\n")}

---

**Source:** \`/ideas/${ideaFileName}\`
`;

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
async function generatePRContent(args, log) {
  let title = "";
  let body = "";

  // Try idea file first if issue number provided or auto mode
  if ((args.source === "auto" || args.source === "idea") && args.issueNumber) {
    log.info(`Looking for idea file for issue #${args.issueNumber}...`);
    const ideaFilePath = await findIdeaFileForIssue(args.issueNumber, log);

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
    const { version, sections } = await parseChangelog(log);

    if (sections.length === 0) {
      log.info("No version sections found in CHANGELOG.md");
      return { title: "", body: "" };
    }

    log.info(`Found version ${version} with ${sections.length} section(s)`);
    title = generateTitle(sections, version);
    body = await generateBodyFromChangelog(sections, version, log);

    return { title, body };
  }

  return { title, body };
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  try {
    // Parse issue number from env or positional arg
    const issueNumber =
      parseInt(process.env.PR_NUMBER || process.env.ISSUE_NUMBER, 10) ||
      parseInt(flags._?.[0], 10) ||
      null;

    const args = ArgsSchema.parse({
      ...flags,
      issueNumber,
    });

    if (args.help) {
      console.log(`
Usage: ${SCRIPT_NAME} [issue-number] [options]

Generate PR title and body from CHANGELOG.md or idea files.

Options:
  --help                    Show this help message
  --dry-run                 Preview without outputting
  --output <fmt>            Output format: text (default), json
  --log-level <lvl>         Log level: error, warn, info (default), debug, trace
  --cwd <path>              Working directory (default: current)
  --source <src>            Source: auto (default), idea, changelog

Environment Variables:
  PR_NUMBER                 PR or issue number (alternative to positional arg)
  ISSUE_NUMBER              Issue number (alternative to positional arg)
  GITHUB_OUTPUT             GitHub Actions output file

Examples:
  ${SCRIPT_NAME} 123                    # Generate from issue #123
  ${SCRIPT_NAME} --source changelog     # Generate from CHANGELOG.md
  ${SCRIPT_NAME} --dry-run              # Preview without output

Exit codes:
  0  - Success (content generated)
  1  - Failed to generate
  10 - Precondition failed (no CHANGELOG or idea file)

Note: Outputs to GITHUB_OUTPUT if set, otherwise prints to console.
`);
      process.exit(0);
    }

    // Generate content
    const { title, body } = await generatePRContent(args, log);

    if (!title && !body) {
      log.warn("No content generated");
      if (!args.dryRun) {
        setOutput("title", "");
        setOutput("body", "");
      }
      succeed({
        script: SCRIPT_NAME,
        message: "No content generated",
        exitCode: 2,
        output: args.output,
        data: { title: "", body: "" },
      });
    }

    if (args.dryRun) {
      log.info("[DRY-RUN] Generated PR content:");
      log.info(`Title: ${title}`);
      log.info(`Body length: ${body.length} characters`);
    } else {
      setOutput("title", title);
      setOutput("body", body);
    }

    succeed({
      script: SCRIPT_NAME,
      message: "Generated PR content",
      output: args.output,
      data: { title, body, length: body.length },
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

    log.error("Failed to generate PR content:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
  }
}

main();
