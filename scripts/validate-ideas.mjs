#!/usr/bin/env node
/**
 * validate-ideas.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/checks/validate-ideas.mjs
 * Summary: DEPRECATED - use scripts/checks/validate-ideas.mjs instead
 */

console.error(`
⚠️  DEPRECATED: scripts/validate-ideas.mjs

This script has been moved to: scripts/checks/validate-ideas.mjs

Please update your commands:
  OLD: node scripts/validate-ideas.mjs
  NEW: node scripts/checks/validate-ideas.mjs

Or use the package.json shortcut:
  pnpm ideas:validate

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
