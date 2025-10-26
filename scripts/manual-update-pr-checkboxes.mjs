#!/usr/bin/env node

/**
 * Manual script to update checkboxes in PR body for "Acceptance Checklist" and "Related Issue"
 * Usage: node scripts/manual-update-pr-checkboxes.mjs <pr-number> [--acceptance N,M,...] [--related N,M,...]
 * Example: node scripts/manual-update-pr-checkboxes.mjs 123 --acceptance 1,3 --related 1
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

function parseArgs() {
  const args = process.argv.slice(2);
  const prNumber = args[0];
  let acceptance = [];
  let related = [];
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--acceptance" && args[i + 1]) {
      acceptance = args[i + 1].split(",").map(Number);
      i++;
    } else if (args[i] === "--related" && args[i + 1]) {
      related = args[i + 1].split(",").map(Number);
      i++;
    }
  }
  return { prNumber, acceptance, related };
}

function updateCheckboxesInSection(section, checkedIndexes) {
  let idx = 0;
  return section.replace(/- \[.\] /g, (match) => {
    idx++;
    return checkedIndexes.includes(idx) ? "- [x] " : "- [ ] ";
  });
}

async function main() {
  const { prNumber, acceptance, related } = parseArgs();
  if (!prNumber) {
    console.error(
      "Usage: node scripts/manual-update-pr-checkboxes.mjs <pr-number> [--acceptance N,M,...] [--related N,M,...]",
    );
    process.exit(1);
  }

  // Fetch PR body
  const { stdout } = await execAsync(
    `gh pr view ${prNumber} --json body -q .body`,
  );
  let body = stdout;

  // Update Acceptance Checklist
  body = body.replace(
    /(# Acceptance Checklist\n+)([\s\S]*?)(\n+---|\n+#|$)/,
    (match, header, section, tail) => {
      const updated = updateCheckboxesInSection(section, acceptance);
      return `${header}${updated}${tail}`;
    },
  );

  // Update Related Issue checkboxes
  body = body.replace(
    /(# Related Issue\n+)([\s\S]*?)(\n+#|$)/,
    (match, header, section, tail) => {
      const updated = updateCheckboxesInSection(section, related);
      return `${header}${updated}${tail}`;
    },
  );

  // Update PR body
  await execAsync(`gh pr edit ${prNumber} --body @-`, { input: body });
  console.log(`✅ Updated PR #${prNumber} checkboxes.`);
}

main();
