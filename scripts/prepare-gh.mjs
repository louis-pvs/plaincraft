#!/usr/bin/env node
/**
 * prepare-gh.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/checks/prepare-gh.mjs
 * Summary: DEPRECATED - use scripts/checks/prepare-gh.mjs instead
 */

console.error(`
⚠️  DEPRECATED: scripts/prepare-gh.mjs

This script has been moved to: scripts/checks/prepare-gh.mjs

Please update your commands:
  OLD: node scripts/prepare-gh.mjs
  NEW: node scripts/checks/prepare-gh.mjs

Or use the package.json shortcut:
  pnpm gh:prepare

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
