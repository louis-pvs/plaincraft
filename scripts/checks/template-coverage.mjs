#!/usr/bin/env node
/**
 * template-coverage.mjs
 * @since 2025-10-28
 * @version 1.0.0
 * Summary: Enforce 3:1 template:guide ratio and validate template completeness
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";

const GUIDES_DIR = path.join(process.cwd(), "guides");
const TEMPLATES_DIR = path.join(process.cwd(), "templates");
const TARGET_RATIO = 3.0;
const REQUIRED_TEMPLATE_FILES = [
  "README.md",
  "USAGE.md",
  "template.config.json",
];
const REQUIRED_CONFIG_FIELDS = [
  "id",
  "name",
  "version",
  "category",
  "entrypoint",
];

/**
 * Parse CLI arguments
 */
function parseFlags() {
  const { values } = parseArgs({
    options: {
      "check-ratio": { type: "boolean", default: false },
      orphans: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(`
template-coverage.mjs - Enforce template:guide ratio and validate templates

USAGE:
  node scripts/checks/template-coverage.mjs [OPTIONS]

OPTIONS:
  --check-ratio      Only check if ratio >= 3:1
  --orphans          List templates not referenced by any guide
  --json             Output JSON format
  --help             Show this help
  --output <format>   Output format: text|json (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current)
  --yes               Execute mode (confirms execution)
  --dry-run           Preview mode without making changes (default: true)

EXAMPLES:
  node scripts/checks/template-coverage.mjs
  node scripts/checks/template-coverage.mjs --check-ratio
  node scripts/checks/template-coverage.mjs --orphans --json

EXIT CODES:
  0  - All checks passed, ratio met
  11 - Validation failed (ratio not met or missing templates)
`);
    process.exit(0);
  }

  return values;
}

/**
 * Count templates (directories with template.config.json + root template files)
 */
async function countTemplates() {
  const items = await readdir(TEMPLATES_DIR, { withFileTypes: true });
  let directoryTemplates = 0;
  let rootTemplates = 0;
  const templateNames = [];

  for (const item of items) {
    if (item.isDirectory()) {
      const configPath = path.join(
        TEMPLATES_DIR,
        item.name,
        "template.config.json",
      );
      if (existsSync(configPath)) {
        directoryTemplates++;
        templateNames.push(item.name);
      }
    } else if (
      item.isFile() &&
      item.name.endsWith(".json") &&
      item.name !== "template.schema.json"
    ) {
      rootTemplates++;
      templateNames.push(item.name.replace(/\.json$/, ""));
    }
  }

  return {
    total: directoryTemplates + rootTemplates,
    directories: directoryTemplates,
    rootFiles: rootTemplates,
    names: templateNames,
  };
}

/**
 * Count active guides (guide-*.md files, excluding README and _archive)
 */
async function countGuides() {
  const files = await readdir(GUIDES_DIR);
  const guideFiles = files.filter(
    (f) => f.startsWith("guide-") && f.endsWith(".md"),
  );

  return {
    count: guideFiles.length,
    files: guideFiles,
  };
}

/**
 * Extract frontmatter from markdown
 */
function extractFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = {};
  const lines = frontmatterMatch[1].split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      frontmatter[key] = value.trim();
    }
  }

  return frontmatter;
}

/**
 * Get scaffold_ref from all guides
 */
async function getGuideReferences() {
  const guides = await countGuides();
  const references = new Map();

  for (const guideFile of guides.files) {
    const content = await readFile(path.join(GUIDES_DIR, guideFile), "utf-8");
    const frontmatter = extractFrontmatter(content);

    if (frontmatter?.scaffold_ref) {
      // Parse /templates/name@version or /templates/name
      const match = frontmatter.scaffold_ref.match(
        /^\/templates\/([^@]+)(@.+)?$/,
      );
      if (match) {
        const templateName = match[1];
        if (!references.has(templateName)) {
          references.set(templateName, []);
        }
        references.get(templateName).push(guideFile);
      }
    }
  }

  return references;
}

/**
 * Validate a single template directory
 */
async function validateTemplateDir(templateName) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  const errors = [];
  const warnings = [];

  // Check required files
  for (const requiredFile of REQUIRED_TEMPLATE_FILES) {
    const filePath = path.join(templatePath, requiredFile);
    if (!existsSync(filePath)) {
      errors.push(`Missing required file: ${requiredFile}`);
    }
  }

  // Validate template.config.json
  const configPath = path.join(templatePath, "template.config.json");
  if (existsSync(configPath)) {
    try {
      const configContent = await readFile(configPath, "utf-8");
      const config = JSON.parse(configContent);

      // Check required fields
      for (const field of REQUIRED_CONFIG_FIELDS) {
        if (!config[field]) {
          errors.push(`template.config.json missing required field: ${field}`);
        }
      }

      // Validate semver
      if (config.version && !/^\d+\.\d+\.\d+$/.test(config.version)) {
        errors.push(
          `template.config.json version must follow semver (x.y.z): ${config.version}`,
        );
      }

      // Check entrypoint exists
      if (config.entrypoint) {
        const entrypointPath = path.join(templatePath, config.entrypoint);
        if (!existsSync(entrypointPath)) {
          warnings.push(`entrypoint file does not exist: ${config.entrypoint}`);
        }
      }
    } catch (error) {
      errors.push(`template.config.json is not valid JSON: ${error.message}`);
    }
  }

  return { errors, warnings };
}

/**
 * Main execution
 */
async function main() {
  const args = parseFlags();

  try {
    const templates = await countTemplates();
    const guides = await countGuides();
    const references = await getGuideReferences();

    const actualRatio =
      guides.count > 0 ? templates.total / guides.count : templates.total;
    const ratioMet = actualRatio >= TARGET_RATIO;

    const orphanedTemplates = templates.names.filter(
      (name) => !references.has(name),
    );

    const missingTemplates = [];
    for (const [templateName, guideFiles] of references.entries()) {
      if (!templates.names.includes(templateName)) {
        missingTemplates.push({ template: templateName, guides: guideFiles });
      }
    }

    // Validate all template directories
    const templateValidations = [];
    for (const templateName of templates.names) {
      const validation = await validateTemplateDir(templateName);
      if (validation.errors.length > 0 || validation.warnings.length > 0) {
        templateValidations.push({
          template: templateName,
          ...validation,
        });
      }
    }

    const errors = [];
    const warnings = [];

    // Check ratio
    if (!ratioMet) {
      errors.push(
        `Template:guide ratio (${actualRatio.toFixed(1)}:1) is below target (${TARGET_RATIO}:1)`,
      );
    }

    // Check missing templates
    if (missingTemplates.length > 0) {
      for (const missing of missingTemplates) {
        errors.push(
          `Template "${missing.template}" referenced by guides but does not exist: ${missing.guides.join(", ")}`,
        );
      }
    }

    // Check orphaned templates
    if (orphanedTemplates.length > 0) {
      warnings.push(
        `${orphanedTemplates.length} template(s) not referenced by any guide`,
      );
    }

    // Add template validation errors
    for (const validation of templateValidations) {
      for (const error of validation.errors) {
        errors.push(`[${validation.template}] ${error}`);
      }
      for (const warning of validation.warnings) {
        warnings.push(`[${validation.template}] ${warning}`);
      }
    }

    const ok = errors.length === 0;

    // Output
    if (args.json) {
      console.log(
        JSON.stringify(
          {
            ok,
            templateCount: templates.total,
            guideCount: guides.count,
            ratio: `${templates.total}:${guides.count}`,
            ratioMet,
            targetRatio: TARGET_RATIO,
            actualRatio: parseFloat(actualRatio.toFixed(1)),
            orphanedTemplates,
            missingTemplates: missingTemplates.map((m) => m.template),
            errors,
            warnings,
          },
          null,
          2,
        ),
      );
    } else if (args["check-ratio"]) {
      // Simple ratio check mode
      if (ratioMet) {
        console.log(
          `✓ Template:guide ratio met: ${templates.total}:${guides.count} = ${actualRatio.toFixed(1)}:1 (target: ${TARGET_RATIO}:1)`,
        );
      } else {
        console.log(
          `✗ Template:guide ratio NOT met: ${templates.total}:${guides.count} = ${actualRatio.toFixed(1)}:1 (target: ${TARGET_RATIO}:1)`,
        );
      }
    } else if (args.orphans) {
      // Orphans mode
      if (orphanedTemplates.length === 0) {
        console.log(
          "✓ No orphaned templates found - all templates referenced by guides",
        );
      } else {
        console.log(
          `\n⚠ Found ${orphanedTemplates.length} orphaned template(s):\n`,
        );
        for (const template of orphanedTemplates) {
          console.log(`  • ${template}`);
        }
        console.log(
          "\nConsider creating guides for these templates or removing if unused.\n",
        );
      }
    } else {
      // Full report
      console.log("\n📦 Documentation Governance - Template Coverage");
      console.log("═".repeat(60));
      console.log(`\n📊 Ratio Check`);
      console.log(
        `Templates: ${templates.total} (${templates.directories} directories + ${templates.rootFiles} root files)`,
      );
      console.log(`Guides: ${guides.count}`);
      console.log(
        `Ratio: ${templates.total}:${guides.count} = ${actualRatio.toFixed(1)}:1`,
      );
      console.log(`Target: ${TARGET_RATIO}:1`);
      console.log(`Status: ${ratioMet ? "✓ PASSING" : "✗ FAILING"}`);

      if (orphanedTemplates.length > 0) {
        console.log(`\n📋 Orphaned Templates (${orphanedTemplates.length})`);
        console.log("Templates not referenced by any guide:");
        for (const template of orphanedTemplates) {
          console.log(`  • ${template}`);
        }
      }

      if (missingTemplates.length > 0) {
        console.log(`\n❌ Missing Templates (${missingTemplates.length})`);
        console.log("Templates referenced by guides but do not exist:");
        for (const missing of missingTemplates) {
          console.log(`  • ${missing.template}`);
          console.log(`    Referenced by: ${missing.guides.join(", ")}`);
        }
      }

      if (references.size > 0) {
        console.log(`\n✓ Referenced Templates (${references.size})`);
        for (const [template, guideFiles] of references.entries()) {
          if (templates.names.includes(template)) {
            console.log(`  • ${template} → ${guideFiles.join(", ")}`);
          }
        }
      }

      if (templateValidations.length > 0) {
        console.log(`\n⚠ Template Validation Issues`);
        for (const validation of templateValidations) {
          console.log(`\n  ${validation.template}:`);
          if (validation.errors.length > 0) {
            console.log("    Errors:");
            for (const error of validation.errors) {
              console.log(`      • ${error}`);
            }
          }
          if (validation.warnings.length > 0) {
            console.log("    Warnings:");
            for (const warning of validation.warnings) {
              console.log(`      • ${warning}`);
            }
          }
        }
      }

      if (errors.length > 0 || warnings.length > 0) {
        console.log("\n" + "═".repeat(60));
        console.log(`Errors: ${errors.length}`);
        console.log(`Warnings: ${warnings.length}`);
      }

      console.log("\n" + "═".repeat(60));
      if (ok) {
        console.log("✓ All checks passed\n");
      } else {
        console.log(
          `✗ ${errors.length} error(s) found - template coverage violated\n`,
        );
      }
    }

    process.exit(ok ? 0 : 11);
  } catch (error) {
    if (args.json) {
      console.error(
        JSON.stringify({
          ok: false,
          error: error.message,
        }),
      );
    } else {
      console.error(`\n✗ Error: ${error.message}\n`);
    }
    process.exit(11);
  }
}

main();
