#!/usr/bin/env node
/**
 * new-snippet.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/ops/new-snippet.mjs
 * Summary: DEPRECATED - use scripts/ops/new-snippet.mjs instead
 */

console.error(`
⚠️  DEPRECATED: scripts/new-snippet.mjs

This script has been moved to: scripts/ops/new-snippet.mjs

Please update your commands:
  OLD: node scripts/new-snippet.mjs
  NEW: node scripts/ops/new-snippet.mjs

Or use the package.json shortcut:
  pnpm new:snippet

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
