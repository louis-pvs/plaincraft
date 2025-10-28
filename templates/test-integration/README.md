# Test (Integration) Template

**Version:** v0.1.0  
**Category:** Testing  
**Purpose:** Integration test template for multi-component and API interaction testing.

## Overview

Use this template when creating integration tests for:

- Multiple components working together
- API calls and data flow
- State management across components
- User workflows spanning multiple screens

## Template Contents

- `test-integration.spec.tsx` - Vitest test suite with setup/teardown and mocked dependencies

## When to Use

**Use this template when:**

- Testing interaction between multiple components
- External dependencies needed (API, storage, routing)
- Complex state management involved
- End-to-end user workflows
- Slower execution acceptable (< 5s per test)

**Use Test (Unit) template instead when:**

- Testing single component in isolation
- No external dependencies
- Fast execution required (< 100ms)
- Pure functions or simple rendering

## Quick Start

```bash
# Copy template for new integration test
cp templates/test-integration/test-integration.spec.tsx src/__tests__/UserProfile.integration.spec.tsx

# Run integration tests
npm test -- --run src/__tests__/
```

## Related

- Guide: `guides/guide-scripts.md`
- Script: `scripts/test-storybook.mjs`
- Template: `templates/test-unit/`
