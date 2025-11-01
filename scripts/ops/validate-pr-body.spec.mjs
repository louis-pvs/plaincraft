/**
 * validate-pr-body.spec.mjs
 * Tests for PR body validation script
 */

import { describe, it, expect } from "vitest";
import { validatePrBody } from "../_lib/pr-body-validator.mjs";

describe("validate-pr-body", () => {
  describe("PR body validation", () => {
    it("should pass with fully enhanced PR body", () => {
      const fullBody = `Closes #111

## Purpose

Fix critical automation gaps.

## Problem

Workflow is only 40% automated.

## Proposal

Implement Phase 1 and Phase 2 fixes.

## Changes

- Fixed double-execute bug
- Enhanced PR body generation
- Added changelog extraction

## Acceptance Checklist

- [x] All tests passing
- [ ] Documentation updated

---

**Idea**: ARCH-e2e-automation-gaps
**Source**: \`/ideas/ARCH-e2e-automation-gaps.md\`
**Branch**: \`feat/C-111-e2e-automation-gaps\`
**Status**: Complete`;

      const result = validatePrBody(fullBody);

      expect(result.required.every((s) => s.found)).toBe(true);
      expect(result.optional.filter((s) => s.found).length).toBeGreaterThan(3);
      expect(result.metadata.hasChangesBullets).toBe(true);
      expect(result.summary.enhancedFeatures).toBe(5);
    });

    it("should pass with minimal PR body", async () => {
      const minimalBody = `Closes #123

Quick fix for issue.

---

**Branch**: \`feat/C-123-quick-fix\``;

      const result = validatePrBody(minimalBody);

      expect(result.required.every((s) => s.found)).toBe(true);
      expect(result.summary.requiredPassed).toBe(1);
    });

    it("should detect missing issue link", async () => {
      const noLinkBody = `## Purpose

Some changes.`;

      const result = validatePrBody(noLinkBody);

      expect(result.required[0].found).toBe(false);
      expect(result.summary.requiredPassed).toBe(0);
    });

    it("should detect Purpose section", async () => {
      const withPurpose = `Closes #123

## Purpose

Fix the thing.`;

      const result = validatePrBody(withPurpose);

      const purposeSection = result.optional.find((s) => s.name === "Purpose");
      expect(purposeSection.found).toBe(true);
    });

    it("should detect Problem section", async () => {
      const withProblem = `Linked ticket: C-123

## Problem

Something is broken.`;

      const result = validatePrBody(withProblem);

      const problemSection = result.optional.find((s) => s.name === "Problem");
      expect(problemSection.found).toBe(true);
    });

    it("should detect Changes section with bullets", async () => {
      const withChanges = `Closes #123

## Changes

- Fixed bug A
- Fixed bug B`;

      const result = validatePrBody(withChanges);

      const changesSection = result.optional.find((s) => s.name === "Changes");
      expect(changesSection.found).toBe(true);
      expect(result.metadata.hasChangesBullets).toBe(true);
    });

    it("should detect Acceptance Checklist", async () => {
      const withChecklist = `Closes #123

## Acceptance Checklist

- [ ] Item 1
- [x] Item 2`;

      const result = validatePrBody(withChecklist);

      const checklistSection = result.optional.find(
        (s) => s.name === "Acceptance Checklist",
      );
      expect(checklistSection.found).toBe(true);
    });

    it("should detect metadata references", async () => {
      const withMetadata = `Closes #123

---

**Idea**: ARCH-test
**Source**: \`/ideas/ARCH-test.md\`
**Branch**: \`feat/C-123-test\``;

      const result = validatePrBody(withMetadata);

      expect(result.metadata.hasIdeaReference).toBe(true);
      expect(result.metadata.hasSourceReference).toBe(true);
      expect(result.metadata.hasBranchReference).toBe(true);
    });

    it("should count enhanced features correctly", async () => {
      const enhancedBody = `Closes #123

## Purpose
Test

## Problem
Test

## Proposal
Test

## Changes
- Change 1

## Acceptance Checklist
- [ ] Done`;

      const result = validatePrBody(enhancedBody);

      expect(result.summary.enhancedFeatures).toBe(5);
      expect(result.summary.enhancedFeaturesTotal).toBe(5);
    });
  });
});
