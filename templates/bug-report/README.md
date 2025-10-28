# Bug Report Template

**Version:** v0.1.0  
**Category:** Process/Workflow  
**Purpose:** Structured bug report template for consistent issue reporting.

## Overview

Use this template when reporting bugs to provide:

- Clear reproduction steps
- Environment details
- Expected vs actual behavior
- Impact assessment

## Template Contents

- `bug-report.md` - GitHub issue template for bug reports

## When to Use

**Use this template for:**

- Runtime errors or crashes
- Unexpected behavior in existing features
- Visual/UI bugs
- Performance issues
- Data corruption or loss

**Use Issue (Unit) instead for:**

- Feature requests
- Enhancements to existing features
- Documentation improvements

## Quick Start

```bash
# Copy as GitHub issue template
cp templates/bug-report/bug-report.md .github/ISSUE_TEMPLATE/bug_report.md

# Or use via CLI
gh issue create --template bug_report.md
```

## Related

- Guide: `guides/guide-workflow.md`
- Template: `templates/issue-unit/`, `templates/issue-composition/`
