#!/usr/bin/env node
/**
 * playbook-link-guard.mjs
 * @since 2025-11-01
 * @version 1.0.0
 * Summary: Validate Playbook pattern Links sections point to canonical docs.
 */

import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { parseFlags, Logger, repoRoot, succeed, fail } from "../_lib/core.mjs";

const SCRIPT_NAME = "playbook-link-guard";
const args = parseFlags(process.argv.slice(2));
const logger = new Logger(args.logLevel || "info");

if (args.help) {
  console.log(`
Usage: node scripts/checks/playbook-link-guard.mjs [options]

Options:
  --help              Show this help message
  --dry-run           No-op mode (default: true; script is read-only)
  --yes               Execute mode (provided for contract completeness)
  --cwd <path>        Working directory (default: process.cwd())
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)

Description:
  Ensures every Playbook pattern contains a Links section with absolute URLs,
  at least one template reference, and one Storybook reference so governance
  docs stay connected to the codebase.

Exit codes:
  0  - Validation passed
  11 - Validation failed
  13 - Unexpected execution error
`);
  process.exit(0);
}

const ALLOWED_PREFIXES = ["http://", "https://", "mailto:"];
const STORYBOOK_HOST_FRAGMENT = "louis-pvs.github.io/plaincraft/storybook";
const TEMPLATES_FRAGMENT =
  "github.com/louis-pvs/plaincraft/blob/main/templates/";

async function main() {
  const root = await repoRoot(args.cwd);
  const patternsDir = path.join(root, "playbook", "patterns");
  const entries = await readdir(patternsDir);

  const errors = [];
  const results = [];

  for (const entry of entries) {
    if (!entry.endsWith(".md") || entry === "index.md") continue;

    const filePath = path.join(patternsDir, entry);
    const content = await readFile(filePath, "utf-8");

    const linksSection = extractLinksSection(content);

    if (!linksSection) {
      results.push({
        pattern: entry,
        skipped: true,
        reason: "no_links_section",
      });
      continue;
    }

    const linkMatches = [...linksSection.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];

    if (linkMatches.length === 0) {
      errors.push(
        `${entry}: Links section present but no Markdown links detected.`,
      );
      continue;
    }

    const urls = linkMatches.map((match) => match[2].trim());

    const relativeLinks = urls.filter(
      (url) =>
        !ALLOWED_PREFIXES.some((prefix) => url.startsWith(prefix)) &&
        !url.startsWith("#"),
    );

    if (relativeLinks.length > 0) {
      errors.push(
        `${entry}: Links must be absolute URLs. Found relative links: ${relativeLinks.join(", ")}`,
      );
    }

    const templateLinks = urls.filter((url) =>
      url.includes(TEMPLATES_FRAGMENT),
    );
    if (templateLinks.length === 0) {
      errors.push(`${entry}: Links section missing GitHub template reference.`);
    }

    const storybookLinks = urls.filter((url) =>
      url.includes(STORYBOOK_HOST_FRAGMENT),
    );
    if (storybookLinks.length === 0) {
      errors.push(`${entry}: Links section missing Storybook reference.`);
    }

    results.push({
      pattern: entry,
      skipped: false,
      linksFound: urls.length,
      templateLinks: templateLinks.length,
      storybookLinks: storybookLinks.length,
    });
  }

  if (errors.length > 0) {
    fail({
      script: SCRIPT_NAME,
      message: "validation_failed",
      exitCode: 11,
      errors,
      output: args.output || "text",
      results,
    });
  }

  logger.info(`Validated ${results.length} Playbook pattern files.`);
  succeed({
    script: SCRIPT_NAME,
    ok: true,
    output: args.output || "text",
    results,
  });
}

function extractLinksSection(content) {
  const pattern = /## Links([\s\S]*?)(\n#{1,6}\s|$)/i;
  const match = content.match(pattern);
  if (!match) return null;
  return match[1];
}

main().catch((error) => {
  fail({
    script: SCRIPT_NAME,
    message: "execution_error",
    exitCode: 13,
    error: error instanceof Error ? error.message : String(error),
    output: args.output || "text",
  });
});
