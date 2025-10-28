#!/usr/bin/env node

/**
 * Test script for Sub-Issues section replacement
 * Usage: node scripts/test-subissue-replacement.mjs <parent-issue-number> <child-issue-1> <child-issue-2> ...
 */

import { writeFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

async function testUpdateParent(parentIssueNumber, childIssueNumbers) {
  console.log(
    `\n🧪 Testing Sub-Issues replacement for parent #${parentIssueNumber}`,
  );

  try {
    // Build task list from child issue numbers
    const taskList = childIssueNumbers
      .map((num, idx) => `- [ ] #${num} Test Child Issue ${idx + 1}`)
      .join("\n");

    console.log("\nChild issues to add:");
    console.log(taskList);

    // Get current issue body
    console.log(`\n📖 Fetching current body of issue #${parentIssueNumber}...`);
    const { stdout } = await execAsync(
      `gh issue view ${parentIssueNumber} --json body`,
    );
    const currentBody = JSON.parse(stdout).body || "";

    console.log("\nCurrent body:");
    console.log("─".repeat(50));
    console.log(currentBody);
    console.log("─".repeat(50));

    // Check if Sub-Issues section already exists
    const subIssuesRegex = /## Sub-Issues\s*[\s\S]*?(?=\n##|$)/;
    const hasSubIssues = subIssuesRegex.test(currentBody);

    console.log(
      `\n🔍 Sub-Issues section exists: ${hasSubIssues ? "YES" : "NO"}`,
    );

    // Replace existing section or append new one
    let updatedBody;
    if (hasSubIssues) {
      updatedBody = currentBody.replace(
        subIssuesRegex,
        `## Sub-Issues\n\n${taskList}`,
      );
      console.log("✏️  Action: REPLACING existing Sub-Issues section");
    } else {
      updatedBody = `${currentBody}\n\n## Sub-Issues\n\n${taskList}`;
      console.log("✏️  Action: APPENDING new Sub-Issues section");
    }

    console.log("\nUpdated body:");
    console.log("─".repeat(50));
    console.log(updatedBody);
    console.log("─".repeat(50));

    // Check if auto-confirm flag is passed
    const autoConfirm =
      process.argv.includes("--yes") || process.argv.includes("-y");

    if (!autoConfirm) {
      console.log("\n❓ To apply this update, run with --yes flag");
      return;
    }

    // Write to temp file
    const bodyFile = `/tmp/test-parent-issue-body-${Date.now()}.md`;
    await writeFile(bodyFile, updatedBody);

    // Update issue
    await execAsync(
      `gh issue edit ${parentIssueNumber} --body-file "${bodyFile}"`,
    );

    console.log(`\n✅ Updated parent issue #${parentIssueNumber}`);
    console.log(
      `   View at: https://github.com/louis-pvs/plaincraft/issues/${parentIssueNumber}`,
    );
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

// Parse arguments
const args = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
if (args.length < 2) {
  console.error(
    "Usage: node scripts/test-subissue-replacement.mjs <parent-issue> <child-issue-1> [child-issue-2] ... [--yes]",
  );
  console.error(
    "Example: node scripts/test-subissue-replacement.mjs 52 53 54 --yes",
  );
  process.exit(1);
}

const parentIssue = args[0];
const childIssues = args.slice(1);

testUpdateParent(parentIssue, childIssues);
