---
id: ref-pr-body-generation
owner: "@lane-c"
lane: C
version: 1.0.0
created: 2025-11-02
ttl_days: 90
last_verified: 2025-11-02
prev: /reference/coverage-map
next: /scripts-reference
---

# PR Body Generation Enhancement

## Overview

As part of Phase 2 of the E2E automation gaps fixes (Issue #111, PR #143), the PR body generation has been significantly enhanced to provide better structure and changelog extraction.

## Changes Made

### Enhanced `buildPrBody()` Function

Location: `scripts/ops/open-or-update-pr.mjs`

The function now generates comprehensive PR bodies that include:

1. **Purpose Section** - Extracted from idea file
2. **Problem Section** - Extracted from idea file
3. **Proposal Section** - Extracted from idea file
4. **Changes Section** (NEW) - Auto-generated changelog-friendly section
5. **Acceptance Checklist** - Extracted from idea file
6. **Metadata Footer** - Idea source, branch, status

### Changes Section Logic

The new "## Changes" section provides a changelog-friendly format:

- **If proposal contains bullet points**: Extracts and uses those bullets directly
- **If no bullets found**: Generates a summary statement
- Prepends context: "This PR implements the following changes based on the proposal above:"

This makes it easier for the `extract-pr-changelog` script to find and extract meaningful changelog content.

## Usage

When creating a PR with `ops:open-or-update-pr`:

```bash
pnpm ops:open-or-update-pr --id C-123 --yes
```

The script will:

1. Look for the idea file in `ideas/` directory
2. Extract all relevant sections
3. Generate a comprehensive PR body with all sections
4. Create or update the PR on GitHub

## Example Output

```markdown
Closes #123

## Purpose

Improve user onboarding experience...

## Problem

Current onboarding flow lacks...

## Proposal

### Phase 1

- Implement feature X
- Add validation for Y

## Changes

This PR implements the following changes based on the proposal above:

- Implement feature X
- Add validation for Y

## Acceptance Checklist

- [ ] Feature X implemented
- [ ] Validation Y added
- [ ] Tests passing

---

**Idea**: feature-name
**Source**: `/ideas/C-feature-name.md`
**Branch**: `feat/C-123-feature-name`
**Status**: In Progress
```

## Benefits

1. **Better Changelog Extraction**: The Changes section is specifically formatted for changelog extraction
2. **Complete Context**: All idea sections preserved in PR body
3. **Traceability**: Clear link between idea file, issue, and PR
4. **Consistent Format**: All PRs follow the same structure

## Testing

Tested with:

- ✅ ARCH-type ideas (e.g., ARCH-e2e-automation-gaps)
- ✅ PR #143 successfully used enhanced body format
- ✅ Changelog extraction worked perfectly from enhanced body
- ⏳ Additional idea types (C, B, PB, U) - to be tested in real workflows

## Related

- Issue #111: ARCH-e2e-automation-gaps
- PR #143: Phase 1 implementation
- Script: `scripts/ops/extract-pr-changelog.mjs`
- Script: `scripts/ops/open-or-update-pr.mjs`
