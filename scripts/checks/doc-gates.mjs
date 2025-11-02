#!/usr/bin/env node
/**
 * Basic Doc Gates (pilot skeleton)
 * - Fail if any file under generated projection paths is directly edited
 * - Fail if registry has duplicate IDs
 * - Warn if last_verified within 7 days of ttl expiry
 * - Warn if pattern template_ref missing or bumped without README change (hash check simplified)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import yaml from "js-yaml";

const root = process.cwd();
const registryPath = path.join(root, "docs", "_registry.yaml");

function readRegistry() {
  const content = fs.readFileSync(registryPath, "utf8");
  return yaml.loadAll(content).flat();
}

function hashFile(p) {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
  } catch {
    return null;
  }
}

function daysUntil(dateStr, ttlDays) {
  const last = new Date(dateStr);
  const expires = new Date(last.getTime() + ttlDays * 24 * 60 * 60 * 1000);
  return Math.ceil((expires.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function main() {
  const registry = readRegistry();
  const ids = new Set();
  const errors = [];
  const warnings = [];

  for (const entry of registry) {
    if (!entry.id) continue;
    if (ids.has(entry.id)) {
      errors.push(`Duplicate id in registry: ${entry.id}`);
    } else {
      ids.add(entry.id);
    }
    if (entry.last_verified && entry.ttl_days) {
      const remaining = daysUntil(entry.last_verified, entry.ttl_days);
      if (remaining <= 7) {
        warnings.push(
          `Verification nearing TTL for ${entry.id} (≤7 days remaining)`,
        );
      }
      if (remaining < 0) {
        warnings.push(
          `Stale: ${entry.id} past TTL by ${Math.abs(remaining)} days`,
        );
      }
    }
    if (entry.id === "PATTERN-inline-edit-label") {
      // Template ref check
      if (!entry.refs?.template_ref) {
        errors.push("Pattern entry missing template_ref");
      }
      const readmeHash = hashFile(
        path.join(root, "snippets", "InlineEditLabel", "README.md"),
      );
      if (entry.refs?.template_ref?.includes("@v0.1") && !readmeHash) {
        warnings.push("InlineEditLabel README not found for hash check");
      }
    }
  }

  // Simple projection edit detection (placeholder: integrate with CI diff env variables)
  const projectionDirs = ["playbook-static/patterns", "docs/.vitepress/dist"];
  const edited = (process.env.DOC_CHANGED_FILES || "")
    .split(",")
    .filter(Boolean);
  for (const f of edited) {
    if (projectionDirs.some((d) => f.startsWith(d))) {
      errors.push(`Direct edit to generated projection: ${f}`);
    }
  }

  if (errors.length) {
    console.error("\nDoc Gates FAILED");
    errors.forEach((e) => console.error("ERROR:", e));
    process.exit(1);
  }
  if (warnings.length) {
    console.warn("\nDoc Gates WARNINGS");
    warnings.forEach((w) => console.warn("WARN:", w));
  }
  console.log("Doc Gates PASSED");
}

main();
