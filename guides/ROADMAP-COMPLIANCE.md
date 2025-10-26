# Roadmap Project Compliance Checklist

This companion document ensures the Plaincraft Roadmap stays aligned with CI
expectations, Issue templates, and automation. Run through it whenever you
modify project settings or clone the roadmap for another org.

## Required Artifacts

- GitHub Project board named **Plaincraft Roadmap** (`project_id` matches the
  value in `.github/pipeline-config.json`).
- Views `Lane A`, `Lane B`, `Lane C`, `Lane D` with:
  - Filter: `label:lane:<letter>`
  - Column limit: 3
- Custom fields defined:
  - `ID` (text)
  - `Lane` (single select: A/B/C/D)
  - `Acceptance` (text, Markdown allowed)
  - `Units` (text, optional – required for compositions)
  - `Metric` (text, optional – required for compositions)
- Default Issue templates stored in `.github/ISSUE_TEMPLATE/`.
- `.github/pipeline-config.json` kept in sync (project ID, fields, ticket
  mappings).
- Template reference JSON: `templates/roadmap-project-template.json`.

## Verification Steps

1. **Lane labels present.**  
   Run `gh label list` and confirm `lane:A`, `lane:B`, `lane:C`, `lane:D`,
   `lane:unit`, `lane:composition`, `lane:bug` exist.

2. **Issue templates linked.**  
   Use GitHub UI “New Issue” → confirm **Unit**, **Composition**, **Bug** forms
   appear with required fields (ticket ID, lane selector, acceptance checklist).

3. **Project field sync.**  
   File a test Issue with `lane:unit` and add it to the Roadmap. The board should
   auto-populate `ID`, `Lane`, and `Acceptance`.

4. **WIP enforcement.**  
   Drag four cards into a lane view; GitHub should show the column-limit warning
   at 4.

5. **PR enforcement.**  
   Open a PR with commits missing ticket prefixes or without `Closes #`. Run
   `pnpm pr:check -- <pr-number>`; it should fail with actionable errors.

6. **CI status integration.**  
   Push a branch; use `pnpm ci:check` to confirm the CLI can query workflow
   status.

7. **Documentation references.**  
   Ensure `guides/ROADMAP-GUIDE.md`, `CHANGELOG.md`, and `protocol.md` reference
   the latest project practices. Update if the project ID or fields change.

## Automation Contracts

- **Scripts consuming roadmap data** must rely on `.github/pipeline-config.json`.
  Update that file before shipping changes to views, fields, or labels.
- **CI gate `pr:check`** validates:
  - `Closes #<issue>` reference in the PR description.
  - Ticket ID prefix in commit messages (`[U-…]`, `[C-…]`, `[B-…]`, `[ARCH-…]`,
    `[PB-…]`).
  - Lane label applied to the PR.
  - Acceptance checklist copied into the PR body.
- **Issue creation automation** should use the templates and assign project + lane
  labels immediately (bots can ingest `templates/roadmap-project-template.json`).

## Maintenance Checklist

- [ ] Project views and limits audited monthly.
- [ ] `.github/pipeline-config.json` reviewed alongside template changes.
- [ ] `templates/roadmap-project-template.json` refreshed after major project
      edits.
- [ ] Guides (`ROADMAP-GUIDE`, `ROADMAP-COMPLIANCE`) updated when process /
      automation shifts.
- [ ] Sample Issues/PRs used quarterly to validate automation end-to-end.

By following this compliance checklist, every rebuild of the Roadmap will stay
aligned with the CI pipeline and enforcement scripts already living in the repo.
