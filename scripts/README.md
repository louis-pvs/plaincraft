# Scripts Directory

**Automated tools and utilities for the Plaincraft repository.**

This directory follows strict guardrails to ensure all scripts are rerunnable, testable, and CI-friendly.

---

## Structure

```
/scripts/
  _lib/                 # Pure helper functions (no I/O side effects)
  ops/                  # Orchestrators that compose _lib functions
  checks/               # Validations and linters
  migration/            # One-off data migration scripts
  DEPRECATED/           # Auto-redirect shims (expire in 90 days)

  MIGRATION-PLAN.md     # Detailed migration strategy
  README.md             # This file
```

Anything under `scripts/DEPRECATED/` exists only as a compatibility shim; do not reference or extend those scripts when building new automation.

---

## Quick Start

### Run Guardrails Check

```bash
pnpm guardrails
```

This orchestrates:

1. **Script suite** — Policy lint, unit tests, smoke tests, size + deprecation checks
2. **Docs suite** — README + template coverage, view dedupe, Playbook link guard
3. **PR/Issue checks** — PR template lint, issue template lint
4. **Recording probe** — Optional Storybook recording smoke (`--help`) to ensure tooling is available

Use `pnpm guardrails:<scope>` (`docs`, `scripts`, `ideas`, `pr`, `recordings`) for focused runs.

### Create a New Script

Use the template from the guardrails document:

```bash
# For an orchestrator
cp scripts/_template-ops.mjs scripts/ops/my-script.mjs

# For a checker
cp scripts/_template-checks.mjs scripts/checks/my-check.mjs
```

Every script must:

- Have a header with `@since`, `@version`
- Support CLI contract: `--help`, `--dry-run`, `--yes`, `--output`, `--log-level`, `--cwd`
- Use `zod` for input validation
- Exit with semantic codes (0=success, 2=noop, 10=precondition, 11=validation, 13=unsafe)
- Output JSON when `--output json` is specified

### Test a Script

```bash
# Show help
node scripts/ops/bump-version.mjs --help

# Dry run (preview changes)
node scripts/ops/bump-version.mjs --dry-run

# Execute
node scripts/ops/bump-version.mjs --yes

# Get JSON output
node scripts/ops/bump-version.mjs --output json --yes
```

---

## CLI Contract

All scripts must support these flags:

| Flag                  | Description                                          | Default           |
| --------------------- | ---------------------------------------------------- | ----------------- |
| `--help`, `-h`        | Show help and exit                                   | -                 |
| `--dry-run`           | Preview changes without executing                    | `true` for ops    |
| `--yes`, `-y`         | Execute writes (disables dry-run)                    | `false`           |
| `--output <format>`   | Output format: `json` or `text`                      | `text`            |
| `--log-level <level>` | Log level: `trace`, `debug`, `info`, `warn`, `error` | `info`            |
| `--cwd <path>`        | Working directory                                    | Current directory |

---

## Exit Codes

Scripts use semantic exit codes:

| Code | Meaning             | When to Use                           |
| ---- | ------------------- | ------------------------------------- |
| 0    | Success             | Operation completed successfully      |
| 2    | Noop                | Idempotent convergence (already done) |
| 3    | Partial success     | Retryable, some steps succeeded       |
| 10   | Precondition failed | Not in git repo, missing file, etc.   |
| 11   | Validation failed   | Invalid input, schema mismatch        |
| 13   | Unsafe environment  | Missing secrets, dangerous state      |

---

## Library Modules (`_lib/`)

Pure functions with no side effects. Import these in your orchestrators.

### `_lib/core.mjs`

```js
import {
  Logger, // Structured logging
  parseFlags, // CLI flag parser
  repoRoot, // Find git repository root
  atomicWrite, // Atomic file write
  readJSON, // Safe JSON read
  writeJSON, // Atomic JSON write
  formatOutput, // Format json|text output
  fail, // Exit with error
  succeed, // Exit with success
  generateRunId, // Generate unique run ID
} from "./_lib/core.mjs";
```

### `_lib/git.mjs`

```js
import {
  isGitClean, // Check if working dir is clean
  getCurrentBranch, // Get current branch name
  branchExists, // Check if branch exists
  getRecentCommits, // Get recent commit messages
  createWorktree, // Create git worktree
  removeWorktree, // Remove git worktree
  listWorktrees, // List all worktrees
} from "./_lib/git.mjs";
```

### `_lib/github.mjs`

```js
import {
  isGhAuthenticated, // Check gh CLI auth
  getIssue, // Get issue details
  createPR, // Create pull request
  listIssues, // List issues with filters
  getPR, // Get PR details
  updatePR, // Update PR
  createLabel, // Create/update label
} from "./_lib/github.mjs";
```

### `_lib/validation.mjs`

```js
import {
  loadAllowlist, // Load network allowlist
  isUrlAllowed, // Check if URL is allowed
  validateScriptHeader, // Validate script header
  validateCLIContract, // Validate CLI flags
  detectDangerousPatterns, // Detect unsafe code
  checkSizeCompliance, // Check LOC limits
} from "./_lib/validation.mjs";
```

---

## Guardrails

### 1. One Job Per Tool

- `_lib` files expose small, composable functions
- `ops` files orchestrate by calling `_lib` functions
- No raw shell commands except via `execa`

### 2. Idempotency First

- Repeated runs complete, noop, or converge
- Writes are atomic (temp file → rename)
- No wall-clock timing dependencies

### 3. No Side Effects Outside Repo

- Writes only under repo root by default
- Use `--allow-outside` flag for exceptions (must log)
- Network calls only to whitelisted domains in `_lib/allowlist.json`

### 4. Observability

- Machine-readable results to STDOUT when `--output json`
- Human logs to STDERR
- Include `runId`, `script`, `version`, `durationMs` in final JSON

### 5. No Interactive Prompts

- All inputs via flags or environment variables
- No `readline`, `inquirer`, or similar
- CI must be able to run headlessly

### 6. No Secret Handling in Code

- Read tokens from standard env vars only
- Never log secrets
- Exit 13 if secrets missing (no silent fallback)

### 7. Size Limits

- Scripts <300 LOC
- Functions <60 LOC
- Exceeding limits triggers refactor task

### 8. Time Budgets

- Preflight validations: <1 second
- Checks: <60 seconds
- Ops: <5 minutes
- Print cause and suggest split if exceeded

---

## Examples

### Minimal Script Template

```js
#!/usr/bin/env node
/**
 * my-script.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: One-line description of what this script does.
 */

import { z } from "zod";
import {
  parseFlags,
  fail,
  succeed,
  Logger,
  repoRoot,
  generateRunId,
} from "./_lib/core.mjs";

const ArgsSchema = z.object({
  yes: z.boolean().default(false),
  dryRun: z.boolean().default(true),
  output: z.enum(["json", "text"]).default("text"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  cwd: z.string().default(process.cwd()),
  help: z.boolean().default(false),
});

const start = Date.now();
const rawArgs = parseFlags(process.argv.slice(2));

if (rawArgs.help) {
  console.log(\`Usage: node scripts/ops/my-script.mjs [options]

Options:
  --help              Show this help
  --yes, -y           Execute changes
  --dry-run           Preview only (default)
  --output <format>   json|text (default: text)
  --log-level <level> Log level (default: info)
  --cwd <path>        Working directory
\`);
  process.exit(0);
}

const parsed = ArgsSchema.safeParse(rawArgs);
if (!parsed.success) {
  fail(11, "validation_error", parsed.error.format(), rawArgs.output);
}

const args = parsed.data;
const logger = new Logger(args.logLevel);
const runId = generateRunId();

try {
  const root = await repoRoot(args.cwd);

  // Your logic here
  const plan = { action: "do_something" };

  if (args.dryRun || !args.yes) {
    succeed(
      { runId, script: "my-script", dryRun: true, plan, durationMs: Date.now() - start },
      args.output
    );
    process.exit(2);
  }

  // Execute
  // ...

  succeed(
    { runId, script: "my-script", durationMs: Date.now() - start },
    args.output
  );
} catch (error) {
  logger.error("Failed:", error.message);
  fail(11, "execution_error", error.message, args.output);
}
```

---

## Testing

### Unit Tests

All `_lib/` modules have comprehensive unit test coverage with vitest.

**Run all tests:**

```bash
pnpm scripts:test
```

**Run specific module tests:**

```bash
pnpm vitest scripts/_lib/core.spec.mjs
```

**Watch mode (for development):**

```bash
pnpm vitest --watch scripts/_lib/
```

**Coverage report:**

```bash
pnpm vitest --coverage scripts/_lib/
```

### Test Structure

Tests are located alongside their modules:

```
scripts/_lib/
  core.mjs          # Module code
  core.spec.mjs     # Unit tests
  __fixtures__/     # Test data files
```

### Mocking Strategy

- **fs operations**: Mock `node:fs` and `node:fs/promises`
- **CLI commands**: Mock `execa` for git/gh commands
- **Fixtures**: Sample data files in `__fixtures__/`

All I/O operations are mocked to ensure:

- Tests run fast (no disk/network I/O)
- Tests are isolated (no side effects)
- Tests are deterministic (no external dependencies)

### Test Modules

| Module                | Tests   | Functions | Coverage |
| --------------------- | ------- | --------- | -------- |
| `core.spec.mjs`       | 71      | 14        | ≥80%     |
| `validation.spec.mjs` | 45      | 6         | ≥80%     |
| `ideas.spec.mjs`      | 52      | 6         | ≥80%     |
| `git.spec.mjs`        | 36      | 8         | ≥80%     |
| `github.spec.mjs`     | 41      | 9         | ≥80%     |
| `changelog.spec.mjs`  | 74      | 13        | ≥80%     |
| `templates.spec.mjs`  | 36      | 7         | ≥80%     |
| **Total**             | **355** | **63**    | **≥80%** |

### Smoke Tests

Test that all scripts respond correctly:

```bash
pnpm scripts:smoke
```

### Policy Lint

Validate compliance with guardrails:

```bash
pnpm scripts:lint
```

---

## Migration Status

**Current:** Phase 1 complete (foundation)  
**Next:** Phase 2 (extract common libraries)

See [MIGRATION-PLAN.md](./MIGRATION-PLAN.md) for details.

### Migrated Scripts

- ✅ `bump-version.mjs` → `ops/bump-version.mjs`

### In Progress

- `_lib/ideas.mjs` - Idea file parsing
- `_lib/markdown.mjs` - Markdown utilities
- `ops/setup-labels.mjs` - Label setup

---

## Contributing

When adding or modifying scripts:

1. **Extract reusable logic** to `_lib/`
2. **Follow the CLI contract** (all required flags)
3. **Validate inputs** with `zod`
4. **Write tests** for pure functions
5. **Run guardrails** before committing:
   ```bash
   pnpm guardrails
   ```

---

## Troubleshooting

### Script fails with exit 11

Validation error. Check input parameters and schema requirements.

```bash
node scripts/ops/my-script.mjs --help
```

### Script fails with exit 13

Unsafe environment detected. Check for:

- Missing environment variables (tokens, secrets)
- Dangerous patterns in code
- Network calls to non-whitelisted domains

### Dry-run doesn't show expected changes

Check `--output json` for structured plan:

```bash
node scripts/ops/my-script.mjs --dry-run --output json
```

---

## Resources

- [Guardrails Document](../docs/SCRIPTS-REFERENCE.md) - Full policy
- [Package.json Scripts](../package.json) - Available commands

---

**Questions?** Open an issue or check the migration plan.
