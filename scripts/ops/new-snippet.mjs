#!/usr/bin/env node
/**
 * new-snippet.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Create new snippet from template
 *
 * Scaffolds snippet directory with all required files from _template.
 * Replaces placeholder names and updates file names.
 */

import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, repoRoot } from "../_lib/core.mjs";

const SCRIPT_NAME = "new-snippet";

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]).default("info"),
  cwd: z.string().optional(),
  name: z.string().regex(/^[A-Z][A-Za-z0-9]+$/, "Must be PascalCase"),
});

/**
 * Create snippet from template
 * @param {string} name - PascalCase snippet name
 * @param {boolean} dryRun - Dry run mode
 * @param {Logger} log - Logger
 * @returns {object} Result
 */
function createSnippet(name, dryRun, log) {
  const root = repoRoot();
  const src = join(root, "snippets", "_template");
  const dst = join(root, "snippets", name);

  log.info(`Creating snippet: ${name}`);

  // Check if destination exists
  if (existsSync(dst)) {
    throw new Error(`Folder ${dst} already exists`);
  }

  // Check if template exists
  if (!existsSync(src)) {
    throw new Error(`Template folder ${src} not found`);
  }

  if (dryRun) {
    log.info(`[DRY-RUN] Would create snippet at: ${dst}`);
    log.info("[DRY-RUN] Would copy template files");
    log.info("[DRY-RUN] Would replace placeholders:");
    log.info(`  TemplateSnippet → ${name}`);
    return { name, dst, created: false, files: [] };
  }

  // Copy template
  cpSync(src, dst, { recursive: true });
  log.debug(`Copied template to ${dst}`);

  // Define replacements (file names and content)
  const replacements = [
    ["useTemplateSnippetController.ts", `use${name}Controller.ts`],
    ["TemplateSnippetView.tsx", `${name}View.tsx`],
    ["TemplateSnippetHeadless.tsx", `${name}Headless.tsx`],
    ["TemplateSnippet.tsx", `${name}.tsx`],
    ["TemplateSnippet.spec.tsx", `${name}.spec.tsx`],
    ["TemplateSnippet.stories.tsx", `${name}.stories.tsx`],
    ["TemplateSnippet.mdx", `${name}.mdx`],
    ["TemplateSnippet", name],
  ];

  const processedFiles = [];

  // Process files
  for (const file of readdirSync(dst)) {
    const srcPath = join(dst, file);
    let contents = readFileSync(srcPath, "utf8");

    // Replace content
    for (const [from, to] of replacements) {
      contents = contents.replaceAll(from, to);
    }

    // Determine output path
    let outPath = srcPath;
    for (const [from, to] of replacements) {
      if (outPath.endsWith(from)) {
        outPath = outPath.replace(from, to);
        break;
      }
    }

    // Write file
    writeFileSync(outPath, contents);
    processedFiles.push(outPath);

    // Remove old file if renamed
    if (outPath !== srcPath) {
      rmSync(srcPath);
      log.debug(`Renamed: ${file} → ${outPath.split("/").pop()}`);
    }
  }

  log.info(`Created snippet at ${dst}`);
  log.info(`Processed ${processedFiles.length} files`);
  log.info("Next steps:");
  log.info(
    `  - Import { Demo as ${name}Demo } from "../../snippets/${name}/${name}"; into demo/src/App.tsx`,
  );
  log.info("  - Run: pnpm dev or pnpm storybook");

  return { name, dst, created: true, files: processedFiles };
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  // Show help first, before any validation
  if (flags.help) {
    console.log(`
Usage: ${SCRIPT_NAME} <PascalCaseName> [options]

Create new snippet from template with all required files.

Arguments:
  name                      PascalCase snippet name (e.g., InlineEditLabel)

Options:
  --help                    Show this help message
  --dry-run                 Preview without creating files
  --output <fmt>            Output format: text (default), json
  --log-level <lvl>         Log level: error, warn, info (default), debug, trace
  --cwd <path>              Working directory (default: current)

Examples:
  ${SCRIPT_NAME} ButtonComponent
  ${SCRIPT_NAME} InlineEditLabel
  ${SCRIPT_NAME} CardView --dry-run

Exit codes:
  0  - Success (snippet created)
  1  - Failed (folder exists or invalid name)
  11 - Validation failed

Template Structure:
  snippets/_template/
    ├── TemplateSnippet.tsx              Main component
    ├── TemplateSnippetHeadless.tsx      Headless variant
    ├── TemplateSnippetView.tsx          View layer
    ├── useTemplateSnippetController.ts  Controller hook
    ├── TemplateSnippet.spec.tsx         Tests
    ├── TemplateSnippet.stories.tsx      Storybook stories
    ├── TemplateSnippet.mdx              Documentation
    └── ADOPTION.md                      Adoption guide
`);
    process.exit(0);
  }

  try {
    // Get name from positional arg or flag
    const name = flags._?.[0] || flags.name;

    const args = ArgsSchema.parse({
      ...flags,
      name,
    });

    // Create snippet
    const result = createSnippet(args.name, args.dryRun, log);

    succeed({
      script: SCRIPT_NAME,
      message: result.created
        ? `Created snippet: ${result.name}`
        : "Dry run completed",
      output: args.output,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error("Validation error:", error.errors);
      fail({
        script: SCRIPT_NAME,
        message: "Invalid arguments - name must be PascalCase",
        exitCode: 11,
        output: flags.output || "text",
        error,
      });
    }

    log.error("Failed to create snippet:", error.message);
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      exitCode: 1,
      output: flags.output || "text",
      error,
    });
  }
}

main();
