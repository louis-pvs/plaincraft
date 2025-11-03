# CI/PR/Issue Workflow Guidance (Phase 1)

Reference ADR: `/docs/adr/2025-11-03-ci-pr-issue-workflow.md`  
Reference Runbook: `/docs/runbooks/adoption-ci-pr-issue-workflow-phase-1.md`

## 1. Purpose

Establish consistent traceability (Issue → PR → CI) while keeping developer overhead low. Phase 1 is intentionally manual to validate cultural adoption before automation.

## 2. Core Requirements (Phase 1)

| Artifact                  | Required Sections                                                                        | Notes                                      |
| ------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| Issue (feature/bug/chore) | Why this matters, Acceptance Criteria, Priority (ONE)                                    | Optional: Implementation Notes, Links      |
| Pull Request              | Related Issue link, Why this matters, Summary of Changes, Acceptance Alignment checklist | Optional: Implementation Notes, Next Steps |

## 3. Author Flow (Checklist)

1. Create issue with Why + Acceptance + Priority.
2. Start PR early (draft) referencing issue (`Closes #123`).
3. Keep PR Summary of Changes high-level (3-7 bullets).
4. Update Acceptance Alignment as criteria are satisfied.
5. Ensure no unrelated changes are included.

## 4. Reviewer Flow

| Step       | Validation                                        | Tip                                        |
| ---------- | ------------------------------------------------- | ------------------------------------------ |
| Link       | First line contains `Closes #<num>`               | If missing, request fix before deep review |
| Why        | PR Why matches issue rationale                    | Should focus on impact, not code           |
| Acceptance | Alignment checklist ticks relevant items          | Partial completion should be noted         |
| Scope      | No drive-by edits                                 | Suggest separate chore issue if discovered |
| Quality    | CI green (lint/tests/build/storybook if relevant) | Provide focused feedback (perf, a11y)      |

## 5. Priority Selection Guidance

| Priority | Use When                                        | Avoid When                     |
| -------- | ----------------------------------------------- | ------------------------------ |
| P0       | Blocking users, production regression, security | General enhancements           |
| P1       | High user value, unlocks dependent work         | Pure refactors without urgency |
| P2       | Standard feature/bug scope                      | Critical breakage              |
| P3       | Low-impact polish / cleanup                     | User-visible defects           |

## 6. Examples

### 6.1 Issue (Feature)

```markdown
## Why this matters

Users cannot filter recordings by tag, slowing retrieval.

## Acceptance Criteria

- [ ] UI control exposes multi-select tag chips
- [ ] Filtering reduces visible list items immediately
- [ ] Docs updated with tagging workflow

## Priority

- [ ] P0 (critical)
- [x] P1 (high)
- [ ] P2 (normal)
- [ ] P3 (low)
```

### 6.2 Pull Request

```markdown
Closes #123

## Why this matters

Filtering accelerates retrieval and reduces cognitive load for heavy users managing >50 recordings.

## Summary of Changes

- Added TagFilter component
- Wired state into existing RecordingList controller
- Updated docs & tests for tag filtering path

## Acceptance Alignment

- [x] Satisfies linked issue acceptance criteria
- [x] Tests updated / added
- [x] Docs updated / no change required
```

## 7. Exceptions (Phase 1)

| Case               | Relaxation                         | Rationale                          |
| ------------------ | ---------------------------------- | ---------------------------------- |
| Typo / trivial fix | Inline justification allowed       | Avoid ceremony                     |
| Emergency hotfix   | Issue may be backfilled within 24h | Speed > form                       |
| Internal refactor  | Next Steps optional                | May not produce user-facing change |

## 8. Common Pitfalls & Fixes

| Pitfall              | Detection                      | Fix                                           |
| -------------------- | ------------------------------ | --------------------------------------------- |
| Missing Why          | Reviewer friction comment      | Move rationale from commit message into issue |
| Overloaded PR        | Large diff + unrelated cleanup | Split into separate chore issue               |
| No priority selected | Runbook metric gap             | Tick exactly one priority box                 |
| Acceptance ambiguous | Reviewer asks for clarity      | Rewrite criteria as observable behaviors      |

## 9. FAQs

| Question                                   | Answer                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| Can I link multiple issues?                | Yes, but one primary issue must carry rationale. List secondary in Links. |
| Do I need tests for every acceptance item? | Preferably; document rationale if not feasible.                           |
| What if CI fails but rationale is solid?   | Fix CI before merge; rationale does not override quality gates.           |
| Is Next Steps mandatory?                   | Only if this work unlocks follow-on tasks or partial completion.          |

## 10. Future (Phase 2 Preview)

## 11. Single-Link Invariant (Phase 1 Manual, Phase 2 Assisted)

Goal: Preserve a 1:1:1 narrative chain (Issue ↔ PR ↔ optional Next Step) for clarity and ownership.

### 11.1 Rules

| Invariant                          | Why It Matters                              | Manual Remediation                                       |
| ---------------------------------- | ------------------------------------------- | -------------------------------------------------------- | -------------------------------------- | ------------------------------------------ |
| One primary Issue per PR           | Prevents scope ambiguity & mixed acceptance | Split secondary scope into new issues                    |
| One active PR per Issue            | Avoids conflicting implementations          | Close or convert extra PRs to draft; consolidate changes |
| Only one `Closes                   | Fixes                                       | Resolves #` directive                                    | Keeps auto-close semantics unambiguous | Move secondary links to References section |
| At most one follow-up Issue linked | Limits chain sprawl & planning overhead     | Aggregate tasks into a single planning issue             |

### 11.2 Detection (Phase 1)

Reviewer & coordinator visually inspect PR description and issue activity. Logged as part of "Single Link Integrity" metric in runbook.

### 11.3 Phase 2 Automation Concept

Script warns when:

- PR body regex finds >1 `(?:Closes|Fixes|Resolves) #\d+` occurrences
- Issue query shows >1 open PR referencing the same issue number

### 11.4 When to Break the Invariant

| Scenario                                 | Allowable Deviation             | Follow-up                                                |
| ---------------------------------------- | ------------------------------- | -------------------------------------------------------- |
| Large refactor spanning modules          | Temporary multi-PR drafts       | Merge sequence documented, consolidate after first merge |
| Emergency hotfix parallel to planned fix | Hotfix PR + planned refactor PR | Close planned PR once hotfix addresses scope or rebase   |

### 11.5 Escalation

If integrity <95% for a week: announce pattern + remediate. If <85% (critical): freeze new multi-scope PRs until backlog cleaned.

---

Planned gentle CI hints: warn when missing issue link or Why/Acceptance. No hard failures until sustained adoption proven.

---

Maintained by Lane B. Improvements welcome via PR.
