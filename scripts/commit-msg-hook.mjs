#!/usr/bin/env node
/**
 * Git commit-msg hook to enforce ticket ID prefix conventions
 *
 * Validates that commit messages follow the format:
 * [U-slug] Commit message
 * [C-slug] Commit message
 * [B-slug] Commit message
 * [ARCH-slug] Commit message
 * [PB-slug] Commit message
 *
 * This ensures consistency with CHANGELOG entries, PR titles, and
 * project tracking requirements.
 */

import { readFileSync } from "node:fs";
import { exit } from "node:process";

const COMMIT_MSG_FILE = process.argv[2];

if (!COMMIT_MSG_FILE) {
  console.error("Error: No commit message file provided");
  exit(1);
}

// Read the commit message
let commitMsg;
try {
  commitMsg = readFileSync(COMMIT_MSG_FILE, "utf8").trim();
} catch (error) {
  console.error(`Error reading commit message file: ${error.message}`);
  exit(1);
}

// Skip validation for merge commits, revert commits, and empty messages
if (
  commitMsg.startsWith("Merge") ||
  commitMsg.startsWith("Revert") ||
  commitMsg.length === 0
) {
  exit(0);
}

// Valid ticket prefixes according to guides/CHANGELOG-GUIDE.md
// U (Unit), C (Composition), B (Bug), ARCH (Architecture), PB (Playbook)
const TICKET_PREFIX_REGEX = /^\[(U|C|B|ARCH|PB)-[a-z0-9-]+\]/i;

// Check if commit message starts with valid ticket prefix
if (!TICKET_PREFIX_REGEX.test(commitMsg)) {
  console.error("\n❌ Invalid commit message format\n");
  console.error("Commit messages must start with a ticket ID prefix:\n");
  console.error("  [U-slug]    - Unit component");
  console.error("  [C-slug]    - Composition");
  console.error("  [B-slug]    - Bug fix");
  console.error("  [ARCH-slug] - Architecture");
  console.error("  [PB-slug]   - Playbook/Documentation\n");
  console.error("Examples:");
  console.error("  [U-button-component] Add accessible button component");
  console.error("  [ARCH-ci-split] Implement Playbook build track\n");
  console.error("Your commit message:");
  console.error(`  ${commitMsg}\n`);
  console.error(
    "See guides/CHANGELOG-GUIDE.md for commit message conventions.\n",
  );
  exit(1);
}

// Extract the ticket prefix for additional validation
const match = commitMsg.match(TICKET_PREFIX_REGEX);
const ticketPrefix = match[0];

// Ensure the ticket slug uses kebab-case (lowercase with hyphens)
const slugPart = ticketPrefix.slice(1, -1); // Remove [ and ]
const [prefix, ...slugParts] = slugPart.split("-");
const slug = slugParts.join("-");

if (slug !== slug.toLowerCase()) {
  console.error("\n⚠️  Warning: Ticket slug should be lowercase\n");
  console.error(`Current: ${ticketPrefix}`);
  console.error(`Suggested: [${prefix}-${slug.toLowerCase()}]\n`);
  // This is a warning, not a hard failure
}

// Check that there's a space after the ticket prefix
if (commitMsg[ticketPrefix.length] !== " ") {
  console.error("\n❌ Missing space after ticket prefix\n");
  console.error("Correct format: [TICKET-id] Commit message\n");
  console.error("Your commit message:");
  console.error(`  ${commitMsg}\n`);
  exit(1);
}

// Check that the commit message has meaningful content after the prefix
const messageContent = commitMsg.slice(ticketPrefix.length + 1).trim();
if (messageContent.length < 10) {
  console.error("\n⚠️  Commit message seems too short\n");
  console.error(
    "Please provide a meaningful description of your changes (at least 10 characters).\n",
  );
  // This is a warning, not a hard failure
}

// Success!
console.log(`✓ Commit message format validated: ${ticketPrefix}`);
exit(0);
