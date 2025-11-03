# Runbook: CI/PR/Issue Workflow Adoption (Phase 1)

**Scope:** Track and coordinate adoption of ADR 0001 Phase 1 (Foundations)  
**Owner:** Lane D (Program Operations)  
**Start Date:** 2025-11-03  
**Checkpoint:** 2025-12-03 (30-day)

---

## 1. Objective

Establish cultural adoption of the lightweight CI/PR/Issue workflow (issue linkage + rationale + acceptance clarity) before investing in automation.

---

## 2. Metrics

### 2.1 Definitions

| Metric                        | Definition                                                                                        | Source          | Collection Method    | Target |
| ----------------------------- | ------------------------------------------------------------------------------------------------- | --------------- | -------------------- | ------ |
| Issue Link Usage              | % of new PRs whose first commit description includes `Closes #<num>` or equivalent                | PR list         | Manual weekly sample | ≥80%   |
| Issue Structural Completeness | % of new issues containing both "Why this matters" and "Acceptance Criteria" sections (non-empty) | Issues list     | Manual weekly sample | ≥70%   |
| PR Template Usage             | % of new PRs created with populated template sections (Why + Summary + Acceptance tick boxes)     | PR diff         | Manual weekly sample | ≥90%   |
| Priority Declaration          | % of new feature/bug issues with one priority checkbox selected                                   | Issue body      | Manual weekly sample | ≥85%   |
| Reviewer Friction             | % of PR reviews requesting structural fixes (missing link, missing Why)                           | Review comments | Manual weekly tally  | ≤10%   |
| Single Link Integrity         | % of sampled items adhering to invariant: one primary issue per PR, one active PR per issue       | PR & Issue set  | Manual weekly sample | ≥95%   |

### 2.2 Sampling Strategy

- Time window: Monday 00:00 UTC – Sunday 23:59 UTC
- Sample size: Up to first 15 PRs + first 15 issues each week (or all if fewer)
- Prefer breadth across contributors

### 2.3 Recording Cadence

| Week                | PRs Observed | Issues Observed | Issue Link Usage | Struct Completeness | Template Usage | Priority Decl | Reviewer Friction | Notes                                            |
| ------------------- | ------------ | --------------- | ---------------- | ------------------- | -------------- | ------------- | ----------------- | ------------------------------------------------ |
| 0 (Nov 3 snapshot)  | N/A          | N/A             | N/A              | N/A                 | N/A            | N/A           | N/A               | Baseline pre-sampling; expectations communicated |
| 1 (Nov 3 - Nov 9)   | TBD          | TBD             | TBD              | TBD                 | TBD            | TBD           | TBD               | Initialization week                              |
| 2 (Nov 10 - Nov 16) | TBD          | TBD             | TBD              | TBD                 | TBD            | TBD           | TBD               |                                                  |
| 3 (Nov 17 - Nov 23) | TBD          | TBD             | TBD              | TBD                 | TBD            | TBD           | TBD               | Phase 2 scoping earliest                         |
| 4 (Nov 24 - Nov 30) | TBD          | TBD             | TBD              | TBD                 | TBD            | TBD           | TBD               | Pre-checkpoint consolidation                     |

### 2.4 Escalation Thresholds

| Metric                | Warning | Critical | Action                                                       |
| --------------------- | ------- | -------- | ------------------------------------------------------------ |
| Issue Link Usage      | <75%    | <60%     | Reinforce template usage; share examples                     |
| Struct Completeness   | <65%    | <50%     | Author guidance refresh; highlight good issues               |
| Template Usage        | <85%    | <70%     | Investigate tooling friction; consider automation earlier    |
| Priority Decl         | <80%    | <60%     | Emphasize prioritization in planning sync                    |
| Reviewer Friction     | >15%    | >25%     | Simplify template; clarify exceptions                        |
| Single Link Integrity | <95%    | <85%     | Identify multi-link patterns; enforce split or consolidation |

---

## 3. Roles & Responsibilities

| Role   | Responsibility                                        |
| ------ | ----------------------------------------------------- |
| Lane D | Coordinate sampling & publish weekly updates          |
| Lane B | Adjust templates/documentation based on feedback      |
| Lane C | Prepare feasibility notes for Phase 2 (end of Week 2) |
| Lane A | Evaluate need for helper parsing functions (Week 3)   |

---

## 4. Weekly Operations Checklist

1. Collect list of PRs merged/created in sample window
2. Collect list of issues created in sample window
3. Tally metrics per definitions
4. Log row in recording table
5. Identify any metrics crossing thresholds
6. Draft weekly summary (bullets: highlights, risks, actions)
7. Post summary to team channel & link ADR
8. Update "Notes" column with any structural changes

---

## 5. Communication Templates

### 5.1 Weekly Summary (Example)

```
Week 1 Adoption Snapshot:
- Issue Link Usage: 78% (Target 80%) – Slightly below, reinforce PR template use.
- Structural Completeness: 72% (Target 70%) – On track.
- Template Usage: 91% (Target 90%) – Good early adoption.
- Priority Declaration: 83% (Target 85%) – Minor gap.
- Reviewer Friction: 12% (Target <=10%) – Monitor next week.
Actions: Share two good example issues. Lane C to outline automation feasibility.
```

### 5.2 Escalation Message (Critical Drop)

```
Alert: Issue Link Usage dropped to 58% (Critical <60%).
Intervention Plan:
1. Highlight issue linking benefits.
2. Add quick reference in README contributing section.
3. Lane C to evaluate simple link check sooner.
```

---

## 6. Risk Register

| Risk                          | Likelihood | Impact | Mitigation                               | Owner  |
| ----------------------------- | ---------- | ------ | ---------------------------------------- | ------ |
| Low participation early weeks | Medium     | Medium | Reinforce in planning sync               | Lane D |
| Template fatigue              | Medium     | High   | Keep Phase 1 manual, avoid over-policing | Lane D |
| Phase 2 scope creep           | Low        | High   | Define minimal automation first          | Lane C |
| Priority misuse (all P1)      | Medium     | Low    | Add guidance examples                    | Lane B |

---

## 7. Exit Criteria for Phase 1

Phase 1 considered stable and ready for Phase 2 kickoff when:

- Two consecutive weeks meet all metric targets OR
- Three weeks average reaches ≥95% of targets with declining friction

If not met by 2025-12-03:

- Perform adoption retro
- Decide whether to extend Phase 1 or start partial Phase 2 anyway

---

## 8. References

- ADR: `docs/adr/2025-11-03-ci-pr-issue-workflow.md`
- PR Template: `.github/pull_request_template.md`
- Issue Templates: `.github/ISSUE_TEMPLATE/feature.md`, `bug.md`, `chore.md`

---

**Next Update Published:** Weekly (first on 2025-11-10)  
**Coordinator:** Lane D  
**Review Checkpoint:** 2025-12-03
