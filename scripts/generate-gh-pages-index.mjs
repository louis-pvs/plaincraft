#!/usr/bin/env node
/**
 * Generate root index.html for gh-pages deployment
 * @since 2025-10-28
 * @version 1.1.0
 */

import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { parseFlags, Logger, atomicWrite } from "./_lib/core.mjs";

/**
 * Extract recent changelog entries (last 3 versions with content)
 */
function extractRecentChangelog(changelogText) {
  const lines = changelogText.split("\n");
  const entries = [];
  let currentVersion = null;
  let currentContent = [];

  for (const line of lines) {
    // Match version headers like ## [0.4.0] - 2025-10-27
    const versionMatch = line.match(/^##\s+\[([^\]]+)\]\s+-\s+(.+)/);
    if (versionMatch) {
      // Save previous entry if it has content
      if (currentVersion && currentContent.length > 0) {
        entries.push({
          version: currentVersion.version,
          date: currentVersion.date,
          content: currentContent.join("\n").trim(),
        });
        if (entries.length >= 3) break;
      }
      // Start new entry
      currentVersion = {
        version: versionMatch[1],
        date: versionMatch[2],
      };
      currentContent = [];
    } else if (currentVersion && line.startsWith("### ")) {
      // Feature/section headers
      currentContent.push(line.replace(/^###\s+/, ""));
    } else if (currentVersion && line.trim().startsWith("-")) {
      // List items
      currentContent.push(line.trim());
    }
  }

  // Save last entry if it has content
  if (currentVersion && currentContent.length > 0 && entries.length < 3) {
    entries.push({
      version: currentVersion.version,
      date: currentVersion.date,
      content: currentContent.join("\n").trim(),
    });
  }

  return entries;
}

/**
 * Generate 404 page
 */
function generate404Page(version, gitHash) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found | Plaincraft</title>
  <meta name="description" content="Page not found">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      padding: 2rem;
      text-align: center;
    }
    .container { max-width: 600px; }
    h1 { font-size: 6rem; margin-bottom: 1rem; opacity: 0.9; }
    h2 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1.1rem; margin-bottom: 2rem; opacity: 0.9; }
    .links { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    a {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      color: #fff;
      text-decoration: none;
      transition: all 0.3s;
    }
    a:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    footer {
      margin-top: 3rem;
      font-size: 0.875rem;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <div class="links">
      <a href="/plaincraft/">Home</a>
      <a href="/plaincraft/storybook/">Storybook</a>
      <a href="/plaincraft/playbook/">Playbook</a>
      <a href="/plaincraft/docs/">Docs</a>
    </div>
    <footer>
      <p>plaincraft v${version} • ${gitHash}</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  // Show help first
  if (flags.help) {
    console.log(`
Generate root index.html for gh-pages deployment

This creates a landing page that links to:
- /demo - Live application demo
- /storybook - Component library documentation
- /playbook - Architecture and patterns documentation

USAGE:
  node scripts/generate-gh-pages-index.mjs [options]

OPTIONS:
  --output-dir <dir> Output directory (default: _deploy)
  --dry-run          Preview without writing
  --log-level <level> Log level (default: info)
  --cwd <path>        Working directory (default: current)
  --yes              Skip confirmation
  --help             Show this help

EXAMPLES:
  # Generate with dry-run
  node scripts/generate-gh-pages-index.mjs

  # Generate to custom directory
  node scripts/generate-gh-pages-index.mjs --yes --output-dir=dist
`);
    process.exit(0);
  }

  const outputDir = flags["output-dir"] || flags._[0] || "_deploy";
  const outputPath = join(outputDir, "index.html");

  // Get version and git info
  const packageJson = JSON.parse(
    await import("node:fs/promises").then((fs) =>
      fs.readFile(join(process.cwd(), "package.json"), "utf-8"),
    ),
  );
  const version = packageJson.version || "0.0.0";

  // Try to get git info
  let gitHash = "unknown";
  let deployDate = new Date().toISOString();
  try {
    const { execa } = await import("execa");
    const { stdout: hash } = await execa("git", [
      "rev-parse",
      "--short",
      "HEAD",
    ]);
    gitHash = hash.trim();
  } catch {
    // Git not available or not a repo
  }

  // Extract recent changelog
  let recentChanges = [];
  try {
    const changelogPath = join(process.cwd(), "CHANGELOG.md");
    const changelogText = await readFile(changelogPath, "utf-8");
    recentChanges = extractRecentChangelog(changelogText);
  } catch {
    // Changelog not available
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plaincraft Project</title>
  <meta name="description" content="Component library, demo, and documentation for Plaincraft">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      text-align: center;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 1.25rem;
      margin-bottom: 3rem;
      opacity: 0.95;
    }
    .links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .link-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 2rem 1.5rem;
      text-decoration: none;
      color: #fff;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .link-card:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    .link-card-icon {
      font-size: 2rem;
      opacity: 0.9;
    }
    .link-card-title {
      font-size: 1.25rem;
      font-weight: 600;
    }
    .link-card-desc {
      font-size: 0.875rem;
      opacity: 0.8;
    }
    .whats-new {
      margin-top: 4rem;
      text-align: left;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }
    .whats-new h2 {
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .changelog-entry {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 1rem;
    }
    .changelog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .changelog-version {
      font-size: 1.1rem;
      font-weight: 600;
    }
    .changelog-date {
      font-size: 0.875rem;
      opacity: 0.7;
    }
    .changelog-content {
      font-size: 0.875rem;
      line-height: 1.6;
      opacity: 0.9;
    }
    .changelog-content p {
      margin: 0;
    }
    footer {
      margin-top: 4rem;
      opacity: 0.7;
      font-size: 0.875rem;
    }
    @media (max-width: 640px) {
      h1 {
        font-size: 2rem;
      }
      p {
        font-size: 1rem;
      }
      .links {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Plaincraft</h1>
    <p>Accessible React components with scripts-first governance</p>
    
    <div class="links">
      <a href="/plaincraft/demo/" class="link-card">
        <div class="link-card-icon">🚀</div>
        <div class="link-card-title">Demo</div>
        <div class="link-card-desc">Live application demo</div>
      </a>
      
      <a href="/plaincraft/storybook/" class="link-card">
        <div class="link-card-icon">📚</div>
        <div class="link-card-title">Storybook</div>
        <div class="link-card-desc">Component library</div>
      </a>
      
      <a href="/plaincraft/playbook/" class="link-card">
        <div class="link-card-icon">📖</div>
        <div class="link-card-title">Playbook</div>
        <div class="link-card-desc">Architecture & patterns</div>
      </a>
      
      <a href="/plaincraft/docs/" class="link-card">
        <div class="link-card-icon">📋</div>
        <div class="link-card-title">Docs</div>
        <div class="link-card-desc">Workflows & governance</div>
      </a>
    </div>

    ${
      recentChanges.length > 0
        ? `
    <div class="whats-new">
      <h2>What's New</h2>
      ${recentChanges
        .map(
          (entry) => `
      <div class="changelog-entry">
        <div class="changelog-header">
          <span class="changelog-version">v${entry.version}</span>
          <span class="changelog-date">${entry.date}</span>
        </div>
        <div class="changelog-content">
          <p>${entry.content.split("\n").slice(0, 3).join("<br>")}</p>
        </div>
      </div>`,
        )
        .join("")}
      <p style="text-align: center; margin-top: 1.5rem; font-size: 0.875rem;">
        <a href="https://github.com/louis-pvs/plaincraft/blob/main/CHANGELOG.md" style="color: rgba(255, 255, 255, 0.9); text-decoration: underline;">View Full Changelog</a>
      </p>
    </div>
    `
        : ""
    }

    <footer>
      <p>
        <strong>plaincraft v${version}</strong> • <code>${gitHash}</code>
      </p>
      <p style="margin-top: 0.5rem;">
        <a href="https://github.com/louis-pvs/plaincraft" style="color: rgba(255, 255, 255, 0.9); text-decoration: underline;">GitHub</a> • 
        <a href="https://github.com/louis-pvs/plaincraft/issues" style="color: rgba(255, 255, 255, 0.9); text-decoration: underline;">Issues</a> • 
        <a href="https://github.com/louis-pvs/plaincraft/blob/main/CHANGELOG.md" style="color: rgba(255, 255, 255, 0.9); text-decoration: underline;">Changelog</a>
      </p>
      <p style="margin-top: 0.5rem; font-size: 0.75rem;">
        Deployed: ${new Date(deployDate).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
      </p>
      <p style="margin-top: 0.25rem; font-size: 0.75rem;">
        Maintained by <a href="https://github.com/louis-pvs" style="color: rgba(255, 255, 255, 0.9); text-decoration: underline;">Louis Phang</a>
      </p>
    </footer>
  </div>
</body>
</html>
`;

  if (flags.dryRun) {
    log.info(`[DRY-RUN] Would write index.html to: ${outputPath}`);
    if (flags.output === "json") {
      console.log(
        JSON.stringify({
          ok: true,
          script: "generate-gh-pages-index",
          dryRun: true,
          outputPath,
        }),
      );
    }
    process.exit(0);
  }

  try {
    await atomicWrite(outputPath, html);
    log.info(`Generated root index.html at ${outputPath}`);

    // Also generate 404 page
    const notFoundPath = join(outputDir, "404.html");
    const notFoundHtml = generate404Page(version, gitHash);
    await atomicWrite(notFoundPath, notFoundHtml);
    log.info(`Generated 404.html at ${notFoundPath}`);

    if (flags.output === "json") {
      console.log(
        JSON.stringify({
          ok: true,
          script: "generate-gh-pages-index",
          outputPath,
        }),
      );
    }
  } catch (error) {
    log.error(`Failed to generate index.html: ${error.message}`);
    if (flags.output === "json") {
      console.log(
        JSON.stringify({
          ok: false,
          script: "generate-gh-pages-index",
          error: error.message,
        }),
      );
    }
    process.exit(1);
  }
}

main();
