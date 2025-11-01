#!/usr/bin/env node
/**
 * yaml-lint.mjs
 * @since 2025-11-08
 * @version 0.1.0
 * Summary: Validate YAML files (including GitHub workflows) parse correctly.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { load } from "js-yaml";
import { parseFlags, resolveLogLevel, Logger } from "../_lib/core.mjs";

const args = parseFlags(process.argv.slice(2));
const logger = new Logger(resolveLogLevel({ flags: args }));
const reportMode = Boolean(args.report);

if (args.help) {
  console.log(`
Usage: node scripts/checks/yaml-lint.mjs [options]

Options:
  --help              Show this help message
  --dry-run           Preview mode (no effect, CLI contract compliance)
  --yes               Execute mode (no effect, read-only)
  --output <format>   Output format: json|text (default: text)
  --cwd <path>        Working directory (default: current)
  --paths <globs>     Comma-separated paths/globs to lint (default: .github/workflows/*.yml)
  --log-level <lvl>   Log level trace|debug|info|warn|error (default: info)
  --report            Emit machine-readable JSON summary
`);
  process.exit(0);
}

const DEFAULT_GLOBS = [".github/workflows", ".github"];

function collectTargets(root, inputs) {
  const includeDirs = inputs.length > 0 ? inputs : DEFAULT_GLOBS;
  return includeDirs.map((entry) => path.resolve(root, entry));
}

async function* walkFiles(entry) {
  let stat;
  try {
    stat = await fs.stat(entry);
  } catch {
    return;
  }

  if (stat.isDirectory()) {
    const items = await fs.readdir(entry);
    for (const item of items) {
      yield* walkFiles(path.join(entry, item));
    }
  } else if (stat.isFile()) {
    const ext = path.extname(entry).toLowerCase();
    if (ext === ".yml" || ext === ".yaml") {
      yield entry;
    }
  }
}

(async () => {
  try {
    const root = path.resolve(args.cwd || process.cwd());
    const inputs = args.paths
      ? String(args.paths)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const seeds = collectTargets(root, inputs);

    const files = [];
    for (const seed of seeds) {
      for await (const file of walkFiles(seed)) {
        files.push(file);
      }
    }

    logger.debug("YAML lint targets", { count: files.length });

    const failures = [];

    for (const file of files) {
      try {
        const contents = await fs.readFile(file, "utf-8");
        load(contents);
      } catch (error) {
        failures.push({
          file: path.relative(root, file),
          message: error?.message || String(error),
        });
      }
    }

    const payload = {
      script: "yaml-lint",
      total: files.length,
      failures,
      passed: failures.length === 0,
    };

    if (reportMode) {
      console.log(JSON.stringify({ "yaml-lint": payload }, null, 2));
      process.exitCode = failures.length === 0 ? 0 : 11;
      return;
    }

    if (failures.length === 0) {
      process.exitCode = 0;
      return;
    }

    for (const failure of failures) {
      console.error(`✗ ${failure.file}: ${failure.message}`);
    }
    process.exitCode = 11;
  } catch (error) {
    const message = error?.message || String(error);
    if (reportMode) {
      console.log(
        JSON.stringify(
          {
            "yaml-lint": {
              error: message,
            },
          },
          null,
          2,
        ),
      );
      process.exitCode = 11;
      return;
    }
    console.error(`yaml-lint failed: ${message}`);
    process.exitCode = 11;
  }
})();
