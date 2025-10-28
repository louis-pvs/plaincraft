# Test (Unit) Template

**Version:** v0.1.0  
**Category:** Testing  
**Purpose:** Unit test template for component and function testing with Vitest.

## Overview

Use this template when creating unit tests for:

- React components in isolation
- Pure utility functions
- Single-responsibility modules
- Business logic without external dependencies

## Template Contents

- `test-unit.spec.ts` - Vitest test suite with describe/it/expect structure

## When to Use

**Use this template when:**

- Testing a single component or function
- No external dependencies (API, database, file system)
- Mocking not required or minimal
- Fast execution (< 100ms per test)

**Use Test (Integration) template instead when:**

- Multiple components interact
- External dependencies required (API calls, storage)
- Complex state management involved
- Slower execution acceptable

## Quick Start

```bash
# Copy template for new test
cp templates/test-unit/test-unit.spec.ts src/components/Button.spec.tsx

# Run tests
npm test Button.spec.tsx
```

## Related

- Guide: `guides/guide-scripts.md`
- Script: `scripts/test-storybook.mjs`
- Template: `templates/test-integration/`
