# Script Template

Version: 0.1.0  
Last Updated: 2025-10-28

## Overview

Compliant script template with full CLI contract, proper headers, validation, and guardrails enforcement.

## Files

- `template-script.mjs` - Main script template with all required elements
- `USAGE.md` - How to use this template
- `README.md` - This file
- `template.config.json` - Metadata and validation schema

## Quick Start

```bash
# 1. Copy template
cp templates/script/template-script.mjs scripts/your-script.mjs

# 2. Customize
# - Update header (@since, @version, Summary)
# - Implement preflight(), buildPlan(), executePlan()
# - Update help text

# 3. Validate
pnpm scripts:lint

# 4. Test
node scripts/your-script.mjs --help
node scripts/your-script.mjs --dry-run
```

## What's Included

### Required Header

```javascript
/**
 * script-name.mjs
 * @since YYYY-MM-DD
 * @version X.Y.Z
 * Summary: One-line description
 */
```

### Full CLI Contract

- `--help` - Usage information
- `--dry-run` - Preview without writes (default)
- `--yes` - Execute writes
- `--output json|text` - Output format
- `--log-level` - Logging verbosity
- `--cwd` - Working directory

### Exit Code Semantics

- `0` - Success
- `2` - Noop/idempotent
- `3` - Partial success
- `10` - Precondition failed
- `11` - Validation failed
- `13` - Unsafe environment

### Structure Functions

- `preflight()` - Validation checks before execution
- `buildPlan()` - Create execution plan
- `executePlan()` - Execute the plan with atomic writes

### Observability

- Structured logging with Logger
- JSON output support
- runId tracking
- Duration measurement

## Customization Points

1. **Help Text**: Update usage, description, examples
2. **Preflight**: Add validation logic
3. **Build Plan**: Define actions to execute
4. **Execute Plan**: Implement action handlers
5. **Exit Codes**: Use appropriate codes for different scenarios

## Best Practices

- Keep scripts < 300 LOC
- Keep functions < 60 LOC
- Use `_lib/` modules for shared code
- Write atomically (temp file + rename)
- Make idempotent (repeated runs safe)
- Never use interactive prompts
- Validate inputs with schemas
- Log to STDERR, output to STDOUT

## Related

- Guide: `/guides/guide-scripts.md`
- Guardrails: `/scripts/GUARDRAILS.md`
- Core library: `/scripts/_lib/core.mjs`
- Policy lint: `/scripts/checks/policy-lint.mjs`
