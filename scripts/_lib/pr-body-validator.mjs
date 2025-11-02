/**
 * pr-body-validator.mjs
 * @since 2025-11-01
 * @version 0.1.0
 * Pure validation logic for PR bodies (no CLI dependencies)
 */

/**
 * Validate PR body structure
 * @param {string} body - PR body content
 * @returns {object} Validation results
 */
export function validatePrBody(body) {
  const sections = {
    required: [
      {
        name: "Issue Link",
        pattern: /^(Closes #\d+|Linked ticket: [A-Z]+-\d+)/m,
        found: false,
        critical: true,
      },
    ],
    optional: [
      {
        name: "Purpose",
        pattern: /^## Purpose$/m,
        found: false,
        enhancedFeature: true,
      },
      {
        name: "Problem",
        pattern: /^## Problem$/m,
        found: false,
        enhancedFeature: true,
      },
      {
        name: "Proposal",
        pattern: /^## Proposal$/m,
        found: false,
        enhancedFeature: true,
      },
      {
        name: "Changes",
        pattern: /^## Changes$/m,
        found: false,
        enhancedFeature: true,
      },
      {
        name: "Acceptance Checklist",
        pattern: /^## Acceptance Checklist$/m,
        found: false,
        enhancedFeature: true,
      },
    ],
  };

  // Check required sections
  for (const section of sections.required) {
    section.found = section.pattern.test(body);
  }

  // Check optional sections
  for (const section of sections.optional) {
    section.found = section.pattern.test(body);
  }

  // Check for Changes section bullet points
  const hasBullets = /^## Changes\s*\n[^#]*^[-*]\s+/ms.test(body);

  // Extract metadata
  const metadata = {
    hasIdeaReference: /\*\*Idea\*\*:/.test(body),
    hasSourceReference: /\*\*Source\*\*:/.test(body),
    hasBranchReference: /\*\*Branch\*\*:/.test(body),
    hasChangesBullets: hasBullets,
    bodyLength: body.length,
  };

  // Count sections
  const requiredPassed = sections.required.filter((s) => s.found).length;
  const optionalPassed = sections.optional.filter((s) => s.found).length;
  const enhancedFeatures = sections.optional.filter(
    (s) => s.enhancedFeature && s.found,
  ).length;

  return {
    required: sections.required,
    optional: sections.optional,
    metadata,
    summary: {
      requiredPassed,
      requiredTotal: sections.required.length,
      optionalPassed,
      optionalTotal: sections.optional.length,
      enhancedFeatures,
      enhancedFeaturesTotal: sections.optional.filter((s) => s.enhancedFeature)
        .length,
    },
  };
}
