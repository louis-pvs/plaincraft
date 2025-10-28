#!/usr/bin/env node
/**
 * new-guide.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Interactive wizard to create compliant guides with template-first enforcement
 */

import path from "node:path";
import { existsSync } from "node:fs";
import {
  parseFlags,
  fail,
  succeed,
  Logger,
  repoRoot,
  generateRunId,
  atomicWrite,
} from "../_lib/core.mjs";
import {
  checkRatio,
  listTemplates,
  validateTemplateRef,
  generateGuideContent,
} from "../_lib/templates.mjs";

const start = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/ops/new-guide.mjs [options]

Options:
  --help                Show this help message
  --dry-run             Preview changes without writing (default: true)
  --yes                 Execute writes (overrides --dry-run)
  --output <format>     Output format: json|text (default: text)
  --log-level <level>   Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>          Working directory (default: current directory)
  --slug <slug>         Guide slug (REQUIRED, e.g., deployment, testing)
  --template-ref <ref>  Template reference path (REQUIRED, e.g., /templates/guide@v0.1.0)

Description:
  Creates a new guide following template-first governance:
  - Enforces 3:1 template:guide ratio before allowing creation
  - Requires valid template reference (scaffold_ref)
  - Pre-fills frontmatter with governance metadata

Exit codes:
  0  - Success
  2  - Noop (guide already exists)
  10 - Precondition failed (ratio violation, no template)
  11 - Validation failed

Examples:
  node scripts/ops/new-guide.mjs --yes --slug deployment --template-ref /templates/guide@v0.1.0
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");
const runId = generateRunId();
const dryRun = args.dryRun !== false && args.yes !== true;

logger.info(`Starting new-guide wizard (runId: ${runId})`);

async function preflight(root) {
  const guidesDir = path.join(root, "guides");
  const templatesDir = path.join(root, "templates");
  if (!existsSync(guidesDir) || !existsSync(templatesDir)) {
    throw new Error("guides/ or templates/ directory not found");
  }
}

try {
  const root = await repoRoot(args.cwd);
  await preflight(root);

  // Check ratio
  const ratioCheck = await checkRatio(root);
  logger.info(
    `Current ratio: ${ratioCheck.templates}:${ratioCheck.guides} = ${ratioCheck.ratio.toFixed(1)}:1`,
  );

  if (!ratioCheck.canAddGuide) {
    throw new Error(
      `Template-first enforcement: Need ${ratioCheck.needsTemplates} more template(s) before adding guide. ` +
        `Current ratio ${ratioCheck.ratio.toFixed(1)}:1, target 3:1`,
    );
  }

  // List templates
  const templates = await listTemplates(root);
  logger.debug(`Available templates: ${templates.map((t) => t.id).join(", ")}`);

  // Get slug (required via CLI)
  const slug = args.slug;
  if (!slug) {
    throw new Error(
      "Missing required flag: --slug <slug>. Guide slug must be provided (e.g., --slug deployment)",
    );
  }

  // Validate slug
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    throw new Error(
      "Guide slug must be lowercase kebab-case (e.g., deployment)",
    );
  }

  const guidePath = path.join(root, "guides", `guide-${slug}.md`);
  if (existsSync(guidePath)) {
    throw new Error(`Guide already exists: ${guidePath}`);
  }

  // Get template reference (required via CLI)
  const templateRef = args.templateRef;
  if (!templateRef) {
    logger.info("Available templates:");
    templates.forEach((t, i) => {
      logger.info(`  ${i + 1}. ${t.id} (${t.category}) - ${t.ref}`);
    });
    throw new Error(
      "Missing required flag: --template-ref <ref>. Example: --template-ref /templates/guide@v0.1.0",
    );
  }

  // Validate template exists
  const isValidTemplate = await validateTemplateRef(root, templateRef);
  if (!isValidTemplate) {
    throw new Error(
      `Invalid template reference: ${templateRef}. Use format /templates/name@version`,
    );
  }

  // Generate content
  const owner = args.owner || "@maintainer";
  const lane = args.lane || "D";
  const content = generateGuideContent(slug, templateRef, owner, lane);

  // Dry run
  if (dryRun) {
    succeed({
      runId,
      script: "new-guide",
      version: "0.1.0",
      dryRun: true,
      slug,
      guidePath: `guides/guide-${slug}.md`,
      templateRef,
      ratioCheck,
      durationMs: Date.now() - start,
    });
    process.exit(0);
  }

  // Execute
  await atomicWrite(guidePath, content);

  succeed({
    runId,
    script: "new-guide",
    version: "0.1.0",
    slug,
    guidePath: `guides/guide-${slug}.md`,
    templateRef,
    ratioCheck: {
      before: `${ratioCheck.templates}:${ratioCheck.guides}`,
      after: `${ratioCheck.templates}:${ratioCheck.guides + 1}`,
    },
    durationMs: Date.now() - start,
  });
} catch (error) {
  fail({
    runId,
    script: "new-guide",
    error: error.message,
    durationMs: Date.now() - start,
  });

  if (error.message.includes("Template-first enforcement")) {
    process.exit(10);
  } else if (error.message.includes("already exists")) {
    process.exit(2);
  } else {
    process.exit(11);
  }
}
