#!/usr/bin/env node
/**
 * create-worktree-pr.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/ops/create-worktree-pr.mjs
 * Summary: DEPRECATED - use scripts/ops/create-worktree-pr.mjs instead
 */

console.error(`
⚠️  DEPRECATED: scripts/create-worktree-pr.mjs

This script has been moved to: scripts/ops/create-worktree-pr.mjs

Please update your commands:
  OLD: node scripts/create-worktree-pr.mjs
  NEW: node scripts/ops/create-worktree-pr.mjs

Or use the package.json shortcut:
  pnpm gh:worktree

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
