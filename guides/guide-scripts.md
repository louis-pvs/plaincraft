---
id: guide-scripts
owner: @louis-pvs
lane: D
artifact_id: ARCH-scripts-guardrails
scaffold_ref: /templates/script@v0.1
version: 0.1.0
created: 2025-10-28
ttl_days: 90
last_verified: 2025-10-28
---

# When to use

- Creating a new automation script for the repository
- Validating script compliance before committing
- Enforcing script quality and safety standards in CI

# When not to use

- One-off shell commands for personal use
- Quick prototypes not intended for the repo
- Non-executable documentation or configs

# Steps (all executable)

1. **Create script from template structure:**

   ```bash
   # Copy the template header to your new script
   # See /scripts/checks/size-check.mjs for example
   ```

2. **Validate policy compliance:**

   ```bash
   pnpm scripts:lint
   # Checks: headers, CLI contract, dangerous patterns
   ```

3. **Run smoke tests:**

   ```bash
   pnpm scripts:smoke
   # Tests: --help flag, --dry-run for ops scripts
   ```

4. **Check size compliance:**

   ```bash
   pnpm scripts:size
   # Warns: >300 LOC scripts, >60 LOC functions
   ```

5. **Run all guardrails:**
   ```bash
   pnpm scripts:guardrails
   # Runs lint, test, smoke, size, deprecation checks
   ```

# Rollback

- Delete the script file
- Remove from package.json if added as npm script
- Update any guides referencing it

# Requirements

**Layout Contract:**

- `_lib/` - Pure helpers, no I/O side effects
- `ops/` - Orchestrators composing \_lib pieces
- `checks/` - Validations and linters
- `DEPRECATED/` - Expired scripts with 90-day TTL

**CLI Contract (all scripts):**

- `--dry-run` (default true for ops)
- `--yes` to execute writes
- `--output json|text`
- `--log-level trace|debug|info|warn|error`
- `--cwd <path>`
- Zero interactive prompts

**Exit Codes:**

- 0: success
- 2: noop/idempotent
- 3: partial success retryable
- 10: precondition failed
- 11: validation failed
- 13: unsafe environment

**Header Required:**

```javascript
/**
 * script-name.mjs
 * @since YYYY-MM-DD
 * @version X.Y.Z
 * @deprecated since=YYYY-MM-DD replace=<script> (optional)
 * Summary: One-line description
 */
```

# Links

- Templates: `/templates/script/`, `/templates/test-unit/`, `/templates/test-integration/`
- Policy linter: `/scripts/checks/policy-lint.mjs`
- Smoke tests: `/scripts/checks/smoke.mjs`
- Size checker: `/scripts/checks/size-check.mjs`
- Deprecation sweeper: `/scripts/checks/deprecation-sweeper.mjs`
- Core library: `/scripts/_lib/core.mjs`
- Validation library: `/scripts/_lib/validation.mjs`
- Network allowlist: `/scripts/_lib/allowlist.json`
- Deprecated scripts: `/scripts/DEPRECATED/`
