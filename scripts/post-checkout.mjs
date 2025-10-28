#!/usr/bin/env node
/**
 * post-checkout.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/ops/post-checkout.mjs
 * Summary: DEPRECATED - use scripts/ops/post-checkout.mjs instead
 */

console.error(`
⚠️  DEPRECATED: scripts/post-checkout.mjs

This script has been moved to: scripts/ops/post-checkout.mjs

Please update your commands:
  OLD: node scripts/post-checkout.mjs
  NEW: node scripts/ops/post-checkout.mjs

Or use the package.json shortcut:
  pnpm postcheckout

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
