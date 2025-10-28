#!/usr/bin/env node
/**
 * docs-report.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Generate documentation governance health dashboard with metrics
 */

import path from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";
import {
  parseFlags,
  fail,
  succeed,
  Logger,
  repoRoot,
  generateRunId,
} from "../_lib/core.mjs";
import { checkRatio, listTemplates } from "../_lib/templates.mjs";

const start = Date.now();
const args = parseFlags(process.argv.slice(2));

if (args.help) {
  console.log(`
Usage: node scripts/checks/docs-report.mjs [options]

Options:
  --help              Show this help message
  --output <format>   Output format: json|text (default: text)
  --log-level <level> Log level: trace|debug|info|warn|error (default: info)
  --cwd <path>        Working directory (default: current directory)
  --save              Save metrics to docs/metrics.json
  --quiet             Minimal output

Description:
  Generates health dashboard for documentation governance system:
  - Template:guide ratio and trend
  - Guide health (word count, TTL, warnings)
  - Orphaned templates
  - Template coverage analysis
  - Recommendations for improvement

Exit codes:
  0  - Success

Examples:
  node scripts/checks/docs-report.mjs
  node scripts/checks/docs-report.mjs --output json --save
`);
  process.exit(0);
}

const logger = new Logger(args.logLevel || "info");
const runId = generateRunId();
const quiet = args.quiet === true;

async function analyzeGuideHealth(root) {
  const guidesDir = path.join(root, "guides");
  const files = await readdir(guidesDir);
  const guideFiles = files.filter(
    (f) => f.startsWith("guide-") && f.endsWith(".md"),
  );

  const health = [];

  for (const file of guideFiles) {
    const filePath = path.join(guidesDir, file);
    const content = await readFile(filePath, "utf8");

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let created = null;
    let ttlDays = 90;

    if (frontmatterMatch) {
      const fm = frontmatterMatch[1];
      const createdMatch = fm.match(/created:\s*(.+)/);
      const ttlMatch = fm.match(/ttl_days:\s*(\d+)/);
      if (createdMatch) created = createdMatch[1].trim();
      if (ttlMatch) ttlDays = parseInt(ttlMatch[1], 10);
    }

    // Count words (exclude frontmatter and code blocks)
    const bodyContent = content
      .replace(/^---\n[\s\S]*?\n---/, "")
      .replace(/```[\s\S]*?```/g, "");
    const words = bodyContent.split(/\s+/).filter((w) => w.length > 0).length;

    // Calculate TTL
    let daysRemaining = null;
    if (created) {
      const createdDate = new Date(created);
      const expiryDate = new Date(createdDate);
      expiryDate.setDate(expiryDate.getDate() + ttlDays);
      const now = new Date();
      daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    }

    // Check for long paragraphs
    const paragraphs = bodyContent.split(/\n\n+/);
    const longParagraphs = paragraphs.filter(
      (p) => p.split("\n").length > 5,
    ).length;

    health.push({
      file,
      words,
      capacity: Math.round((words / 600) * 100),
      ttlDays: daysRemaining,
      warnings: longParagraphs > 0 ? `${longParagraphs} long paragraphs` : null,
      status:
        daysRemaining < 7 ? "expiring" : words > 600 ? "over-limit" : "healthy",
    });
  }

  return health;
}

async function analyzeTemplateReferences(root) {
  const guidesDir = path.join(root, "guides");
  const files = await readdir(guidesDir);
  const guideFiles = files.filter(
    (f) => f.startsWith("guide-") && f.endsWith(".md"),
  );

  const references = new Map();

  for (const file of guideFiles) {
    const filePath = path.join(guidesDir, file);
    const content = await readFile(filePath, "utf8");

    // Find template references
    const templateRefs = content.match(/\/templates\/([a-z0-9-]+)/g) || [];
    for (const ref of templateRefs) {
      const templateName = ref.replace("/templates/", "");
      if (!references.has(templateName)) {
        references.set(templateName, []);
      }
      references.get(templateName).push(file);
    }
  }

  return references;
}

function generateTextReport(data) {
  const lines = [];

  lines.push("");
  lines.push("📊 Documentation Governance Report");
  lines.push(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  lines.push("");

  // Overall Health
  lines.push("📈 Overall Health");
  lines.push(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  lines.push(`Templates:        ${data.templates}`);
  lines.push(`Guides:           ${data.guides}`);
  lines.push(
    `Ratio:            ${data.templates}:${data.guides} = ${data.ratio.toFixed(1)}:1 ${data.ratioPassing ? "✓" : "✗"}`,
  );
  lines.push(
    `Ratio Status:     ${data.ratioPassing ? "PASSING" : "FAILING"} (target: 3:1)`,
  );
  lines.push("");

  // Guide Health
  lines.push("📝 Guide Health");
  lines.push(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  for (const guide of data.guideHealth) {
    const icon =
      guide.status === "healthy"
        ? "✓"
        : guide.status === "expiring"
          ? "⚠"
          : "✗";
    lines.push(`${icon} ${guide.file}`);
    lines.push(`  Words: ${guide.words}/600 (${guide.capacity}% capacity)`);
    if (guide.ttlDays !== null) {
      lines.push(`  TTL: ${guide.ttlDays} days remaining`);
    }
    if (guide.warnings) {
      lines.push(`  Warnings: ${guide.warnings}`);
    }
    lines.push(`  Status: ${guide.status}`);
    lines.push("");
  }

  // Template Coverage
  lines.push("📦 Template Coverage");
  lines.push(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  if (data.orphanedTemplates.length > 0) {
    lines.push("Orphaned Templates (not referenced by guides):");
    for (const t of data.orphanedTemplates) {
      lines.push(`  • ${t}`);
    }
    lines.push("");
  }

  if (Object.keys(data.referencedTemplates).length > 0) {
    lines.push("Referenced Templates:");
    for (const [template, guides] of Object.entries(data.referencedTemplates)) {
      lines.push(`  ✓ ${template} → ${guides.join(", ")}`);
    }
    lines.push("");
  }

  // Recommendations
  if (data.recommendations.length > 0) {
    lines.push("🎯 Recommendations");
    lines.push(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );
    for (const rec of data.recommendations) {
      lines.push(`→ ${rec}`);
    }
    lines.push("");
  }

  lines.push(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  lines.push(`Report generated: ${new Date().toISOString()}`);
  lines.push("");

  return lines.join("\n");
}

try {
  const root = await repoRoot(args.cwd);

  // Gather metrics
  const ratioCheck = await checkRatio(root);
  const templates = await listTemplates(root);
  const guideHealth = await analyzeGuideHealth(root);
  const templateRefs = await analyzeTemplateReferences(root);

  // Find orphaned templates
  const orphaned = templates
    .filter((t) => !templateRefs.has(t.id))
    .map((t) => t.id);

  // Generate recommendations
  const recommendations = [];
  if (!ratioCheck.canAddGuide) {
    recommendations.push(
      `Create ${ratioCheck.needsTemplates} more template(s) to reach 3:1 ratio`,
    );
  }
  for (const t of orphaned) {
    recommendations.push(`Consider creating guide for '${t}' template`);
  }
  for (const guide of guideHealth) {
    if (guide.warnings) {
      recommendations.push(
        `Break long paragraphs in ${guide.file} into checklists`,
      );
    }
    if (guide.status === "expiring") {
      recommendations.push(`Update or archive ${guide.file} (TTL expiring)`);
    }
  }

  const reportData = {
    timestamp: new Date().toISOString(),
    templates: ratioCheck.templates,
    guides: ratioCheck.guides,
    ratio: ratioCheck.ratio,
    ratioPassing: ratioCheck.canAddGuide,
    guideHealth,
    orphanedTemplates: orphaned,
    referencedTemplates: Object.fromEntries(templateRefs),
    recommendations,
  };

  // Save metrics if requested
  if (args.save) {
    const metricsPath = path.join(root, "docs", "metrics.json");
    await writeFile(metricsPath, JSON.stringify(reportData, null, 2));
    if (!quiet) logger.info(`Metrics saved to ${metricsPath}`);
  }

  // Output
  if (args.output === "json") {
    console.log(JSON.stringify(reportData, null, 2));
  } else {
    console.log(generateTextReport(reportData));
  }

  succeed({
    runId,
    script: "docs-report",
    version: "0.1.0",
    ...reportData,
    durationMs: Date.now() - start,
  });
} catch (error) {
  fail({
    runId,
    script: "docs-report",
    error: error.message,
    durationMs: Date.now() - start,
  });
  process.exit(11);
}
