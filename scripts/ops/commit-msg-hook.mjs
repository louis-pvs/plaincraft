#!/usr/bin/env node

/**
 * Commit message hook
 *
 * This hook validates commit messages according to conventional commit format.
 * It can be extended to enforce project-specific commit message conventions.
 *
 * Currently a placeholder that allows all commits to pass.
 */

import { readFileSync } from "node:fs";

const commitMsgFile = process.argv[2];

if (!commitMsgFile) {
  console.error("Error: No commit message file provided");
  process.exit(1);
}

try {
  const commitMsg = readFileSync(commitMsgFile, "utf-8").trim();

  // Skip validation for merge commits, revert commits, etc.
  if (
    commitMsg.startsWith("Merge") ||
    commitMsg.startsWith("Revert") ||
    commitMsg.startsWith("Automated")
  ) {
    process.exit(0);
  }

  // Basic validation: ensure commit message is not empty
  if (commitMsg.length === 0) {
    console.error("Error: Commit message cannot be empty");
    process.exit(1);
  }

  // Optional: Validate conventional commit format
  // Uncomment to enforce: type(scope): description
  // const conventionalCommitRegex = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: .{1,}/;
  // if (!conventionalCommitRegex.test(commitMsg)) {
  //   console.error("Error: Commit message must follow conventional commit format");
  //   console.error("Format: type(scope): description");
  //   console.error("Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build");
  //   process.exit(1);
  // }

  // Commit message is valid
  process.exit(0);
} catch (error) {
  console.error(`Error reading commit message: ${error.message}`);
  process.exit(1);
}
