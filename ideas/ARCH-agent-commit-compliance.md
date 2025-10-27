# ARCH: AI Agent Should Follow Commit Message Compliance

**Tag:** `ARCH-agent-commit-compliance`  
**Lane:** C (DevOps & Automation)  
**Created:** 2025-10-27

## Problem

The AI agent's git commits today did not follow the project's commit message convention defined in `guides/CHANGELOG-GUIDE.md`:

**Required format:**

```
[<ticket-ID>] <description>
```

Where `<ticket-ID>` must be one of: `U-<slug>`, `C-<slug>`, `B-<slug>`, `ARCH-<slug>`, `PB-<slug>`

**What happened today:**

```bash
# Agent commits (NON-COMPLIANT):
git commit -m "Fix sub-issue parsing regex"
git commit -m "Add exact title matching to archival script"

# Should have been:
git commit -m "[ARCH-subissue-pipeline-repair] Fix sub-issue parsing regex"
git commit -m "[ARCH-subissue-fix-retroactive-archive] Add exact title matching"
```

**Impact:**

- Breaks changelog automation (consolidate-changelog.mjs expects tags)
- Violates pre-commit hook expectations
- Makes git history hard to filter by feature/ticket
- Inconsistent with team conventions

## Proposal

Update agent instructions to:

1. **Always extract ticket ID from context:**
   - From open issue being worked on
   - From idea card filename (`ARCH-xxx.md` → `[ARCH-xxx]`)
   - From PR title if working in PR branch
   - Ask user if context is ambiguous

2. **Format all commits with tag:**

   ```bash
   git commit -m "[<ticket-ID>] <imperative description>"
   ```

3. **Validate before committing:**
   - Check message starts with `[` and contains one of: `U-`, `C-`, `B-`, `ARCH-`, `PB-`
   - Reject if missing or malformed

4. **Handle edge cases:**
   - Multiple tickets in same session → ask which ticket each commit belongs to
   - Fixing scripts during other work → use the parent ticket tag
   - Initial repo setup → use `[ARCH-setup]` or similar

## Acceptance Checklist

- [ ] Add commit format validation to agent instruction set
- [ ] Agent extracts ticket ID from: issue context, idea filename, or PR title
- [ ] Agent asks user if ticket ID is ambiguous
- [ ] Test commit message format on sample workflow
- [ ] Document commit format requirements in agent system prompt
- [ ] Add pre-commit check that warns on missing tag (for all contributors)

## References

- Compliance guide: `guides/CHANGELOG-GUIDE.md` lines 49-53
- Related scripts: `scripts/consolidate-changelog.mjs` (expects tags)
- Pre-commit: `scripts/pre-commit-changelog.mjs`
- Git history: Check recent commits for format examples
