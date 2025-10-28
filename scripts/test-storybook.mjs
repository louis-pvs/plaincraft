#!/usr/bin/env node
/**
 * Storybook Test Runner with automatic server management
 * @since 2025-10-28
 * @version 1.0.0
 */

// Check for --help first
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Storybook Test Runner with automatic server management

Handles the full lifecycle:
1. Build Storybook (if not present or --rebuild flag)
2. Start static server
3. Wait for server ready
4. Run test-storybook
5. Clean up server

USAGE:
  node scripts/test-storybook.mjs [options]

OPTIONS:
  --help      Show this help
  --dry-run   Preview mode (default: false)
  --yes       Execute mode (default: true)
  --output    Output format: text|json (default: text)
  --log-level Log level (default: info)
  --cwd       Working directory (default: current)
  --rebuild   Force rebuild Storybook
  --json      Output in JSON format (deprecated, use --output json)

EXAMPLES:
  node scripts/test-storybook.mjs
  node scripts/test-storybook.mjs --rebuild
  node scripts/test-storybook.mjs --output json
`);
  process.exit(0);
}

/**
 * Storybook Test Runner with automatic server management
 *
 * Handles the full lifecycle:
 * 1. Build Storybook (if not present or --rebuild flag)
 * 2. Start static server
 * 3. Wait for server ready
 * 4. Run test-storybook
 * 5. Clean up server
 */

import { spawn } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { createServer, get } from "node:http";
import { URL, fileURLToPath } from "node:url";
import { dirname, extname, join, normalize } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const PORT = 6006;
const HOST = "127.0.0.1";
const TARGET_URL = `http://${HOST}:${PORT}`;
const STORYBOOK_DIR = join(ROOT, "storybook-static");

// Parse arguments
const args = process.argv.slice(2);
const shouldRebuild = args.includes("--rebuild");
const jsonOutput = args.includes("--json");
const outputFile = args
  .find((arg) => arg.startsWith("--outputFile="))
  ?.split("=")[1];

let exitCode = 0;
let serverInstance = null;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

/**
 * Execute a command and return promise
 */
function execCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: options.silent ? "ignore" : "inherit",
      shell: true,
      ...options,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

/**
 * Wait for server to be ready
 */
async function waitForServer(url, timeout = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await new Promise((resolve, reject) => {
        get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Server returned ${res.statusCode}`));
          }
          res.resume();
        }).on("error", reject);
      });
      console.log("✓ Server is ready");
      return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Server did not start within ${timeout}ms`);
}

/**
 * Start static file server
 */
async function startServer() {
  console.log(`Starting server on ${TARGET_URL}...`);

  serverInstance = createServer(async (req, res) => {
    const requestUrl =
      req.url !== undefined
        ? new URL(req.url, TARGET_URL)
        : new URL(TARGET_URL);
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const normalizedPath = normalize(decodedPath).replace(
      /^(\.\.(\/|\\|$))+/,
      "",
    );
    let filePath = join(STORYBOOK_DIR, normalizedPath);

    if (!filePath.startsWith(STORYBOOK_DIR)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    try {
      let fileStats = await stat(filePath);

      if (fileStats.isDirectory()) {
        filePath = join(filePath, "index.html");
        fileStats = await stat(filePath);
      }

      const ext = extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": fileStats.size,
      });

      const stream = createReadStream(filePath);
      stream.on("error", () => {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      });
      stream.pipe(res);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  await new Promise((resolve, reject) => {
    serverInstance.once("error", reject);
    serverInstance.listen(PORT, HOST, resolve);
  });

  // Wait for server to be ready
  await waitForServer(TARGET_URL);
}

/**
 * Stop the server
 */
async function stopServer() {
  if (serverInstance) {
    console.log("Stopping server...");
    await new Promise((resolve) => serverInstance.close(resolve));
    serverInstance = null;
  }
}

/**
 * Build Storybook if needed
 */
async function ensureStorybookBuild() {
  if (shouldRebuild && existsSync(STORYBOOK_DIR)) {
    console.log("Cleaning previous build...");
    await rm(STORYBOOK_DIR, { recursive: true, force: true });
  }

  if (!existsSync(STORYBOOK_DIR)) {
    console.log("Building Storybook...");
    await execCommand("pnpm", ["build:storybook"]);
  } else {
    console.log("✓ Using existing Storybook build");
  }
}

/**
 * Run test-storybook
 */
async function runTests() {
  console.log("Running Storybook tests...");

  const testArgs = [];

  if (jsonOutput) {
    testArgs.push("--json");
  }

  if (outputFile) {
    testArgs.push("--outputFile", outputFile);
  }

  // Add any other args that aren't our custom flags
  args
    .filter(
      (arg) =>
        !arg.startsWith("--rebuild") &&
        !arg.startsWith("--json") &&
        !arg.startsWith("--outputFile"),
    )
    .forEach((arg) => testArgs.push(arg));

  console.log(`Command: npx test-storybook ${testArgs.join(" ")}`);
  console.log(`Working directory: ${ROOT}`);
  console.log(`Target URL: ${TARGET_URL}`);

  try {
    // Run test-storybook directly via npx to avoid pnpm wrapping issues
    await execCommand("npx", ["test-storybook", ...testArgs], {
      env: { ...process.env, TARGET_URL },
      cwd: ROOT,
    });
    console.log("✓ All tests passed");

    // Verify output file was created if expected
    if (outputFile && existsSync(join(ROOT, outputFile))) {
      console.log(`✓ Output file created: ${outputFile}`);
    } else if (outputFile) {
      console.warn(`⚠ Output file not found: ${outputFile}`);
    }
  } catch {
    console.error("✗ Tests failed");
    exitCode = 1;

    // Still check if output file was created
    if (outputFile && existsSync(join(ROOT, outputFile))) {
      console.log(`✓ Output file created despite test failures: ${outputFile}`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🧪 Storybook Test Runner");
  console.log("========================\n");

  try {
    // Ensure Storybook is built
    await ensureStorybookBuild();

    // Start server
    await startServer();

    // Run tests
    await runTests();
  } catch (err) {
    console.error("Error:", err.message);
    exitCode = 1;
  } finally {
    // Always clean up
    await stopServer();

    process.exit(exitCode);
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT, cleaning up...");
  stopServer()
    .catch(() => {})
    .finally(() => process.exit(130));
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM, cleaning up...");
  stopServer()
    .catch(() => {})
    .finally(() => process.exit(143));
});

main();
