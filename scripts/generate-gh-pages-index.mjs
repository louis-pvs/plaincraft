#!/usr/bin/env node
/**
 * Generate root index.html for gh-pages deployment
 * @version 1.0.0
 */

import { join } from "node:path";
import { parseFlags, Logger, atomicWrite } from "./_lib/core.mjs";

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
    <p>Component library, demo, and documentation</p>
    
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
    </div>

    <footer>
      <p>Built with ❤️ by the Plaincraft team</p>
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
    log.success(`Generated root index.html at ${outputPath}`);

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
