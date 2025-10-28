# ARCH: AI Agent Should Use gh CLI Over curl

Lane: C (DevOps & Automation)
Created: 2025-10-27
Tag: `ARCH-agent-gh-cli`

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, tooling

## Purpose

Ensure the agent defaults to the GitHub CLI and existing scripts so automation stays reliable, error handling is consistent, and raw API calls remain a last resort.

## Problem

During today's work session, the AI agent made excessive `curl` API calls instead of using:

1. **`gh` CLI** - The official GitHub CLI tool already available and authenticated
2. **Existing scripts** - Many operations have wrapper scripts that handle edge cases

Examples from today:

- `curl .../issues?state=open` → should use `gh issue list`
- `curl .../actions/jobs/.../logs` → should use `gh run view`
- Direct API pagination → `gh` handles this automatically

**Impact:**

- More verbose code
- Bypasses `gh`'s built-in error handling
- Doesn't leverage existing script abstractions
- Harder to maintain (raw API contracts vs CLI interface)

## Proposal

Add agent instructions to prefer:

1. **`gh` CLI for GitHub operations:**

   ```bash
   # Instead of curl
   gh issue list --state open --json number,title,state
   gh pr view 123 --json body
   gh run view 456 --log
   ```

2. **Existing scripts when available:**
   - `scripts/ideas-to-issues.mjs` for issue creation
   - `scripts/sync-issue-to-card.mjs` for syncing
   - `scripts/archive-idea-for-issue.mjs` for archival

3. **curl only as last resort:**
   - When `gh` doesn't support the operation
   - For non-GitHub APIs

## Acceptance Checklist

- [ ] Document `gh` CLI commands for common operations in guides/
- [ ] Add agent instruction preference: `gh` > existing scripts > `curl`
- [ ] Create quick reference: GitHub operation → recommended command/script
- [ ] Test agent follows preference on sample issue workflow
- [ ] Update SCRIPTS-REFERENCE.md with "When to use each tool" section

## References

- Today's work: Had to curl GitHub API 10+ times for issue checks
- Official CLI: https://cli.github.com/manual/
- Existing scripts: `guides/SCRIPTS-REFERENCE.md`
