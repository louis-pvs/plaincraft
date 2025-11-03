# Guardrails Policy

**Version:** `1.0.0`  
**Effective:** `2025-11-02`  
**Owner:** `@louis-pvs`

---

## Purpose

This policy consolidates all preserved guardrails from the single-operator delivery flow. These are **hard requirements** enforced by automation.

---

## 1. Commit Format

**Rule:** All commits must follow this pattern:

```
[ID] type(scope): subject
```

**Pattern:** `^\[([A-Z]+-\d+)\]\s+(feat|fix|perf|refactor|chore|docs|test|build|ci)(\([a-z0-9-]+\))?:\s.{1,72}$`

**Types:**

- `feat`: new feature or component
- `fix`: bug fix
- `perf`: performance improvement
- `refactor`: code restructure without behavior change
- `chore`: maintenance, deps, config
- `docs`: documentation only
- `test`: test changes only
- `build`: build system changes
- `ci`: CI/CD changes

**Examples:**

- ✅ `[U-042] feat(profile): add loading state`
- ✅ `[ARCH-001] docs: update delivery flow ADR`
- ❌ `Add loading state` (missing ID and type)
- ❌ `[U-042] Add loading state` (missing type)

**Enforcement:** CI blocks PRs with non-compliant commit headers.

---

## 2. Branch Format

**Rule:** All branches must follow: `type/ID-slug`

**Examples:**

- ✅ `feat/U-042-profile-loading`
- ✅ `fix/C-015-validation-bug`
- ✅ `docs/ARCH-001-delivery-flow`
- ❌ `feature/add-loading` (missing ID)
- ❌ `U-042-loading` (missing type)

**Enforcement:** CI warns if branch format doesn't match. Blocks merge if mismatch with PR title ID.

---

## 3. PR Title Format

**Rule:** PR title must start with `[ID]` and match the branch ID.

**Examples:**

- ✅ `[U-042] Add loading state to profile form`
- ✅ `[ARCH-001] Implement single-operator delivery flow`
- ❌ `Add loading state` (missing ID)
- ❌ `[U-042] [WIP] Add loading state` (ID not at start)

**Enforcement:** CI blocks PRs where title ID doesn't match branch ID.

---

## 4. CI Runtime Budget

**Rule:** CI p95 time must not exceed baseline by more than **+90 seconds**.

**What's measured:**

- p95 (95th percentile) runtime across all CI jobs
- Compared against the baseline from `main` branch

**Examples:**

- Baseline p95: 180s
- ✅ New p95: 265s (+85s, within budget)
- ❌ New p95: 275s (+95s, exceeds budget)

**Enforcement:** CI fails if p95 delta > +90s. Must optimize or get explicit approval.

**Exceptions:** File an issue with `ci-budget-exception` label. Expires in 14 days.

---

## 5. GIF Media Limits

**Rule:** All GIFs in Playbook pages must meet these limits:

| Property  | Limit    |
| --------- | -------- |
| Duration  | ≤ 10s    |
| Width     | ≤ 960px  |
| File Size | ≤ 2 MB   |
| Alt Text  | Required |
| Caption   | Required |

**Enforcement:** CI scans markdown files for GIF references and validates:

- Duration via `ffprobe` or metadata
- Dimensions via image headers
- File size via `stat`
- Alt text presence in markdown
- Caption immediately following image

**Failure:** PR blocked if any GIF violates limits.

---

## 6. One-to-One PR/Branch Rule

**Rule:** Only one open branch and PR per ID at a time.

**Enforcement:** CI checks for duplicate PRs with the same ID prefix.

**Exception:** Allowed if older PR is marked with `parked` label.

---

## 7. Cross-Link Freshness

**Rule:** All four deliverables (Unit, View, Playbook, Ops) must show the same verified date and template version as the Delivery Record.

**What's checked:**

- Each deliverable has a `Verified at` field
- Each deliverable has a `Template Version` field
- Values match the Delivery Record exactly

**Enforcement:** CI **warns** if dates or versions are stale (>7 days). Does not block merge.

**Exception:** Stale warnings are tracked; operator must address before marking ID as "done."

---

## 8. Drift Detection

**Rule:** Missing links between Delivery Record and deliverables trigger warnings.

**What's checked:**

- Delivery Record links to all four deliverables
- Each deliverable links back to Delivery Record
- Links resolve to existing files

**Enforcement:** CI **warns** on missing or broken links. Does not block merge.

---

## 9. Accessibility (a11y)

**Rule:** No **critical** or **serious** accessibility violations in new code.

**What's checked:**

- Automated a11y tests in Storybook via `@storybook/test-runner` with axe
- Critical = WCAG A/AA violations
- Serious = High-impact usability issues

**Enforcement:** CI blocks if critical or serious violations are introduced.

**Notes:** Minor and moderate violations are reported but don't block.

---

## Exception Process

1. **Who:** Any contributor can request an exception
2. **How:** Create an issue with label `guardrail-exception` and tag owner
3. **Approval:** Owner reviews and approves with expiry date (≤14 days default)
4. **Tracking:** Exception logged in Delivery Record under "Notes"
5. **Expiry:** CI re-enables enforcement after expiry date

**Exception Labels:**

- `commit-format-exception`
- `ci-budget-exception`
- `media-limit-exception`
- `a11y-exception`

---

## Reporting

Dashboard tracks (informational, not blocking):

- Commit compliance rate per operator
- CI p95 trend over time
- Exception usage and expiry compliance
- Stale Delivery Records (>7 days without update)

---

## Changes to This Policy

Changes require:

1. A new ADR or amendment to ADR-001
2. Update to this policy document with version bump
3. PR following the same guardrails
4. Announcement in team channel

---

## Summary Checklist

Use this checklist for every PR:

- [ ] Commit headers match: `[ID] type(scope): subject`
- [ ] Branch format: `type/ID-slug`
- [ ] PR title starts with `[ID]`
- [ ] CI p95 delta ≤ +90s
- [ ] GIFs (if any) meet limits: ≤10s, ≤960px, ≤2MB, alt+caption
- [ ] Only one open PR/branch per ID
- [ ] Cross-links present and current
- [ ] a11y: criticals = 0, serious = 0
