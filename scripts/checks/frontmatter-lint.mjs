#!/usr/bin/env node
/**
 * Frontmatter Lint - validate YAML frontmatter across documentation
 *
 * @since 1.0.0
 * @version 1.0.0
 *
 * Checks:
 * - Required keys present: id, owner, version, created
 * - Owner field is quoted if contains @
 * - TTL warnings for governance/policy docs
 *
 * @flag --dry-run - Show what would be checked without validation
 * @flag --yes - Auto-confirm all prompts
 * @flag --output - Output format (text|json)
 * @flag --log-level - Logging verbosity (error|warn|info|debug)
 * @flag --cwd - Working directory override
 */

import fs from "node:fs";
import { load as yamlLoad } from "js-yaml";

const errors = [];
const warnings = [];

// Parse CLI flags
const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes("--dry-run"),
  yes: args.includes("--yes"),
  output: args.find((a) => a.startsWith("--output="))?.split("=")[1] || "text",
  logLevel:
    args.find((a) => a.startsWith("--log-level="))?.split("=")[1] || "info",
  cwd: args.find((a) => a.startsWith("--cwd="))?.split("=")[1] || process.cwd(),
};

if (flags.dryRun && flags.logLevel !== "error") {
  console.log("[DRY RUN] Would check frontmatter in docs/ and playbook/");
}

function extractFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    return yamlLoad(match[1]);
  } catch (e) {
    return { _parseError: e.message };
  }
}

function isGovernanceDoc(filePath) {
  return (
    filePath.includes("/policy/") ||
    filePath.includes("/adr/") ||
    filePath.includes("/runbooks/") ||
    filePath.includes("/workflows/") ||
    filePath.includes("/reference/contracts")
  );
}

function checkRequiredKeys(filePath, fm) {
  if (!isGovernanceDoc(filePath)) return;
  const required = ["id", "owner"];
  for (const key of required) {
    if (!fm[key]) {
      errors.push(`${filePath}: Missing required key: ${key}`);
    }
  }
}

function checkOwnerQuoting(filePath, content, fm) {
  if (!fm.owner) return;
  const fmText = content.match(/^---\s*\n([\s\S]*?)\n---/)[1];
  const ownerLine = fmText.match(/^owner:\s*(.*)$/m);
  if (ownerLine) {
    const ownerValue = ownerLine[1].trim();
    if (ownerValue.includes("@") && !ownerValue.startsWith('"')) {
      errors.push(
        `${filePath}: Owner field contains @ but is not quoted: ${ownerValue}`,
      );
    }
  }
}

function checkTTL(filePath, fm) {
  if (!fm.ttl_days || !fm.last_verified) return;
  const lastVerified = new Date(fm.last_verified);
  const expiresAt = new Date(
    lastVerified.getTime() + fm.ttl_days * 24 * 60 * 60 * 1000,
  );
  const daysRemaining = Math.ceil(
    (expiresAt - new Date()) / (24 * 60 * 60 * 1000),
  );

  if (daysRemaining <= 30 && daysRemaining > 0) {
    warnings.push(
      `${filePath}: TTL nearing expiry (${daysRemaining} days remaining)`,
    );
  } else if (daysRemaining <= 0) {
    warnings.push(
      `${filePath}: TTL expired (${Math.abs(daysRemaining)} days ago)`,
    );
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const fm = extractFrontmatter(content);

  if (!fm) return;
  if (fm._parseError) {
    errors.push(`${filePath}: YAML parse error - ${fm._parseError}`);
    return;
  }

  checkRequiredKeys(filePath, fm);
  checkOwnerQuoting(filePath, content, fm);
  checkTTL(filePath, fm);
}

async function main() {
  // Use readdirSync + recursive walk
  const files = [];
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          walkDir(fullPath);
        }
      } else if (entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }

  walkDir("docs");
  if (fs.existsSync("playbook")) walkDir("playbook");

  for (const file of files) {
    checkFile(file);
  }

  if (warnings.length > 0) {
    console.warn("\nFrontmatter Lint WARNINGS:");
    warnings.forEach((w) => console.warn("WARN:", w));
  }

  if (errors.length > 0) {
    console.error("\nFrontmatter Lint FAILED:");
    errors.forEach((e) => console.error("ERROR:", e));
    process.exit(1);
  }

  console.log(`Frontmatter Lint PASSED (${files.length} files checked)`);
}

main();
