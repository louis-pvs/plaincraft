# U-pr-requirements-auto-detect

Lane: C (DevOps & Automation)  
Created: 2025-10-28

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** scripts, dx, enhancement

## Purpose

Enable `pr-requirements.mjs` to auto-detect PR and issue numbers from the current Git context (branch, environment, gh CLI) so developers can run validation commands without manually specifying numbers.

## Problem

Currently, `scripts/checks/pr-requirements.mjs` requires explicit PR and issue numbers to be passed either as:

- Positional arguments: `--pr 71 --issue 68`
- Environment variables: `PR_NUMBER=71 ISSUE_NUMBER=68`

When developers run the script from a branch with an active PR, they encounter:

```bash
$ node scripts/checks/pr-requirements.mjs verify-pr
[ERROR] Validation error: Expected number, received nan
```

This creates poor developer experience because:

1. Developers must look up PR numbers manually
2. The script works in CI (has env vars) but fails locally
3. No fallback to detect context from current branch
4. Error message doesn't guide users on how to fix it

## Proposal

Add auto-detection logic to `pr-requirements.mjs` that attempts to resolve PR/issue numbers in this order:

### Detection Priority

1. **Explicit flags** - `--pr`, `--issue` (highest priority)
2. **Environment variables** - `PR_NUMBER`, `ISSUE_NUMBER` (CI context)
3. **GitHub CLI** - `gh pr view --json number` for current branch
4. **Branch name parsing** - Extract from `feat/<issue>-description` format
5. **Graceful fallback** - Clear error message with resolution steps

### Implementation

```javascript
async function detectPrContext(flags, log) {
  // 1. Check explicit flags
  if (flags.pr && flags.issue) {
    return { prNumber: flags.pr, issueNumber: flags.issue, source: "flags" };
  }

  // 2. Check environment variables
  const envPr = parseInt(process.env.PR_NUMBER, 10);
  const envIssue = parseInt(process.env.ISSUE_NUMBER, 10);
  if (!isNaN(envPr) && !isNaN(envIssue)) {
    return { prNumber: envPr, issueNumber: envIssue, source: "env" };
  }

  // 3. Try gh CLI for current branch
  try {
    const result = await execa("gh", ["pr", "view", "--json", "number"], {
      reject: false,
    });
    if (result.exitCode === 0) {
      const prData = JSON.parse(result.stdout);
      const prNumber = prData.number;

      // Get linked issue from PR body or via gh
      const prDetail = await execa("gh", [
        "pr",
        "view",
        prNumber.toString(),
        "--json",
        "body",
      ]);
      const issueNumber = extractIssueFromPrBody(
        JSON.parse(prDetail.stdout).body,
      );

      if (issueNumber) {
        log.debug(
          `Auto-detected PR #${prNumber}, Issue #${issueNumber} from gh CLI`,
        );
        return { prNumber, issueNumber, source: "gh-cli" };
      }
    }
  } catch (err) {
    log.trace("gh CLI detection failed:", err.message);
  }

  // 4. Try branch name parsing
  const branch = await getCurrentBranch();
  const match = branch.match(/^feat\/(\d+)-/);
  if (match) {
    const issueNumber = parseInt(match[1], 10);
    log.debug(`Auto-detected issue #${issueNumber} from branch name`);
    // Still need PR number - could try listing PRs for this branch
    return { issueNumber, source: "branch" };
  }

  // 5. Fail with helpful message
  throw new Error(
    "Could not auto-detect PR/issue context. Please provide:\n" +
      "  --pr <number> --issue <number>\n" +
      "Or set environment variables:\n" +
      "  PR_NUMBER=<number> ISSUE_NUMBER=<number>\n" +
      "Or ensure you have an active PR for the current branch.",
  );
}
```

## Contracts

**Auto-detection behavior:**

- Must not break existing CI workflows (env vars take precedence)
- Must not make network calls if explicit flags provided
- Must log detection source at debug level
- Must fail fast with actionable error message

**Backward compatibility:**

- Existing flag-based usage continues working
- Environment variable usage unchanged
- CI workflows require no modification

## Props + Shape

**Input flags:**

```typescript
{
  pr?: number;          // Explicit PR number (highest priority)
  issue?: number;       // Explicit issue number (highest priority)
  logLevel?: string;    // Control auto-detection logging
}
```

**Detection result:**

```typescript
{
  prNumber: number;
  issueNumber: number;
  source: "flags" | "env" | "gh-cli" | "branch";
}
```

## Behaviors

**Scenario 1: Explicit flags (current behavior)**

```bash
$ node scripts/checks/pr-requirements.mjs verify-pr --pr 71 --issue 68
✅ No detection needed, uses provided values
```

**Scenario 2: CI environment**

```bash
$ PR_NUMBER=71 ISSUE_NUMBER=68 node scripts/checks/pr-requirements.mjs verify-pr
✅ Uses environment variables
```

**Scenario 3: Local development with active PR**

```bash
$ git checkout feat/arch-scripts-migration-complete
$ node scripts/checks/pr-requirements.mjs verify-pr
🔍 Auto-detecting context...
✅ Found PR #71, Issue #68 via gh CLI
```

**Scenario 4: No context available**

```bash
$ git checkout main
$ node scripts/checks/pr-requirements.mjs verify-pr
❌ Could not auto-detect PR/issue context. Please provide:
   --pr <number> --issue <number>
```

## Acceptance Checklist

- [ ] `detectPrContext()` function implemented with 5-step fallback
- [ ] Explicit flags take priority over auto-detection
- [ ] Environment variables detected (CI compatibility)
- [ ] `gh pr view` integration for current branch PR lookup
- [ ] Branch name parsing for `feat/<issue>-*` pattern
- [ ] Helpful error message when detection fails
- [ ] Debug logging shows detection source
- [ ] Unit tests for each detection path
- [ ] Integration test with mock gh CLI responses
- [ ] CI workflows verified unchanged
- [ ] Documentation updated with auto-detection examples
- [ ] `--help` output mentions auto-detection capability

## Testing Strategy

**Unit tests:**

- Mock environment variables
- Mock `execa` responses for gh CLI
- Mock `getCurrentBranch()` responses
- Test error message formatting

**Integration tests:**

- Run script in directory with active PR
- Run script in directory without PR
- Verify flags override auto-detection
- Verify env vars override gh CLI

## Notes

- This improves developer experience without changing CI behavior
- gh CLI is already a dependency for other scripts
- Similar auto-detection could benefit other scripts (ideas-to-issues, sync-ideas-checklists)
- Consider extracting detection logic to `_lib/github.mjs` for reuse

## Links

- Script: `/scripts/checks/pr-requirements.mjs`
- Related: `/scripts/_lib/github.mjs` (potential shared library)
- CI workflow: `.github/workflows/pr-check.yml`
