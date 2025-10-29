# ARCH: AI Agent Commit Message Compliance v2

Lane: C (DevOps & Automation)
Tag: `ARCH-agent-commit-compliance`
Owner: Pair C
Issue: #72

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Tag:** `ARCH-agent-commit-compliance`
- **Owner:** Pair C

## Purpose

Keep commit history compact while preserving a one-to-one link between commits, tickets, PR slugs, and changelog entries.

## Problem

- Long slugs make history unreadable and wrap in terminals.
- Numeric, fixed-width IDs are filterable and stable, but they are inconsistently applied.
- Slugs still exist for humans, just not spammed per commit, so agents currently repeat them in headers and create noise.

## Proposal

### Decision

Adopt a compact commit header:
`[ID] type(scope): subject`
where `ID` is a **short ticket id** (`ARCH-123`, `U-58`, etc.). The long **slug lives in the PR title and changelog**, not in every commit.

### Policy

**Allowed ID formats**

- `ARCH-<number>`
- `U-<number>`
- `C-<number>`
- `B-<number>`
- `PB-<number>`

**Commit format**

```
[ARCH-123] fix(parser): handle empty sub-issue list
[U-58] feat(inline-edit): add Escape to cancel
[C-7] chore(ci): raise timeout to 15m for sb-test
```

**PR format**

- Title: `[ARCH-123] Sub-issue pipeline repair — retroactive archive`
- Description: must include the long slug and links to idea/issue.

**Branch format**

- `feat/ARCH-123-subissue-pipeline-repair`
- `fix/U-58-inline-edit-escape-key`

### Guardrails

1. **Short ID only in commit header**
   Slugs are banned in commit headers. They belong in PR title/body and changelog.

2. **Auto-prefix from source of truth**
   Prefer in order:
   - Branch name → extract first `([A-Z]+-\d+)`
   - Linked issue/PR title → extract first `([A-Z]+-\d+)`
   - Idea file name → map to numeric ID if present
     If ambiguous, the agent must ask.

3. **Conventional Commit atoms**
   `type` in `{feat, fix, perf, refactor, chore, docs, test, build, ci, revert}`
   `scope` is optional and kebab-case. `subject` is imperative, ≤ 72 chars.

4. **Length caps**
   Header ≤ 100 chars. Subject ≤ 72 chars. No emojis, no trailing periods.

5. **Multi-ticket work**
   Use the **primary** ticket in header. Add others in body as `Refs: ARCH-456, U-99`.

6. **Initial setup or cross-cutting**
   Use `[ARCH-0] chore(repo): initial scaffolds` for bootstrap only.

### Invariants

- Every commit begins with `\[([A-Z]+-\d+)\]\s+[a-z]+(\([^)]*\))?:\s+\S+`
- If branch contains an ID, the commit must match that ID.
- If a PR is open, commit ID must equal PR’s leading ID.
- No commit ever begins with a slug. CI blocks it.
- Changelog generator maps `ID → slug` using PR metadata, not commit text.

### Implementation Notes

**Regexes**

- Validation:
  `^\[(ARCH|U|C|B|PB)-\d+\]\s+(feat|fix|perf|refactor|chore|docs|test|build|ci|revert)(\([a-z0-9-]+\))?:\s.{1,72}$`
- Slug ban (block):
  `^\[[A-Z]+-[a-z0-9-]{6,}\]` ← if this matches, reject

**prepare-commit-msg hook**

- If header missing, read branch, extract `([A-Z]+-\d+)`, and prefill `[ID] type(scope): `.
- If header present but ID mismatches branch, warn and replace unless `--no-verify`.

**commit-msg hook**

- Reject on regex mismatch.
- Reject if slug detected in header.
- Hard-fail if no ID resolvable and no interactive context.

**CI validator**

- `scripts/ops/validate-commit-headers.mjs` exposes the same validation logic for CI jobs, CLI usage, and bulk scans.

**Agent instruction delta**

- On commit, resolve ID via branch → PR → issue → idea.
- If none found, pause and request `ID:` from user.
- Format as `[ID] type(scope): subject`.
- Put long slug and details in the PR title/body; do not repeat in commits.

**Changelog mapping**

- `consolidate-changelog.mjs` looks up PR by `ID`, pulls slug from PR title, renders entries as:
  - `- [ARCH-123] Sub-issue pipeline repair — fix(parser): handle empty list`

### Edge Cases

- **WIP commits**: `[ARCH-123] chore: wip` is allowed locally but must be squashed before merge. Enforce via branch protection: “require squash merge.”
- **Bulk refactors**: split by scope, still use one ID per commit to keep traceable.
- **Reverts**: `revert:` type is allowed and must include original header in body.

## Acceptance Checklist

- [x] `commit-msg` hook rejects headers without `[ID] type: subject`
- [x] `prepare-commit-msg` prepopulates from branch `([A-Z]+-\d+)`
- [x] CI job fails if any commit in the PR violates policy
- [ ] Changelog job maps `ID → slug` using PR title; no slug scraping from commits
- [ ] Agent system prompt updated with the resolution order and format rules
- [x] Tests include: valid header, wrong ID vs branch, slug-in-header, overlength subject, missing type, multi-ticket body refs

## Examples

**Good**

```
[ARCH-123] fix(parser): accept empty arrays
[U-58] feat(inline-edit): add Escape to cancel
[C-7] ci(storybook): shard sb-test by group
```

**Bad**

```
[ARCH-subissue-fix-retroactive-archive] Add exact title matching   # slugged header
Fix sub-issue parsing regex                                       # missing ID and type
[ARCH-123] Fix: Capitalized type                                  # wrong case
[ARCH-123] feat: this subject is absurdly long and wraps everywhere and now everyone suffers
```

## Rollout

1. Add hooks and CI validator with the regex above.
2. Update agent prompt and branch template naming.
3. Migrate open branches to `TYPE/ID-slug` on next push.
4. Run a one-time history scan; open a fix PR if violations > 0.
5. Flip branch protections to “squash & merge only.”
