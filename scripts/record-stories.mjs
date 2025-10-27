#!/usr/bin/env node
/**
 * Record Storybook stories with Playwright and convert to GIFs
 *
 * Usage:
 *   STORIES=all node scripts/record-stories.mjs
 *   STORIES=component--story-id node scripts/record-stories.mjs
 *   STORIES=component--story-1,component--story-2 node scripts/record-stories.mjs
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { chromium } from "@playwright/test";

const TARGET_URL = process.env.TARGET_URL || "http://127.0.0.1:6006";
const STORIES_FILTER = process.env.STORIES || "all";
const VIDEO_DIR = "artifacts/video";
const GIF_DIR = "docs/assets/gif";

// Ensure output directories exist
if (!existsSync(VIDEO_DIR)) {
  await mkdir(VIDEO_DIR, { recursive: true });
}
if (!existsSync(GIF_DIR)) {
  await mkdir(GIF_DIR, { recursive: true });
}

/**
 * Convert video to optimized GIF using ffmpeg
 * Target: 960px width, ~2MB max size, 10-second cap
 */
async function videoToGif(videoPath, gifPath) {
  return new Promise((resolve, reject) => {
    // Generate palette for better quality
    const paletteFile = videoPath.replace(".webm", "-palette.png");

    const paletteCmd = spawn("ffmpeg", [
      "-i",
      videoPath,
      "-vf",
      "fps=15,scale=960:-1:flags=lanczos,palettegen",
      "-y",
      paletteFile,
    ]);

    paletteCmd.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Palette generation failed with code ${code}`));
        return;
      }

      // Convert to GIF using palette
      const gifCmd = spawn("ffmpeg", [
        "-i",
        videoPath,
        "-i",
        paletteFile,
        "-filter_complex",
        "fps=15,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse",
        "-y",
        gifPath,
      ]);

      gifCmd.on("close", (gifCode) => {
        if (gifCode === 0) {
          console.log(`✓ Generated GIF: ${basename(gifPath)}`);
          resolve();
        } else {
          reject(new Error(`GIF conversion failed with code ${gifCode}`));
        }
      });

      gifCmd.on("error", reject);
    });

    paletteCmd.on("error", reject);
  });
}

/**
 * Get list of stories to record
 */
async function getStoryList(page) {
  const stories = [];

  try {
    await page.goto(TARGET_URL);
    await page.waitForSelector("#storybook-preview-iframe", { timeout: 10000 });

    // Get all story links from sidebar
    const storyElements = await page
      .locator('[data-item-id][data-ref-id="storybook_internal"]')
      .all();

    for (const el of storyElements) {
      const itemId = await el.getAttribute("data-item-id");
      if (itemId && itemId.includes("--")) {
        // Check if story has a 'record' tag by navigating to it
        // For now, we'll record all stories if STORIES=all
        stories.push(itemId);
      }
    }
  } catch (error) {
    console.error("Failed to fetch story list:", error.message);
    throw error;
  }

  return stories;
}

/**
 * Record a single story
 * Maximum recording time: 10 seconds
 */
async function recordStory(page, storyId) {
  const videoPath = join(VIDEO_DIR, `${storyId}.webm`);
  const gifPath = join(GIF_DIR, `${storyId}.gif`);

  try {
    // Navigate to story
    await page.goto(`${TARGET_URL}/iframe.html?id=${storyId}&viewMode=story`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500); // Let animations settle

    // Start recording
    await page.video()?.saveAs(videoPath);

    // Record for maximum 10 seconds
    await page.waitForTimeout(10000);

    console.log(`✓ Recorded video: ${basename(videoPath)}`);

    // Convert to GIF
    await videoToGif(videoPath, gifPath);

    return { storyId, videoPath, gifPath, success: true };
  } catch (error) {
    console.error(`✗ Failed to record ${storyId}:`, error.message);
    return { storyId, error: error.message, success: false };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🎬 Starting story recording...");
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Filter: ${STORIES_FILTER}`);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 960, height: 600 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 960, height: 600 },
    },
  });

  const page = await context.newPage();

  try {
    // Determine which stories to record
    let storyIds = [];

    if (STORIES_FILTER === "all") {
      storyIds = await getStoryList(page);
      console.log(`Found ${storyIds.length} stories`);
    } else {
      storyIds = STORIES_FILTER.split(",").map((s) => s.trim());
      console.log(`Recording ${storyIds.length} specified stories`);
    }

    // Record each story
    const results = [];
    for (const storyId of storyIds) {
      console.log(`\nRecording: ${storyId}`);
      const result = await recordStory(page, storyId);
      results.push(result);
    }

    await context.close();
    await browser.close();

    // Summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log("\n📊 Recording Summary:");
    console.log(`  ✓ Successful: ${successful}`);
    console.log(`  ✗ Failed: ${failed}`);

    if (failed > 0) {
      console.log("\nFailed stories:");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.storyId}: ${r.error}`);
        });
    }

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Fatal error:", error);
    await context.close();
    await browser.close();
    process.exit(1);
  }
}

main();
