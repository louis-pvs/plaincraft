#!/usr/bin/env node
/**
 * check-ci.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/checks/check-ci.mjs
 * Summary: DEPRECATED - use scripts/checks/check-ci.mjs instead
 */

console.error(`
⚠️  DEPRECATED: scripts/check-ci.mjs

This script has been moved to: scripts/checks/check-ci.mjs

Please update your commands:
  OLD: node scripts/check-ci.mjs
  NEW: node scripts/checks/check-ci.mjs

Or use the package.json shortcut:
  pnpm ci:check

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
