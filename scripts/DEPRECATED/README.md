# DEPRECATED Scripts

This directory contains deprecated scripts that emit redirects to their replacements.

## Policy

- Scripts moved here automatically emit a one-line redirect message and exit with code 2
- Maximum lifetime: **90 days** from deprecation date
- After 90 days, CI fails and the script must be deleted
- All deprecated scripts must have `@deprecated since=YYYY-MM-DD replace=<script>` in their header

## Adding a Deprecated Script

1. Add `@deprecated since=YYYY-MM-DD replace=<new-script>` to the header
2. Move the file to `DEPRECATED/`
3. Create a shim that:
   - Prints the deprecation message
   - Suggests the replacement
   - Exits with code 2 (noop/idempotent)

## Example Shim

```javascript
#!/usr/bin/env node
/**
 * old-script.mjs
 * @since 2025-09-01
 * @version 1.0.0
 * @deprecated since=2025-10-28 replace=scripts/new-script.mjs
 * Summary: DEPRECATED - use scripts/new-script.mjs instead
 */

console.error(`
⚠️  DEPRECATED: old-script.mjs

This script has been replaced by: scripts/new-script.mjs

Please update your commands:
  OLD: node scripts/old-script.mjs
  NEW: node scripts/new-script.mjs

This shim will be removed after: 2026-01-26 (90 days)
`);

process.exit(2);
```

## Enforcement

The `scripts:deprecation` check (`deprecation-sweeper.mjs`) enforces:

- Scripts with `@deprecated` tags older than 90 days trigger CI failure
- Files in `DEPRECATED/` older than 90 days trigger CI failure
- Warning when scripts are within 14 days of expiration

Run manually:

```bash
pnpm scripts:deprecation
```

## Current Deprecated Scripts

None yet.
