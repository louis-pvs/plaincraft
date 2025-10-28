#!/usr/bin/env node
/**
 * pr-requirements.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/checks/pr-requirements.mjs
 * Summary: DEPRECATED - use scripts/checks/pr-requirements.mjs instead
 */

console.error(`
⚠️  DEPRECATED: scripts/pr-requirements.mjs

This script has been moved to: scripts/checks/pr-requirements.mjs

Please update your commands:
  OLD: node scripts/pr-requirements.mjs
  NEW: node scripts/checks/pr-requirements.mjs

Or use the package.json shortcuts:
  pnpm pr:check
  pnpm pr:verify
  pnpm pr:create-issue

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
