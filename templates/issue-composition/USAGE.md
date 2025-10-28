# Usage: Issue (Composition) Template

## Basic Usage

1. **Copy the template:**

   ```bash
   cp templates/issue-composition/issue-composition.md my-feature.md
   ```

2. **Fill in the sections:**
   - Replace `[Feature Title]` with clear description
   - Complete **Overview** with high-level goals
   - Break down into **Sub-Tasks** with individual acceptance criteria
   - Specify **Dependencies** and **Coordination** needs

3. **Create the issue:**
   ```bash
   gh issue create --title "Your Title" --body-file my-feature.md
   ```

## Template Variables

Replace these placeholders:

- `[Feature Title]` - High-level feature description
- `[Components]` - List of affected components/areas
- `[Sub-Task N]` - Individual tasks with clear deliverables
- `[Dependencies]` - External blockers or ordering constraints
- `[Coordination Notes]` - Team sync requirements

## Examples

### Multi-Component Feature

```markdown
**Title:** Implement dark mode across application

**Overview:**
Add dark mode support to all UI components with theme persistence.

**Components Affected:**

- Theme provider (`src/context/ThemeContext.tsx`)
- All styled components (`src/components/*`)
- Settings panel (`src/pages/Settings.tsx`)

**Sub-Tasks:**

- [ ] Create theme context and provider (#123)
- [ ] Update button components with theme variants (#124)
- [ ] Update form components with theme variants (#125)
- [ ] Add theme toggle to settings (#126)
- [ ] Persist theme preference to localStorage (#127)

**Dependencies:**

- Must complete theme provider before component updates
- Settings UI depends on all component updates

**Coordination:**

- Design team: Review color palette (Week 1)
- Frontend team: Parallel component work (Week 2-3)
```

### Refactoring Project

```markdown
**Title:** Migrate API client to TypeScript

**Overview:**
Convert API client and all endpoint handlers from JavaScript to TypeScript for type safety.

**Components Affected:**

- API client core (`src/api/client.js`)
- Auth endpoints (`src/api/auth/*.js`)
- User endpoints (`src/api/users/*.js`)
- Project endpoints (`src/api/projects/*.js`)

**Sub-Tasks:**

- [ ] Define API response types (#201)
- [ ] Convert client core to TS (#202)
- [ ] Migrate auth endpoints (#203)
- [ ] Migrate user endpoints (#204)
- [ ] Migrate project endpoints (#205)
- [ ] Update tests with types (#206)

**Dependencies:**

- Response types must be defined first
- Client core blocks all endpoint migrations

**Coordination:**

- Backend team: Sync on API contract (ongoing)
- QA: Regression testing after each endpoint migration
```

## Integration with Scripts

```bash
# Create parent issue and sub-issues atomically
node scripts/create-worktree-pr.mjs \
  --template issue-composition \
  --title "Implement dark mode" \
  --create-subissues

# Merge completed sub-issue back to parent
node scripts/merge-subissue-to-parent.mjs \
  --parent-issue 100 \
  --subissue 123

# Sync checklist status to project board
node scripts/sync-issue-to-card.mjs --issue 100
```

## Sub-Task Checklist Sync

The checklist in composition issues automatically syncs with sub-issue status via `scripts/merge-subissue-to-parent.mjs`. When a sub-issue PR merges, its checkbox is automatically checked in the parent issue.
