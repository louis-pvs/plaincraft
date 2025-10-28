#!/usr/bin/env node
/**
 * setup-labels.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/ops/setup-labels.mjs
 * Summary: DEPRECATED - use scripts/ops/setup-labels.mjs instead
 */

console.error(`
⚠️  DEPRECATED: scripts/setup-labels.mjs

This script has been moved to: scripts/ops/setup-labels.mjs

Please update your commands:
  OLD: node scripts/setup-labels.mjs
  NEW: node scripts/ops/setup-labels.mjs

Or use the package.json shortcut:
  pnpm gh:setup-labels

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
