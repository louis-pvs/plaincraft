# Using the Script Template

## Purpose

Create automation scripts that comply with all repository guardrails.

## When to Use

- Building new automation for the repository
- Creating ops orchestrators
- Implementing validation checks
- Writing one-off migration scripts

## Steps

### 1. Copy Template

```bash
cp templates/script/template-script.mjs scripts/your-script-name.mjs
chmod +x scripts/your-script-name.mjs
```

### 2. Update Header

```javascript
/**
 * your-script-name.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Brief description of what this script does
 */
```

### 3. Implement Core Functions

**preflight(\_root)**: Validation before execution

```javascript
async function preflight(_root) {
  // Check if git status is clean
  // Verify required files exist
  // Validate environment variables
  // Check permissions
}
```

**buildPlan(\_root)**: Create execution plan

```javascript
async function buildPlan(_root) {
  return [
    { action: "write", file: "path/to/file", content: "..." },
    { action: "delete", file: "path/to/old" },
    { action: "move", from: "a", to: "b" },
  ];
}
```

**executePlan(plan, root)**: Execute actions

```javascript
async function executePlan(plan, root) {
  const results = [];

  for (const step of plan) {
    switch (step.action) {
      case "write":
        await atomicWrite(path.join(root, step.file), step.content);
        results.push({ action: "write", file: step.file, status: "success" });
        break;
      // Handle other actions
    }
  }

  return results;
}
```

### 4. Update Help Text

```javascript
if (args.help) {
  // Update description, options, examples
  console.log(`...`);
  process.exit(0);
}
```

### 5. Test Locally

```bash
# Test help
node scripts/your-script.mjs --help

# Test dry-run
node scripts/your-script.mjs --dry-run

# Test JSON output
node scripts/your-script.mjs --dry-run --output json

# Execute
node scripts/your-script.mjs --yes
```

### 6. Validate Compliance

```bash
# Run all guardrails
pnpm guardrails

# Or individual checks
pnpm scripts:lint    # Header, CLI contract, patterns
pnpm scripts:smoke   # --help and --dry-run
pnpm scripts:size    # LOC limits
pnpm scripts:test -- --filter <script-name>  # Focused unit coverage

# Lifecycle guardrail (required when touching gh:worktree helpers)
pnpm scripts:test -- --filter create-worktree-pr
```

## Advanced Usage

### Extract to \_lib Module

If your script grows > 300 LOC:

```bash
# Create _lib module
cat > scripts/_lib/your-feature.mjs << 'EOF'
export function yourHelper(input) {
  // Pure function, no I/O
  return transformed;
}
EOF

# Import in script
import { yourHelper } from "../_lib/your-feature.mjs";
```

### Add Schema Validation

```javascript
import { z } from "zod";

const Args = z.object({
  inputFile: z.string().min(1),
  outputFile: z.string().min(1),
  yes: z.boolean().default(false),
  dryRun: z.boolean().default(true),
  output: z.enum(["json", "text"]).default("text"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
});

const parsed = Args.safeParse(args);
if (!parsed.success) {
  fail({
    runId,
    script: "your-script",
    error: "validation_error",
    details: parsed.error.format(),
  });
  process.exit(11);
}
```

### Network Calls

```javascript
import { isUrlAllowed } from "../_lib/validation.mjs";

const url = "https://api.github.com/...";
if (!(await isUrlAllowed(url))) {
  fail({
    runId,
    script: "your-script",
    error: "Network call to non-allowlisted domain",
    url,
  });
  process.exit(13);
}
```

## Common Patterns

### File Operations

```javascript
import { atomicWrite } from "../_lib/core.mjs";

// Atomic write (temp + rename)
await atomicWrite("/path/to/file", content);

// Read with error handling
try {
  const content = await readFile(path, "utf-8");
} catch (error) {
  logger.error(`Failed to read ${path}: ${error.message}`);
  process.exit(10);
}
```

### Git Operations

```javascript
import { execa } from "execa";

// Check if git status is clean
const { stdout } = await execa("git", ["status", "--porcelain"], { cwd: root });
if (stdout.trim()) {
  fail({ error: "Working directory must be clean" });
  process.exit(10);
}
```

### Idempotency

```javascript
// Check if already done
const targetExists = await fileExists(targetPath);
if (targetExists) {
  succeed({
    runId,
    script: "your-script",
    status: "noop",
    message: "Target already exists, nothing to do",
  });
  process.exit(2);
}
```

## Troubleshooting

### Lint Errors

```bash
# Check specific issues
pnpm scripts:lint

# Common fixes:
# - Add @since and @version to header
# - Implement all CLI flags
# - Remove interactive prompts
# - Prefix unused args with _
```

### Size Violations

```bash
pnpm scripts:size

# If script > 300 LOC:
# - Extract helpers to _lib/
# - Split into multiple scripts
# - Move to ops/ and compose _lib modules
```

## Related

- Guardrails: `/scripts/GUARDRAILS.md`
- Playbook: `/playbook/patterns/script-automation-guardrails.html`
- Storybook: `/storybook/?path=/docs/governance-script-automation--docs`
- Core library: `/scripts/_lib/core.mjs`
- Example scripts: `/scripts/checks/*.mjs`
