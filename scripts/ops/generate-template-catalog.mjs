#!/usr/bin/env node
/**
 * generate-template-catalog.mjs
 * @since 2025-10-28
 * @version 0.1.0
 *
 * Auto-generate discoverable template index with usage examples
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { parseFlags, Logger, atomicWrite, repoRoot } from "../_lib/core.mjs";

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  if (flags.help) {
    console.log(`
Generate template catalog (templates/index.md)

Auto-generates discoverable template index with:
- Template metadata from template.config.json
- Usage examples from USAGE.md
- Guide references
- Category grouping

USAGE:
  node scripts/ops/generate-template-catalog.mjs [options]

OPTIONS:
  --output-file <path>   Output file path (default: templates/INDEX.md)
  --dry-run              Preview without writing
  --log-level <level> Log level (default: info)
  --cwd <path>        Working directory (default: current)
  --yes                  Skip confirmation
  --help                 Show this help

EXAMPLES:
  # Generate catalog (dry-run by default)
  node scripts/ops/generate-template-catalog.mjs

  # Generate and write
  node scripts/ops/generate-template-catalog.mjs --yes

  # Custom output path
  node scripts/ops/generate-template-catalog.mjs --yes --output-file=docs/templates.md
`);
    process.exit(0);
  }

  const root = await repoRoot(flags.cwd);
  const templatesDir = join(root, "templates");
  const guidesDir = join(root, "guides");
  const outputPath = flags["output-file"] || join(templatesDir, "INDEX.md");

  log.info("📦 Scanning templates directory...");

  // Scan templates
  const templates = await scanTemplates(templatesDir, log);
  log.info(`Found ${templates.length} templates`);

  // Find guide references
  const guideRefs = await findGuideReferences(guidesDir, log);
  log.info(`Found ${Object.keys(guideRefs).length} guide references`);

  // Group by category
  const categorized = groupByCategory(templates);

  // Generate markdown
  const markdown = generateCatalog(templates, categorized, guideRefs);

  if (flags.dryRun) {
    log.info(`[DRY-RUN] Would write catalog to: ${outputPath}`);
    log.info(`\nPreview (first 500 chars):\n${markdown.slice(0, 500)}...`);

    if (flags.output === "json") {
      console.log(
        JSON.stringify({
          ok: true,
          script: "generate-template-catalog",
          dryRun: true,
          outputPath,
          templateCount: templates.length,
          categories: Object.keys(categorized),
        }),
      );
    }
    process.exit(0);
  }

  // Write catalog
  await atomicWrite(outputPath, markdown);
  log.info(`✓ Generated template catalog: ${outputPath}`);

  if (flags.output === "json") {
    console.log(
      JSON.stringify({
        ok: true,
        script: "generate-template-catalog",
        outputPath,
        templateCount: templates.length,
        categories: Object.keys(categorized),
      }),
    );
  }
}

/**
 * Scan templates directory for all templates
 */
async function scanTemplates(templatesDir, log) {
  const entries = await readdir(templatesDir, { withFileTypes: true });
  const templates = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_")) continue;

    const templatePath = join(templatesDir, entry.name);
    const configPath = join(templatePath, "template.config.json");

    if (!existsSync(configPath)) {
      log.warn(`Template ${entry.name} missing template.config.json`);
      continue;
    }

    try {
      const config = JSON.parse(await readFile(configPath, "utf-8"));
      const readme = await readFileIfExists(join(templatePath, "README.md"));
      const usage = await readFileIfExists(join(templatePath, "USAGE.md"));

      templates.push({
        id: entry.name,
        config,
        readme,
        usage,
        path: `./` + entry.name,
      });
    } catch (error) {
      log.warn(`Failed to read template ${entry.name}: ${error.message}`);
    }
  }

  return templates.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Find which guides reference which templates
 */
async function findGuideReferences(guidesDir, log) {
  const refs = {};

  if (!existsSync(guidesDir)) return refs;

  const guides = await readdir(guidesDir);

  for (const guide of guides) {
    if (!guide.endsWith(".md")) continue;

    const content = await readFile(join(guidesDir, guide), "utf-8");

    // Look for scaffold_ref in frontmatter
    const frontmatterMatch = content.match(
      /scaffold_ref:\s*\/templates\/([^\s\n]+)/,
    );
    if (frontmatterMatch) {
      const templateId = frontmatterMatch[1].split("@")[0]; // Remove version
      if (!refs[templateId]) refs[templateId] = [];
      refs[templateId].push(guide);
    }

    // Also look for template references in content
    const templateRefs = content.matchAll(/\/templates\/([a-z-]+)/g);
    for (const match of templateRefs) {
      const templateId = match[1];
      if (!refs[templateId]) refs[templateId] = [];
      if (!refs[templateId].includes(guide)) {
        refs[templateId].push(guide);
      }
    }
  }

  return refs;
}

/**
 * Group templates by category
 */
function groupByCategory(templates) {
  const categorized = {};

  for (const template of templates) {
    const category = template.config.category || "other";
    if (!categorized[category]) categorized[category] = [];
    categorized[category].push(template);
  }

  return categorized;
}

/**
 * Generate catalog markdown
 */
function generateCatalog(templates, categorized, guideRefs) {
  const timestamp = new Date().toISOString().split("T")[0];

  let md = `# Template Catalog\n\n`;
  md += `**Auto-generated:** ${timestamp}  \n`;
  md += `**Total Templates:** ${templates.length}\n\n`;
  md += `> 📖 See \`/guides/\` directory for usage guides that reference these templates\n\n`;
  md += `---\n\n`;

  // Table of contents
  md += `## Quick Navigation\n\n`;
  for (const [category, temps] of Object.entries(categorized)) {
    md += `- **${capitalize(category)}** (${temps.length})\n`;
    for (const t of temps) {
      md += `  - [${t.config.name || t.id}](#${t.id})\n`;
    }
  }
  md += `\n---\n\n`;

  // Templates by category
  for (const [category, temps] of Object.entries(categorized)) {
    md += `## ${capitalize(category)} Templates\n\n`;

    for (const template of temps) {
      md += generateTemplateSection(template, guideRefs);
      md += `\n---\n\n`;
    }
  }

  // Orphaned templates (no guide references)
  const orphaned = templates.filter(
    (t) => !guideRefs[t.id] || guideRefs[t.id].length === 0,
  );
  if (orphaned.length > 0) {
    md += `## ⚠️ Orphaned Templates\n\n`;
    md += `These templates are not referenced by any guides. Consider creating a guide or removing if unused.\n\n`;
    for (const t of orphaned) {
      md += `- **${t.id}** (${t.config.version}) - ${t.config.description}\n`;
    }
    md += `\n`;
  }

  md += `---\n\n`;
  md += `*Generated by \`scripts/ops/generate-template-catalog.mjs\`*\n`;
  md += `*Run \`pnpm templates:catalog --yes\` to regenerate*\n`;

  return md;
}

/**
 * Generate section for a single template
 */
function generateTemplateSection(template, guideRefs) {
  const { id, config, path } = template;
  const refs = guideRefs[id] || [];

  let md = `### ${config.name || id}\n\n`;

  if (config.description) {
    md += `${config.description}\n\n`;
  }

  md += `**Version:** ${config.version}  \n`;
  md += `**Category:** ${config.category}  \n`;
  md += `**Created:** ${config.created}  \n`;

  if (refs.length > 0) {
    md += `**Referenced by:** ${refs.map((g) => `[${g}](../guides/${g})`).join(", ")}  \n`;
  } else {
    md += `**Referenced by:** ⚠️ None (consider creating a guide)  \n`;
  }

  md += `\n`;

  // Quick start example
  if (config.entrypoint) {
    md += `**Quick Start:**\n\n\`\`\`bash\n`;
    md += `cp ${path}/${config.entrypoint} .\n`;
    md += `\`\`\`\n\n`;
  }

  // Links
  md += `📁 [View in repo](${path}) | `;
  md += `📖 [README](${path}/README.md) | `;
  md += `🚀 [USAGE](${path}/USAGE.md)\n\n`;

  // Schema info if available
  if (config.schema) {
    md += `<details>\n<summary>Schema Details</summary>\n\n`;
    md += `\`\`\`json\n${JSON.stringify(config.schema, null, 2)}\n\`\`\`\n\n`;
    md += `</details>\n\n`;
  }

  return md;
}

/**
 * Helper: Read file if it exists
 */
async function readFileIfExists(path) {
  if (!existsSync(path)) return null;
  return await readFile(path, "utf-8");
}

/**
 * Helper: Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

main();
