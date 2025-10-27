#!/usr/bin/env node

/**
 * Setup GitHub repository labels for the pipeline.
 * Creates lane labels (lane:A, lane:B, lane:C, lane:D) used for project board columns.
 */

import { execSync } from "child_process";

const labels = [
  { name: "lane:A", color: "0E8A16", description: "Lane A - Discovery" },
  { name: "lane:B", color: "1D76DB", description: "Lane B - In Progress" },
  { name: "lane:C", color: "FBCA04", description: "Lane C - Review" },
  { name: "lane:D", color: "5319E7", description: "Lane D - Done" },
];

console.log("🏷️  Setting up repository labels...\n");

for (const label of labels) {
  try {
    // Try to create the label (will fail if it exists)
    execSync(
      `gh label create "${label.name}" --color "${label.color}" --description "${label.description}"`,
      { stdio: "inherit" },
    );
    console.log(`✅ Created label: ${label.name}`);
  } catch {
    // Label probably already exists, try to edit it instead
    try {
      execSync(
        `gh label edit "${label.name}" --color "${label.color}" --description "${label.description}"`,
        { stdio: "inherit" },
      );
      console.log(`✏️  Updated label: ${label.name}`);
    } catch {
      console.log(`⚠️  Could not create/update label: ${label.name}`);
    }
  }
}

console.log("\n✨ Label setup complete!");
