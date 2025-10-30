#!/usr/bin/env node
/**
 * template-coverage.mjs
 * @since 2025-10-28
 * @version 2.0.0
 * Summary: Validate template completeness and README coverage guardrails
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { Logger, parseFlags, repoRoot, fail, succeed } from "../_lib/core.mjs";

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

const COLLECTIONS = ["snippets", "components", "flows", "scripts"];
const NO_README_MARKER = "// no-readme";

const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/template-coverage.mjs [options]

Options:
  --help              Show this help message
  --dry-run           Preview mode without making changes (default: true)
  --yes               Execute mode (confirms execution)
  --cwd <path>        Working directory (default: process.cwd())
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)

Description:
  Ensures templates stay complete and developer folders stay documented:
  - Every template has README, USAGE, and template.config.json
  - template.config.json carries required metadata fields
  - Collections (snippets/components/flows/scripts) surface missing READMEs
    or require an explicit "// no-readme" marker with justification

Exit codes:
  0  - Success (errors=0)
  11 - Validation failed (errors>0)
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");

async function listTemplates(root) {
  const templatesDir = path.join(root, "templates");
  const entries = await readdir(templatesDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      dir: path.join(templatesDir, entry.name),
    }));
}

async function validateTemplate(template) {
  const errors = [];
  const warnings = [];

  for (const file of REQUIRED_TEMPLATE_FILES) {
    const filePath = path.join(template.dir, file);
    if (!existsSync(filePath)) {
      errors.push(`Missing required file: ${file}`);
    }
  }

  const configPath = path.join(template.dir, "template.config.json");
  if (!existsSync(configPath)) {
    errors.push("template.config.json missing");
  } else {
    try {
      const raw = await readFile(configPath, "utf-8");
      const config = JSON.parse(raw);

      for (const field of REQUIRED_CONFIG_FIELDS) {
        if (!config[field]) {
          errors.push(`Missing config field: ${field}`);
        }
      }

      if (config.version && !/^\d+\.\d+\.\d+$/.test(config.version)) {
        warnings.push(`Version should use semver (found: ${config.version})`);
      }
    } catch (error) {
      errors.push(`Invalid template.config.json: ${error.message}`);
    }
  }

  return {
    name: template.name,
    errors,
    warnings,
  };
}

async function findMissingReadmes(root) {
  const warnings = [];

  for (const collection of COLLECTIONS) {
    const collectionPath = path.join(root, collection);
    try {
      const stats = await stat(collectionPath);
      if (!stats.isDirectory()) continue;
    } catch {
      continue;
    }

    const entries = await readdir(collectionPath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith("_")) continue;

      const readmePath = path.join(collectionPath, entry.name, "README.md");
      if (existsSync(readmePath)) continue;

      const markerFound = await searchNoReadmeMarker(
        path.join(collectionPath, entry.name),
      );

      if (!markerFound) {
        warnings.push(
          `${collection}/${entry.name} missing README.md or "// no-readme" marker`,
        );
      }
    }
  }

  return warnings;
}

async function searchNoReadmeMarker(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const child = await searchNoReadmeMarker(path.join(dir, entry.name));
      if (child) return true;
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|mdx?)$/i.test(entry.name)) {
      const content = await readFile(path.join(dir, entry.name), "utf-8");
      if (content.includes(NO_README_MARKER)) {
        return true;
      }
    }
  }
  return false;
}

(async () => {
  try {
    const root = await repoRoot(args.cwd);
    const templates = await listTemplates(root);

    const results = [];
    let errors = 0;
    let warnings = 0;

    for (const template of templates) {
      const result = await validateTemplate(template);
      results.push(result);
      errors += result.errors.length;
      warnings += result.warnings.length;
      if (result.errors.length || result.warnings.length) {
        logger.debug(
          `Template ${template.name} → ${result.errors.length} errors, ${result.warnings.length} warnings`,
        );
      }
    }

    const coverageWarnings = await findMissingReadmes(root);
    warnings += coverageWarnings.length;

    const payload = {
      ok: errors === 0,
      templatesChecked: templates.length,
      errors,
      warnings,
      results,
      coverageWarnings,
    };

    if (errors > 0) {
      fail({
        exitCode: 11,
        message: "Template coverage validation failed",
        output: args.output,
        script: "template-coverage",
        error: payload,
      });
    } else {
      succeed({
        output: args.output,
        script: "template-coverage",
        message: "Template coverage validation passed",
        ...payload,
      });
    }
  } catch (error) {
    fail({
      exitCode: 11,
      message: error.message,
      output: args.output,
      script: "template-coverage",
      error: { stack: error.stack },
    });
  }
})();
