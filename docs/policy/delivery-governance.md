# Delivery Governance

**Version:** `1.0.0`  
**Effective:** `2025-11-02`  
**Owner:** `@louis-pvs`

---

## What This Governs

This document explains **how a single operator delivers work** across four audiences:

1. **Unit**: code and stories
2. **View**: Storybook behavior docs
3. **Playbook**: decision pages with GIF
4. **Ops**: CI budgets, guardrails, compliance

The system is designed to:

- Keep all four in sync without a project tracker
- Provide one source of truth per ID
- Make drift and staleness visible
- Preserve guardrails while sunsetting lane ownership

---

## Core Concepts

### The Delivery Record

**Location:** `deliveries/[ID]/RECORD.md`

**Purpose:** Single source of truth for an ID's delivery status.

**Contains:**

- Links to all four deliverables
- Proof lists (stories, a11y, CI budgets, media)
- Rollback instructions
- One "Next" action
- Verified dates and template versions

**Rule:** The Delivery Record is updated **first** before any deliverable is marked as done.

---

### The Four Deliverables

1. **Unit** (`src/units/[name]/README.md` or similar)
   - Focused code change with deterministic stories
   - Thin README linking to Delivery Record and template
   - a11y checked (criticals = 0)

2. **View** (Storybook docs or `docs/view/[name].md`)
   - Explains behavior, states, edge cases
   - No how-to content
   - Links to Unit and Delivery Record

3. **Playbook** (`playbook/[name].md` or similar)
   - Decision page: when/why to use
   - One GIF if it changes a decision (≤10s, ≤960px, ≤2MB)
   - Links to Unit and template

4. **Ops** (recorded in Delivery Record)
   - CI metrics: p95 delta vs baseline (≤+90s)
   - Compliance: commit format, branch format
   - Artifact sizes: Storybook, demo builds

---

### Cross-Link Loop

**Rule:** Each deliverable embeds the ID and links back to the Delivery Record. The Delivery Record links to all four.

**Example:**

```
Delivery Record → Unit README
Unit README → Delivery Record

Delivery Record → View Docs
View Docs → Delivery Record

Delivery Record → Playbook Page
Playbook Page → Delivery Record

Delivery Record contains Ops data
```

---

### Freshness Contract

**Rule:** All four deliverables show the **same verified date** and **template version** as the Delivery Record.

**Stale:** If a deliverable's verified date is >7 days older than the Delivery Record, it's flagged as stale.

**Action:** CI warns on stale items; operator must refresh before marking ID as "done."

---

## Workflow (Single Operator)

### 1. Start an ID

1. Copy `templates/delivery/DELIVERY_RECORD.md` to `deliveries/[ID]/RECORD.md`
2. Fill in ID, owner, status, template version
3. Add the ID to `deliveries/INDEX.md`
4. Set the first **Next** action

### 2. Ship Unit

1. Implement code and stories
2. Verify a11y (criticals = 0)
3. Update Unit README with verified date
4. Update Delivery Record: check Unit box, update verified date

### 3. Ship View

1. Document behavior in Storybook or View docs
2. Add cross-links to Unit and Delivery Record
3. Update View docs with verified date
4. Update Delivery Record: check View box, update verified date

### 4. Ship Playbook

1. Create or update decision page
2. Add GIF if decision changes (verify limits)
3. Add cross-links to Unit and template
4. Update Playbook page with verified date
5. Update Delivery Record: check Playbook box, update verified date

### 5. Verify Ops

1. Check CI p95 delta (≤+90s)
2. Verify commit and branch format compliance
3. Record artifact sizes if changed
4. Update Delivery Record: check Ops box, update verified date

### 6. Open PR

1. Copy `templates/delivery/PR_COVENANT.md` for PR description
2. Fill in all sections: links, proofs, rollback, next, follow-ups
3. Verify all guardrails checklist items
4. Open PR with title: `[ID] One-line subject`

### 7. Merge or Park

- **Merge:** Update INDEX.md with final verified dates
- **Park:** Add `parked` label, set **Next** action and owner for resume

### 8. Archive (when complete)

1. Move `deliveries/[ID]/` to `deliveries/_archive/[ID]/`
2. Update INDEX.md to remove from active list
3. Keep archive immutable (no further edits)

---

## Visibility

### Delivery Index

**Location:** `deliveries/INDEX.md`

**Shows:**

- All active IDs
- Four checkmarks (Unit, View, Playbook, Ops)
- Verified dates per deliverable
- One **Next** action per ID
- Filter views: Stale, Failing, Blocked

**Update frequency:** After every deliverable is shipped or verified date changes.

---

## Rules (The Only Ones That Matter)

1. **Delivery Record is truth**  
   Update it first before calling any deliverable "done."

2. **Cross-link loop required**  
   Every deliverable links to the Delivery Record. The Record links to all four.

3. **Same verified date and version**  
   All four deliverables must match the Delivery Record's verified date and template version.

4. **PR Covenant mandatory**  
   Every PR includes: links, proofs, rollback, next, follow-ups.

5. **Guardrails preserved**  
   Commit format, CI budgets, GIF limits, a11y standards enforced. See [Guardrails Policy](guardrails.md).

---

## What Changed (Sunset)

### Before (Lane Ownership)

- Work split across Lanes A (UI), B (Playbook), C (Ops), D (oversight)
- Project boards tracked status per lane
- Role assignments tied to lanes
- Guide ratio rules dictated doc coverage
- Multi-board sync required for cross-lane work

### After (Single Operator)

- One operator ships all four deliverables
- Delivery Record replaces project board
- Delivery Index replaces multi-board tracking
- Templates and guardrails replace lane-specific rules
- No role splits—operator decides sequence

### What's Preserved

- All functional guardrails (commit format, CI budgets, media limits, a11y)
- Automation enforcement (CI checks, warnings, hard failures)
- Exception process (14-day time limits, labels, tracking)

### What's Archived

- Lane ownership documents (`docs/runbooks/lane-*.md`)
- Multi-board policies
- Guide ratio rules
- Role split assignments

Archived to: `docs/_archive/sunset-lane-ownership/`

---

## Exception Handling

### When Needed

- Can't meet a guardrail temporarily
- Need more than +90s CI headroom for optimization work
- GIF exceeds limits but is critical for decision clarity

### Process

1. Create issue with label `guardrail-exception`
2. Tag owner (`@louis-pvs`)
3. State: which guardrail, why exception needed, duration requested
4. Owner approves with expiry date (default ≤14 days)
5. Log exception in Delivery Record under "Notes"
6. CI re-enables enforcement after expiry

---

## Automation

### CI Checks (Hard Failures)

- Commit header format mismatch
- Branch format mismatch with PR title ID
- CI p95 exceeds +90s budget
- GIF violates limits (duration, size, dimensions, missing alt/caption)
- a11y criticals or serious violations introduced
- Multiple open PRs for same ID (without `parked` label)

### CI Warnings (Non-Blocking)

- Stale verified dates (>7 days difference)
- Missing cross-links between deliverables
- Template version mismatch

### Dashboard (Informational)

- Commit compliance rate
- CI p95 trend
- Exception usage and expiry tracking
- Stale Delivery Records (>7 days no update)

---

## Templates Reference

All templates live in `templates/delivery/`:

- `DELIVERY_RECORD.md` - Delivery Record structure
- `PR_COVENANT.md` - PR description template
- `UNIT_README.md` - Thin Unit documentation
- `VIEW.md` - Storybook behavior docs
- `PLAYBOOK.md` - Decision pages with GIF guidelines

**Template versions:** Each template has a version field. Deliverables must use the same version as the Delivery Record.

---

## One Decision to Revisit

**Decision:** Keep the Delivery Index as a plain markdown list.

**Revisit when:** Active IDs regularly exceed **8**.

**Change criteria:** If scanning the index takes longer than **10 seconds** for two consecutive weeks, consider a generated index or tooling.

---

## Rollback

To rollback this governance:

1. Revert the PR that introduced ADR-001 and this policy
2. Archive `deliveries/` and `templates/delivery/` to `docs/_archive/`
3. Restore lane ownership documents from archive
4. Guardrails remain active—no operational dependency broken

---

## Summary Workflow Checklist

Use this for every ID:

- [ ] Create Delivery Record from template
- [ ] Add ID to Delivery Index
- [ ] Set first **Next** action
- [ ] Ship Unit → update verified date
- [ ] Ship View → update verified date
- [ ] Ship Playbook → update verified date
- [ ] Verify Ops → update verified date
- [ ] Open PR with PR Covenant template
- [ ] Verify all guardrails
- [ ] Merge or park with **Next** set
- [ ] Update Delivery Index with final state

---

## Getting Started

1. Review [Guardrails Policy](guardrails.md) for enforcement rules
2. Copy `templates/delivery/DELIVERY_RECORD.md` for your first ID
3. Follow the workflow above
4. Update `deliveries/INDEX.md` as you progress

**Questions?** Tag `@louis-pvs` or create an issue with label `governance-question`.
