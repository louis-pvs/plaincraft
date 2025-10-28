#!/usr/bin/env node
/**
 * sync-ideas-checklists.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/ops/sync-ideas-checklists.mjs
 * Summary: DEPRECATED - use scripts/ops/sync-ideas-checklists.mjs instead
 */

console.error(`
⚠️  DEPRECATED: scripts/sync-ideas-checklists.mjs

This script has been moved to: scripts/ops/sync-ideas-checklists.mjs

Please update your commands:
  OLD: node scripts/sync-ideas-checklists.mjs
  NEW: node scripts/ops/sync-ideas-checklists.mjs

Or use the package.json shortcut:
  pnpm ideas:sync

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
