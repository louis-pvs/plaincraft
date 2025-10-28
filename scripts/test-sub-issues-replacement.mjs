#!/usr/bin/env node

/**
 * Test script to verify Sub-Issues section replacement logic
 * Tests the regex and replacement behavior without needing GitHub API
 */

console.log("🧪 Testing Sub-Issues Section Replacement\n");

// The regex from the implementation
const subIssuesRegex = /## Sub-Issues\s*[\s\S]*?(?=\n##|$)/;

// Test case 1: Body with no Sub-Issues section
console.log("Test 1: Body with NO Sub-Issues section");
console.log("=".repeat(50));
const body1 = `# ARCH-test

Lane: C
Purpose: Test purpose

## Problem

Some problem description.

## Proposal

Some proposal.

## Acceptance Checklist

- [ ] Item 1
- [ ] Item 2`;

const taskList = `- [ ] #10 First sub-issue
- [ ] #11 Second sub-issue
- [ ] #12 Third sub-issue`;

const hasSubIssues1 = subIssuesRegex.test(body1);
console.log(`Has Sub-Issues section: ${hasSubIssues1}`);

let updatedBody1;
if (hasSubIssues1) {
  updatedBody1 = body1.replace(subIssuesRegex, `## Sub-Issues\n\n${taskList}`);
} else {
  updatedBody1 = `${body1}\n\n## Sub-Issues\n\n${taskList}`;
}

console.log("\nUpdated body:");
console.log(updatedBody1);
console.log("\n");

// Test case 2: Body with existing Sub-Issues section (append scenario - should replace)
console.log("Test 2: Body WITH existing Sub-Issues section");
console.log("=".repeat(50));
const body2 = `# ARCH-test

Lane: C
Purpose: Test purpose

## Problem

Some problem description.

## Proposal

Some proposal.

## Sub-Issues

- [ ] #5 Old sub-issue
- [ ] #6 Another old sub-issue

## Acceptance Checklist

- [ ] Item 1
- [ ] Item 2`;

const hasSubIssues2 = subIssuesRegex.test(body2);
console.log(`Has Sub-Issues section: ${hasSubIssues2}`);

let updatedBody2;
if (hasSubIssues2) {
  updatedBody2 = body2.replace(subIssuesRegex, `## Sub-Issues\n\n${taskList}`);
  console.log("Action: REPLACED existing section");
} else {
  updatedBody2 = `${body2}\n\n## Sub-Issues\n\n${taskList}`;
  console.log("Action: APPENDED new section");
}

console.log("\nUpdated body:");
console.log(updatedBody2);
console.log("\n");

// Test case 3: Body with Sub-Issues at the end (no section after it)
console.log("Test 3: Body WITH Sub-Issues section at END");
console.log("=".repeat(50));
const body3 = `# ARCH-test

Lane: C
Purpose: Test purpose

## Problem

Some problem description.

## Proposal

Some proposal.

## Acceptance Checklist

- [ ] Item 1
- [ ] Item 2

## Sub-Issues

- [ ] #7 End sub-issue
- [ ] #8 Another end sub-issue`;

const hasSubIssues3 = subIssuesRegex.test(body3);
console.log(`Has Sub-Issues section: ${hasSubIssues3}`);

let updatedBody3;
if (hasSubIssues3) {
  updatedBody3 = body3.replace(subIssuesRegex, `## Sub-Issues\n\n${taskList}`);
  console.log("Action: REPLACED existing section");
} else {
  updatedBody3 = `${body3}\n\n## Sub-Issues\n\n${taskList}`;
  console.log("Action: APPENDED new section");
}

console.log("\nUpdated body:");
console.log(updatedBody3);
console.log("\n");

// Test case 4: Run twice on same body (simulating script run twice)
console.log("Test 4: Running TWICE on same body");
console.log("=".repeat(50));
const body4 = `# ARCH-test

## Problem

Some problem.

## Acceptance Checklist

- [ ] Item 1`;

console.log("First run:");
const hasSubIssues4a = subIssuesRegex.test(body4);
console.log(`  Has Sub-Issues: ${hasSubIssues4a}`);
let updatedBody4a;
if (hasSubIssues4a) {
  updatedBody4a = body4.replace(subIssuesRegex, `## Sub-Issues\n\n${taskList}`);
  console.log("  Action: REPLACED");
} else {
  updatedBody4a = `${body4}\n\n## Sub-Issues\n\n${taskList}`;
  console.log("  Action: APPENDED");
}

console.log("\nSecond run (on first run's output):");
const hasSubIssues4b = subIssuesRegex.test(updatedBody4a);
console.log(`  Has Sub-Issues: ${hasSubIssues4b}`);
let updatedBody4b;
if (hasSubIssues4b) {
  updatedBody4b = updatedBody4a.replace(
    subIssuesRegex,
    `## Sub-Issues\n\n${taskList}`,
  );
  console.log("  Action: REPLACED");
} else {
  updatedBody4b = `${updatedBody4a}\n\n## Sub-Issues\n\n${taskList}`;
  console.log("  Action: APPENDED");
}

console.log("\nFinal body after TWO runs:");
console.log(updatedBody4b);

// Count occurrences of "## Sub-Issues"
const subIssuesCount = (updatedBody4b.match(/## Sub-Issues/g) || []).length;
console.log(`\n✅ Number of "## Sub-Issues" sections: ${subIssuesCount}`);
if (subIssuesCount === 1) {
  console.log(
    "✅ SUCCESS: Only ONE Sub-Issues section exists after running twice!",
  );
} else {
  console.log("❌ FAILURE: Multiple Sub-Issues sections found!");
}

console.log("\n" + "=".repeat(50));
console.log("🎯 Summary: All tests completed");
