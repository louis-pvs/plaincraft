# Required Dependencies for Scripts

The new scripts infrastructure requires two additional dependencies that are not yet installed:

## Install Commands

```bash
pnpm add -D execa zod
```

## Dependencies

### 1. `execa` (^8.0.0 or later)

**Purpose:** Safe subprocess execution  
**Used in:** All scripts that need to run git, gh CLI, or other commands  
**Why:** Replaces raw `child_process` for better error handling and security

**Used by:**

- `_lib/git.mjs` - All git operations
- `_lib/github.mjs` - All gh CLI operations
- `checks/smoke.mjs` - Running test commands
- Any ops script that needs to execute external commands

**Alternative:** Could use native Node.js `child_process` with promises, but `execa` provides:

- Better error handling
- Cleaner API
- Built-in timeout support
- STDOUT/STDERR separation
- Cross-platform support

### 2. `zod` (^3.22.0 or later)

**Purpose:** Runtime type validation and schema definition  
**Used in:** All scripts for input validation  
**Why:** Enforces CLI contract and provides structured validation errors

**Used by:**

- `ops/bump-version.mjs` - Validate CLI arguments
- All future ops scripts
- All future check scripts

**Why Zod:**

- TypeScript-first schema validation
- Excellent error messages
- Lightweight (~58KB minified)
- Industry standard for runtime validation

## Installation Steps

1. **Install dependencies:**

   ```bash
   cd /home/lop/github/plaincraft-scripts-alignment
   pnpm add -D execa zod
   ```

2. **Verify installation:**

   ```bash
   pnpm list execa zod
   ```

3. **Test the new scripts:**

   ```bash
   # Test the refactored bump-version
   node scripts/ops/bump-version.mjs --help

   # Test policy lint
   node scripts/checks/policy-lint.mjs --help

   # Test smoke tests
   node scripts/checks/smoke.mjs --help
   ```

4. **Run guardrails:**
   ```bash
   pnpm scripts:guardrails
   ```

## Why These Dependencies?

### Conservative Approach

We intentionally kept dependencies minimal. Only these two are added:

- **execa:** Safe command execution (replaces unsafe shell patterns)
- **zod:** Schema validation (enforces CLI contract)

### No Hero Dependencies

Following the guardrail: "Only standard Node modules plus execa, zod for schema, and fs/promises."

### Alternatives Considered

**Instead of execa:**

- ❌ `child_process.exec` - Dangerous, shell injection risks
- ❌ `child_process.spawn` - Works but verbose, no built-in timeout
- ✅ `execa` - Safe, ergonomic, battle-tested

**Instead of zod:**

- ❌ Manual validation - Error-prone, inconsistent
- ❌ TypeScript only - No runtime validation
- ❌ Joi - Heavier, older API
- ✅ `zod` - Modern, TypeScript-first, excellent DX

## Package.json Updates

After installation, your `package.json` will include:

```json
{
  "devDependencies": {
    // ... existing deps ...
    "execa": "^8.0.0",
    "zod": "^3.22.0"
  }
}
```

## Fallback Plan

If dependencies cannot be added immediately:

1. **Temporary workaround for execa:**
   Replace imports with native Node.js:

   ```js
   // Instead of: import { execa } from "execa";
   import { promisify } from "node:util";
   import { exec } from "node:child_process";
   const execAsync = promisify(exec);
   ```

2. **Temporary workaround for zod:**
   Use manual validation:
   ```js
   // Instead of: const parsed = ArgsSchema.safeParse(args);
   function validateArgs(args) {
     if (typeof args.output !== "string") throw new Error("Invalid output");
     // ... manual checks
   }
   ```

**However:** These workarounds defeat the purpose of the guardrails. Strongly recommend installing the dependencies.

## Next Steps

Once dependencies are installed:

1. ✅ Scripts will work correctly
2. ✅ Guardrails checks will pass
3. ✅ Ready to migrate more scripts
4. ✅ CI integration can proceed
