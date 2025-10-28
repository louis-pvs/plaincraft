#!/usr/bin/env node
/**
 * ideas-to-issues.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/ops/ideas-to-issues.mjs
 * Summary: DEPRECATED - use scripts/ops/ideas-to-issues.mjs instead
 */

console.error(`
⚠️  DEPRECATED: scripts/ideas-to-issues.mjs

This script has been moved to: scripts/ops/ideas-to-issues.mjs

Please update your commands:
  OLD: node scripts/ideas-to-issues.mjs
  NEW: node scripts/ops/ideas-to-issues.mjs

Or use the package.json shortcut:
  pnpm ideas:create

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
