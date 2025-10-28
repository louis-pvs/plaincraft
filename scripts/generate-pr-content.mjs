#!/usr/bin/env node
/**
 * generate-pr-content.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/ops/generate-pr-content.mjs
 * Summary: DEPRECATED - use scripts/ops/generate-pr-content.mjs instead
 */

console.error(`
⚠️  DEPRECATED: scripts/generate-pr-content.mjs

This script has been moved to: scripts/ops/generate-pr-content.mjs

Please update your commands:
  OLD: node scripts/generate-pr-content.mjs
  NEW: node scripts/ops/generate-pr-content.mjs

Or use the package.json shortcut:
  pnpm pr:generate

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
