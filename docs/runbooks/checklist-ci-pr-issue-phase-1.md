# Checklist: Phase 1 CI/PR/Issue Workflow Adoption

Purpose: Condensed weekly execution steps for Lane D during Phase 1 of ADR 0001.

## Weekly Cycle (Run Monday)

- [ ] Retrieve list of PRs (first 15) created in prior week
- [ ] Retrieve list of Issues (first 15) created in prior week
- [ ] Score each PR for: issue link (yes/no), template sections populated (Why, Summary, Acceptance alignment)
- [ ] Score each Issue for: Why section present & non-empty, Acceptance Criteria list present, one priority checkbox selected
- [ ] Verify Single-Link Integrity: no PR with >1 `Closes|Fixes|Resolves #` directive; no Issue with >1 active PR
- [ ] Tally counts & compute percentages for all metrics
- [ ] Update runbook recording table row for the week
- [ ] Threshold check (Warning/Critical) per runbook escalation table
- [ ] Draft Weekly Summary (use template)
- [ ] Post summary to team channel & link ADR + runbook
- [ ] Add any structural feedback to risk register if new
- [ ] Identify readiness signals for Phase 2 (if Week ≥2)

## Mid-Week Spot Checks (Optional)

- [ ] Random 3 new PRs for template completeness
- [ ] Random 3 new Issues for structural completeness
- [ ] Capture friction anecdotes (if any) for report appendix

## Pre-Checkpoint (Week 4)

- [ ] Compile 4-week trend lines
- [ ] Note interventions performed and their impact
- [ ] Draft Phase 1 execution report skeleton

Refer to `/docs/runbooks/adoption-ci-pr-issue-workflow-phase-1.md` for metric definitions and targets.
