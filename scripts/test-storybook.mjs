#!/usr/bin/env node
/**
 * Storybook Test Runner with automatic server management
 *
 * Handles the full lifecycle:
 * 1. Build Storybook (if not present or --rebuild flag)
 * 2. Start static server
 * 3. Wait for server ready
 * 4. Run test-storybook
 * 5. Clean up server
 *
 * Usage:
 *   node scripts/test-storybook.mjs
 *   node scripts/test-storybook.mjs --rebuild
 *   node scripts/test-storybook.mjs --json
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { get } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

let serverProcess = null;
let exitCode = 0;

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

  serverProcess = spawn(
    "pnpm",
    [
      "dlx",
      "http-server",
      STORYBOOK_DIR,
      "--port",
      String(PORT),
      "--host",
      HOST,
      "--silent",
    ],
    { stdio: "ignore", shell: true },
  );

  serverProcess.on("error", (err) => {
    console.error("Server process error:", err);
  });

  // Wait for server to be ready
  await waitForServer(TARGET_URL);
}

/**
 * Stop the server
 */
function stopServer() {
  if (serverProcess) {
    console.log("Stopping server...");
    serverProcess.kill();
    serverProcess = null;
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

  const testArgs = ["test-storybook"];

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

  try {
    await execCommand("pnpm", testArgs, {
      env: { ...process.env, TARGET_URL },
    });
    console.log("✓ All tests passed");
  } catch {
    console.error("✗ Tests failed");
    exitCode = 1;
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
    stopServer();

    // Wait a bit for cleanup
    await new Promise((resolve) => setTimeout(resolve, 500));

    process.exit(exitCode);
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT, cleaning up...");
  stopServer();
  process.exit(130);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM, cleaning up...");
  stopServer();
  process.exit(143);
});

main();
