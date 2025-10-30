---
id: guide-roadmap-setup
owner: @louis-pvs
lane: D
artifact_id: ARCH-roadmap-project-setup
scaffold_ref: /templates/guide@v0.1
version: 0.1.0
created: 2025-10-28
ttl_days: 90
last_verified: 2025-10-28
---

# When to use

- Bootstrapping a new Plaincraft Roadmap GitHub Project
- Recreating the roadmap for another org
- Setting up CI dependencies for project automation

# When not to use

- Modifying existing project settings (do manually via GitHub UI)
- Creating non-roadmap projects
- Initial repo setup without project board needs

# Steps (all executable)

1. **Authenticate GitHub CLI with project scope:**

   ```bash
   gh auth login
   gh auth refresh -s project
   ```

2. **Create repository labels:**

   ```bash
   pnpm gh:setup-labels
   ```

3. **Create project with fields:**

   ```bash
   pnpm gh:setup-project
   ```

4. **Manual configuration (follow output):**
   - Create views: Lane A, B, C, D
   - Set WIP limits: 3 per lane
   - Configure automation rules
   - Link Issue templates

5. **Verify setup:**

   ```bash
   # Test label existence
   gh label list | grep lane

   # Test CI check
   pnpm ci:check
   ```

# Rollback

- Delete project via GitHub UI: Settings → Delete project
- Remove labels: `gh label delete lane:A` (repeat for each)

# Requirements

**Project shell**

- Name project **Plaincraft Roadmap**
- Configure views Lane A/B/C/D with filter `label:lane:<letter>` and WIP limit 3

**Field definitions**

- ID — text
- Lane — single select
- Acceptance — text
- Units — text
- Metric — text

**Repo sync points**

- Labels lane:A/B/C/D
- Labels lane:unit / lane:composition / lane:bug
- `.github/pipeline-config.json` synced with project ID
- Issue templates stored in `.github/ISSUE_TEMPLATE/`

# Links

- Template: `/templates/roadmap-project-template.json`
- Setup script: `/scripts/ops/setup-project.mjs`
- Labels script: `/scripts/setup-labels.mjs`
- Compliance checklist: `/guides/ROADMAP-COMPLIANCE.md` (archived)
- Pipeline config: `/.github/pipeline-config.json`
