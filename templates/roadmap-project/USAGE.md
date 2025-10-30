# Roadmap Project Template - Usage

## Setup Instructions

### Option 1: Using the Setup Script

```bash
# Dry run to preview changes
node scripts/ops/setup-project.mjs \
  --config templates/roadmap-project/roadmap-project-template.json \
  --dry-run

# Apply configuration
node scripts/ops/setup-project.mjs \
  --config templates/roadmap-project/roadmap-project-template.json \
  --yes
```

### Option 2: Manual GitHub CLI

```bash
# Create project
gh project create \
  --owner louis-pvs \
  --title "Sprint Roadmap" \
  --format json < templates/roadmap-project/roadmap-project-template.json

# Link to repository
gh project link <PROJECT_ID> --repo louis-pvs/plaincraft
```

### Option 3: GitHub Web UI

1. Go to Projects tab
2. Click "New Project"
3. Select "Import from JSON"
4. Upload `roadmap-project-template.json`
5. Configure automation rules

## Project Structure

### Columns

- **Backlog** - Planned work not yet started
- **In Progress** - Active development
- **Review** - PRs awaiting approval
- **Done** - Completed work

### Custom Fields

- **Priority** - High, Medium, Low
- **Lane** - A, B, C, D (complexity lanes)
- **Effort** - T-shirt sizing (XS, S, M, L, XL)
- **Sprint** - Sprint number or milestone

### Views

- **Board View** - Kanban-style columns
- **Sprint View** - Filtered by current sprint
- **Priority View** - Sorted by priority
- **Timeline** - Gantt-style roadmap

## Automation Rules

The template includes automation for:

- Auto-move to "In Progress" when PR created
- Auto-move to "Review" when PR ready for review
- Auto-move to "Done" when PR merged
- Auto-archive cards older than 30 days in Done

## Customization

Edit `roadmap-project-template.json` to:

- Add/remove columns
- Modify custom field options
- Adjust automation rules
- Change view configurations

## Validation

```bash
# Validate JSON structure
jq empty templates/roadmap-project/roadmap-project-template.json

# Check against schema
node scripts/checks/validate-template.mjs templates/roadmap-project
```

## Related Workflows

1. Create idea: `cp templates/ideas/idea-unit-template.md ideas/U-feature.md`
2. Create issue: `gh issue create --body-file ideas/U-feature.md`
3. Add to project: Auto-linked via automation
4. Track progress: View on project board
5. Complete: Auto-moves to Done on merge

## Troubleshooting

**Project not created:**

- Ensure GitHub token has `project` scope
- Check organization/user permissions

**Automation not working:**

- Verify webhook configuration
- Check automation rules are enabled

**Fields not appearing:**

- Refresh project page
- Check field definitions in JSON

## See Also

- `/playbook/patterns/roadmap-project-onboarding.html` - Playbook narrative
- `/storybook/?path=/docs/governance-roadmap-onboarding--docs` - Storybook view
- `/templates/issue-unit/` - Issue templates
- `/templates/pull-request/` - PR templates
