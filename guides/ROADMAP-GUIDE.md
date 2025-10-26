# Plaincraft Roadmap & GitHub Project Setup

This playbook shows how to bootstrap a new Plaincraft Roadmap project (or
recreate the existing one) so CI, issue templates, and automation can rely on a
predictable structure.

## Automated Setup (Recommended)

Use the automated setup script to create and configure the project:

```bash
# 1. Ensure GitHub CLI is authenticated with project permissions
gh auth login
gh auth refresh -s project

# 2. Create labels (if not already done)
pnpm gh:setup-labels

# 3. Create project with fields
pnpm gh:setup-project

# 4. Follow the manual instructions displayed for:
#    - Creating views (Lane A, B, C, D)
#    - Setting WIP limits (3 per lane)
#    - Configuring automation rules
```

See `_tmp/project-automation.md` for full automation documentation.

---

## Manual Setup (Alternative)

If you prefer manual setup or need to recreate specific components:

## 1. Create the GitHub Project

1. Navigate to the Plaincraft organization → _Projects_ → _New project_.
2. Choose “Board” layout, name it **Plaincraft Roadmap**, and make it **Private**
   (only members of the product org should see in-flight work).
3. Enable “Use a template” → “Default board”, then immediately delete the
   sample columns/cards. We will re-create lanes manually.

## 2. Configure Views & Lanes

Create four board views—one per lane—all capped at WIP 3 and filtered by lane
label.

| View name | Filter query   | WIP limit |
| --------- | -------------- | --------- |
| Lane A    | `label:lane:A` | 3         |
| Lane B    | `label:lane:B` | 3         |
| Lane C    | `label:lane:C` | 3         |
| Lane D    | `label:lane:D` | 3         |

Steps per view:

1. Duplicate the base board.
2. Rename the view (e.g. _Lane A_).
3. Add a filter → _Labels_ → select the lane label.
4. Open _Customize_ → _Column limit_ → set to **3**.

Keep a fifth view (e.g. _All Lanes_) without filters for leadership summaries.

## 3. Define Fields

Add the following project fields (all single-select unless noted):

| Field      | Type          | Options / Notes                                |
| ---------- | ------------- | ---------------------------------------------- |
| ID         | Text          | Mirrors ticket ID (`U-…`, `C-…`, `B-…`, etc.). |
| Lane       | Single select | A, B, C, D.                                    |
| Acceptance | Text          | Markdown checklist synced from the Issue.      |
| Units      | Text          | (Composition tickets) list `U-…` dependencies. |
| Metric     | Text          | (Composition tickets) capture hypothesis.      |

Make `ID`, `Lane`, and `Acceptance` visible in every view; hide optional fields
to reduce noise outside their lane.

## 4. Automation Rules

Use built-in project automation (⚙️ → _Workflows_) and recreate the following:

1. **Issue added to project → set Lane**
   - Trigger: “Item added to project”.
   - Condition: Label includes `lane:A`/`B`/`C`/`D`.
   - Action: Set _Lane_ field to the matching letter.

2. **Issue added to project → require PR linkage**
   - Trigger: “Item added to project”.
   - Action: Add comment: “PR must include `Closes #<number>` and ticket ID
     prefix.”

3. **PR merged → archive** (optional tidy-up)
   - Trigger: `workflow` (Project automation cannot read merges directly yet; use a
     workflow that calls the Projects API—see `.github/pipeline-config.json`
     for field mappings).

Document any additional custom rules in `guides/ROADMAP-GUIDE.md` so tests and
automation stay aligned.

## 5. Issue Template Alignment

- Unit tickets (`U-…`) use `.github/ISSUE_TEMPLATE/unit-ticket.yml`.
- Composition tickets (`C-…`) use `.github/ISSUE_TEMPLATE/composition-ticket.yml`.
- Bugs (`B-…`) use `.github/ISSUE_TEMPLATE/bug-report.yml`.

Each template captures:

- Ticket ID (prefilled with the proper prefix).
- Lane selector (A/B/C/D).
- Acceptance checklist (markdown list).

Confirm new Issues inherit the correct labels (`lane:*`, `lane:unit`,
`lane:composition`, `lane:bug`) and that the custom fields sync into the project
board.

## 6. CI & Automation Integration

The repo-wide `.github/pipeline-config.json` file documents the project ID,
tickets, and PR expectations. Any automation (CI checks, scripts, bot workflows)
should parse that configuration instead of hard-coding project internals.

### Automated Workflows

The `.github/workflows/project.yml` workflow provides:

- **Auto-tagging**: New issues automatically get lane/type labels based on title prefix
- **Auto-add to project**: Issues automatically added to configured project board
- **Manual triggers**: Workflow dispatch for setup, issue creation, and sync

See `_tmp/project-automation.md` for detailed workflow documentation.

### Validation Hooks

| Check                          | Location                       | Purpose                                      |
| ------------------------------ | ------------------------------ | -------------------------------------------- |
| `pnpm pr:check`                | `scripts/pr-requirements.mjs`  | Ensures PR references Issue, has lane label. |
| `pnpm ci:check` (manual watch) | `scripts/check-ci.mjs`         | Monitors pipeline status.                    |
| Pre-commit changelog hook      | `scripts/pre-commit-changelog` | Keeps release notes aligned with tickets.    |

When adding new automation, update both `pipeline-config.json` and this guide.

## 7. Recreating the Project

If the project is lost or needs cloning:

1. Export the existing board (top right → _Export_ → _CSV_) for reference.
2. Follow steps 1–4 to rebuild the board and fields.
3. Re-import Issues via the GitHub Issues list (bulk add to project).
4. Verify automation by filing a fake ticket in `_tmp` repo or a scratch space.
5. Announce the new project ID in `pipeline-config.json` and Slack.

## 8. Checklist for New Projects

- [ ] Project created & named **Plaincraft Roadmap** (private).
- [ ] Views for lanes A–D with filters + WIP limit 3.
- [ ] Fields `ID`, `Lane`, `Acceptance`, `Units`, `Metric` configured.
- [ ] Issue templates confirmed to sync fields & labels.
- [ ] Automation rules applied (lane assignment, PR reminder).
- [ ] `.github/pipeline-config.json` updated with correct project ID.
- [ ] CI pipelines referencing the roadmap validated (`pnpm pr:check`).
- [ ] Documentation updated (this guide, `protocol.md` if needed).

With these steps, any new roadmap or project fork will stay aligned with our CI
guards and release processes.
