# Scripts Guardrails

Automated enforcement of script quality, safety, and lifecycle management.

## Quick Start

```bash
# Run all guardrail checks
pnpm scripts:guardrails

# Run individual checks
pnpm scripts:lint        # Policy compliance
pnpm scripts:test        # Unit tests
pnpm scripts:smoke       # Smoke tests
pnpm scripts:size        # Size compliance
pnpm scripts:deprecation # TTL enforcement
```

## Directory Structure

```
/scripts/
  _lib/                 # Pure helpers, no I/O side effects
    core.mjs            # Common utilities (logger, parseFlags, etc.)
    git.mjs             # Git operations
    github.mjs          # GitHub API helpers
    validation.mjs      # Schema validation and checking
    allowlist.json      # Network domain whitelist

  ops/                  # Orchestrators that compose _lib pieces
    bump-version.mjs    # Version management

  checks/               # Validations and linters
    policy-lint.mjs     # Header, CLI contract, dangerous patterns
    smoke.mjs           # Basic functionality smoke tests
    size-check.mjs      # LOC and function size limits
    deprecation-sweeper.mjs  # 90-day TTL enforcement

  DEPRECATED/           # Auto-redirect shims, expire in 90 days
    README.md           # Deprecation policy and examples

  (root level scripts)  # Main automation scripts
```

## Guardrails Enforced

### 1. Layout Contract

- **`_lib/`**: Pure functions only, no I/O side effects
- **`ops/`**: Orchestrators that glue `_lib` calls, no raw shell
- **`checks/`**: Validation and linting tools
- **`DEPRECATED/`**: Deprecated scripts with max 90-day lifetime

### 2. CLI Contract

Every script must support:

- `--help` (show usage)
- `--dry-run` (default true for ops)
- `--yes` (execute writes)
- `--output json|text` (default: text)
- `--log-level trace|debug|info|warn|error` (default: info)
- `--cwd <path>` (working directory)
- `--repo-root auto` (detect repo root)

**Zero interactive prompts allowed.** Use flags or environment variables only.

### 3. Exit Code Semantics

- `0` - Success
- `2` - Noop/idempotent convergence
- `3` - Partial success, retryable
- `10` - Precondition failed
- `11` - Validation failed
- `13` - Unsafe environment detected

### 4. Required Header

```javascript
#!/usr/bin/env node
/**
 * script-name.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * @deprecated since=YYYY-MM-DD replace=<script> (optional)
 * Summary: One-line description of what this script does
 */
```

### 5. Idempotency

- Repeated runs should complete, noop, or converge
- Writes must be atomic: write to temp file, then rename
- Never depend on wall-clock timing for correctness

### 6. Sandbox Boundaries

- Writes only under repo root unless `--allow-outside` is passed and logged
- Network calls must point to domains in `/scripts/_lib/allowlist.json`
- Fail with exit 13 if trying to write outside sandbox

### 7. Observability

- Machine-readable output to STDOUT when `--output json`
- Human logs to STDERR
- Include `runId`, `script`, `version`, `durationMs` in final JSON

### 8. No Secret Handling

- Read tokens from standard env names only (`GITHUB_TOKEN`, etc.)
- Never print secrets in logs or output
- Fail with exit 13 if secrets are missing
- No fallback to anonymous access

### 9. Size Limits

- **Scripts**: <300 LOC (warning, enforced after 30 days)
- **Functions**: <60 LOC (warning, enforced after 30 days)
- Scripts exceeding budget must be split into `_lib/` modules

### 10. Time Budgets

- Preflight validations: <1 second on clean clone
- Checks: <60 seconds total runtime
- Ops: <5 minutes total runtime
- Scripts exceeding budget must print cause and suggested split

## CI Enforcement

The `scripts:guardrails` job runs in CI and fails fast on violations.

### Policy Lint

- Reject scripts lacking header block, CLI contract flags, or schema validation
- Ban `sudo`, `rm -rf /`, raw `child_process.exec`, and non-allowlisted network calls

### Smoke Tests

- Run `--help` on every script (must exit 0)
- Run `--dry-run --output json` on ops scripts

### Size Check

- Alert at >300 LOC per script
- Alert at >60 LOC per function
- Warning mode first, enforced after 30 days

### Deprecation Sweeper

- Fail if anything in `DEPRECATED/` is older than 90 days
- Warn if scripts are within 14 days of expiration

## Creating a New Script

1. **Copy template structure** from existing compliant script
2. **Add required header** with `@since`, `@version`, summary
3. **Implement CLI contract** with all required flags
4. **Use `_lib/core.mjs`** for common utilities
5. **Write tests** in `*.spec.mjs` file
6. **Run guardrails**: `pnpm scripts:guardrails`
7. **Add to package.json** if it's a common operation

## Deprecating a Script

1. **Add `@deprecated` tag** to header:

   ```javascript
   @deprecated since=2025-10-28 replace=scripts/new-script.mjs
   ```

2. **Create shim in `DEPRECATED/`** that:
   - Prints deprecation message
   - Suggests replacement
   - Exits with code 2

3. **Update guides** to reference new script

4. **Remove after 90 days** (enforced by CI)

## Testing Scripts

```bash
# Run unit tests for _lib modules
pnpm scripts:test

# Run smoke tests for all scripts
pnpm scripts:smoke

# Run all checks
pnpm scripts:guardrails
```

## Network Allowlist

Edit `/scripts/_lib/allowlist.json` to add allowed domains:

```json
{
  "domains": [
    "github.com",
    "api.github.com",
    "raw.githubusercontent.com",
    "registry.npmjs.org"
  ]
}
```

Scripts making network calls to unlisted domains will fail policy lint.

## KPI Tripwires

- **Automation ratio**: Script calls vs manual steps ≥ 3:1
- **Rerun safety**: 95% of reruns produce exit 2 (noop) when nothing to do
- **MTTR**: <10 minutes for failures (structured logs and validated inputs)
- **LOC drift**: Any script >300 LOC triggers refactor task into `_lib/`

## Examples

See existing compliant scripts:

- `/scripts/checks/size-check.mjs` - Full CLI contract implementation
- `/scripts/checks/deprecation-sweeper.mjs` - Pattern for checkers
- `/scripts/_lib/core.mjs` - Reusable helpers library
- `/scripts/_lib/validation.mjs` - Input validation patterns

## Related Documentation

- **Playbook**: `/playbook/patterns/script-automation-guardrails.html`
- **Core library**: `/scripts/_lib/core.mjs`
- **Validation library**: `/scripts/_lib/validation.mjs`
- **CI workflow**: `.github/workflows/ci.yml`
