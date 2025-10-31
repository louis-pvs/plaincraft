---
id: guide-guardrails
owner: @lane-c
lane: C
artifact_id: ARCH-scripts-first-automation-suite
scaffold_ref: /templates/guide@v0.1
version: 0.1.0
created: 2025-11-03
ttl_days: 90
last_verified: 2025-11-03
---

# When to use

- Before opening or updating any PR across lanes A–D.
- After rebasing or pulling upstream changes that might affect automation.
- Prior to tagging releases or shipping documentation that references scripts or templates.

# When not to use

- Never: passing `pnpm guardrails` is a hard requirement on every change. Skip it only when debugging the guardrail suite itself, and in that case note the failure in the PR description and rerun before merge.

# Steps (all executable)

1. **Install dependencies (one-time per worktree):**

   ```bash
   pnpm install
   pnpm install-hooks   # ensures commit-msg guard and lint-staged run
   ```

2. **Run the full guardrail suite before every PR update:**

   ```bash
   pnpm guardrails
   ```

   - The suite covers app build/lint/test plus script, docs, PR, issue, and recording checks.
   - Lane-specific focus:
     - **Lane A (Foundations & Tooling):** investigate React/Vitest failures and component regressions surfaced in the app scope.
     - **Lane B (Narrative & Enablement):** resolve Storybook governance diffs and Playbook snapshot drifts.
     - **Lane C (DevOps & Automation):** keep `scripts:*` scopes green; repair policy or size violations immediately.
     - **Lane D (Program Operations):** clear docs lint/dedupe violations and ensure Playbook link guard stays clean for roadmap reporting.

3. **Triage failures with scoped runs when needed:**

   ```bash
   pnpm guardrails --scope scripts
   pnpm guardrails --scope docs
   pnpm guardrails --scope pr
   pnpm guardrails --scope issues
   ```

   Use these to get fast feedback while iterating; always finish with the full suite in Step 2.

4. **Record the run in your status notes or PR description:**

   ```bash
   pnpm guardrails --output json > guardrails-report.json
   ```

   Attach the summary for reviewers, especially when coordinating cross-lane work.

5. **Lock in the requirement for future work:**
   - Add a checklist item to your idea or issue acceptance criteria: “`pnpm guardrails` passes on the feature branch.”
   - Block merges in GitHub until the suite reports `ok: true`.

# Rollback

- If a guardrail fails mid-work, revert the offending change or skip the failing test only long enough to land a fix.
- To restore a passing baseline fast:

  ```bash
  git checkout -- scripts/  # revert automation changes if they broke the suite
  pnpm guardrails
  ```

- Never merge with `pnpm guardrails` failing; escalate to the owning lane if the fix spans multiple teams.

# Requirements

- Node.js >= 20.11 (enforced by `.nvmrc` and `package.json` engines).
- `pnpm` via corepack (`corepack enable pnpm`).
- Git hooks installed (`pnpm install-hooks`) so commit guardrails run locally.
- Access to GitHub token if guardrail scopes need authenticated requests (`GITHUB_TOKEN` environment variable).

# Links

- Template: `/templates/script/README.md`
- Guardrail CLI: `/scripts/checks/guardrails.mjs`
- Commit guard reference: `/storybook/?path=/docs/governance-commit-guard--docs`
- Lifecycle overview: `/storybook/?path=/docs/governance-lifecycle-overview--docs`
