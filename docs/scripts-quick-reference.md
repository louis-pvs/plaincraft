# Scripts Quick Reference Card

## 📁 Structure

```
/scripts/
  _lib/      → Pure helpers (no I/O)
  ops/       → Orchestrators
  checks/    → Validators
  migration/ → One-off scripts
  DEPRECATED/ → Old scripts (90-day expiry)
```

## 🚀 Quick Commands

```bash
# Install dependencies (required first!)
pnpm add -D execa zod

# Run all guardrails checks
pnpm scripts:guardrails

# Individual checks
pnpm scripts:lint    # Policy validation
pnpm scripts:test    # Unit tests
pnpm scripts:smoke   # Script smoke tests

# Test a script
node scripts/ops/bump-version.mjs --help     # Show help
node scripts/ops/bump-version.mjs --dry-run  # Preview
node scripts/ops/bump-version.mjs --yes      # Execute
node scripts/ops/bump-version.mjs --output json  # JSON output
```

## 🎯 CLI Contract (Every Script Must Support)

| Flag          | Description                       | Default |
| ------------- | --------------------------------- | ------- |
| `--help`      | Show help and exit                | -       |
| `--dry-run`   | Preview changes only              | `true`  |
| `--yes`       | Execute changes                   | `false` |
| `--output`    | `json` or `text`                  | `text`  |
| `--log-level` | `trace\|debug\|info\|warn\|error` | `info`  |
| `--cwd`       | Working directory                 | Current |

## 🔢 Exit Codes

| Code | Meaning      | Use Case                   |
| ---- | ------------ | -------------------------- |
| 0    | Success      | Completed successfully     |
| 2    | Noop         | Already done (idempotent)  |
| 10   | Precondition | Not in repo, missing files |
| 11   | Validation   | Invalid input/schema       |
| 13   | Unsafe       | Missing secrets, dangerous |

## 📚 Library Imports

```javascript
// Core utilities
import {
  Logger,
  parseFlags,
  repoRoot,
  atomicWrite,
  readJSON,
  writeJSON,
  fail,
  succeed,
  generateRunId,
} from "./_lib/core.mjs";

// Git operations
import {
  isGitClean,
  getCurrentBranch,
  getRecentCommits,
  createWorktree,
  listWorktrees,
} from "./_lib/git.mjs";

// GitHub API
import {
  getIssue,
  createPR,
  listIssues,
  getPR,
  updatePR,
  createLabel,
} from "./_lib/github.mjs";

// Validation
import {
  validateScriptHeader,
  validateCLIContract,
  detectDangerousPatterns,
  checkSizeCompliance,
} from "./_lib/validation.mjs";
```

## ✨ Create New Script

```bash
# Copy template
cp scripts/_template-ops.mjs scripts/ops/my-script.mjs

# Make executable
chmod +x scripts/ops/my-script.mjs

# Edit and customize
vim scripts/ops/my-script.mjs

# Test
node scripts/ops/my-script.mjs --help
```

## 📋 Script Template

```javascript
#!/usr/bin/env node
/**
 * my-script.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: What this script does
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
  console.log("Usage: ...");
  process.exit(0);
}

const parsed = ArgsSchema.safeParse(rawArgs);
if (!parsed.success)
  fail(11, "validation_error", parsed.error.format(), rawArgs.output);

const args = parsed.data;
const logger = new Logger(args.logLevel);
const runId = generateRunId();

try {
  const root = await repoRoot(args.cwd);
  // Your logic here
  succeed(
    { runId, script: "my-script", durationMs: Date.now() - start },
    args.output,
  );
} catch (error) {
  logger.error("Failed:", error.message);
  fail(11, "execution_error", error.message, args.output);
}
```

## 🛡️ Guardrails Rules

1. **One job per tool** - Small, focused functions
2. **CLI contract** - All required flags
3. **Idempotent** - Safe to rerun
4. **Atomic writes** - Temp file → rename
5. **No secrets in code** - Environment variables only
6. **Exit codes** - Semantic meaning
7. **Size limits** - <300 LOC script, <60 LOC function
8. **Network whitelist** - Only allowed domains
9. **Structured output** - JSON when requested
10. **Time budgets** - <1s preflight, <60s checks, <5m ops

## 📖 Documentation

- `README.md` - Full guide
- `MIGRATION-PLAN.md` - Migration strategy
- `ARCHITECTURE.md` - Diagrams & flows
- `DEPENDENCIES.md` - Required packages
- `COMPLETION-CHECKLIST.md` - What's done

## 🔍 Troubleshooting

**Script fails with exit 11**
→ Check input validation with `--help`

**Script fails with exit 13**
→ Missing environment variables or unsafe patterns

**Import errors**
→ Install dependencies: `pnpm add -D execa zod`

**Guardrails failing**
→ Check policy lint: `pnpm scripts:lint`

## 📊 Current Status

- **Phase:** 1 (Foundation) ✅ Complete
- **Scripts migrated:** 1/27 (3.7%)
- **Next:** Install deps, extract libs, migrate scripts

## 🎯 Next Actions

1. ✅ Review this structure
2. ⏳ Install: `pnpm add -D execa zod`
3. ⏳ Test: `pnpm scripts:guardrails`
4. ⏳ Migrate: Start with `setup-labels.mjs`

---

**Need help?** See `scripts/README.md`  
**Want details?** See `scripts/MIGRATION-PLAN.md`  
**Ready to code?** Copy `scripts/_template-ops.mjs`
