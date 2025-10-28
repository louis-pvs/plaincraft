# User Story Template - Usage Guide

Complete guide for creating and managing development-ready user stories.

## Setup

### Option 1: Manual Copy (Quick)

```bash
# Copy template to ideas directory
cp templates/user-story/user-story-template.md ideas/U-my-feature.md

# Edit the file
code ideas/U-my-feature.md
```

### Option 2: Using Script (Recommended)

```bash
# Run story creation script
pnpm new:story

# Follow interactive prompts:
# 1. Enter story slug (e.g., "profile-form-composed")
# 2. Choose persona type (U-user or C-creator)
# 3. Provide source idea file path
# 4. Provide roadmap card URL
```

### Option 3: From Existing Idea

If you already have an idea file:

```bash
# The script can detect and link existing ideas
pnpm new:story --from-idea ideas/my-idea.md

# Or manually copy and update references
cp ideas/my-idea.md ideas/U-my-idea.md
# Then add user story sections
```

## Story Structure

### 1. Title Format

```markdown
**Title:** [U-profile-form-composed] / [C-creator-dashboard] <Outcome statement>
```

- **U-** prefix: User-facing features
- **C-** prefix: Creator-facing features
- **slug**: Kebab-case identifier matching source idea
- **Outcome statement**: Brief description of what gets built

### 2. Persona & Need

Standard user story format:

```markdown
**Persona & Need**

- As a [persona type]
- I want [capability or feature]
- So that [business value or outcome]
```

Examples:

- As a **content creator**, I want **a multi-step onboarding flow**, so that **I can publish my first snippet quickly**
- As a **platform user**, I want **to follow my favorite creators**, so that **I see their latest snippets first**

### 3. Context Section

Link story to broader product context:

```markdown
**Context**

- Source idea: `ideas/profile-form-composed.md`
- Roadmap card: Plaincraft Roadmap → Lane B → [View card](https://github.com/users/yourname/projects/1?pane=issue&itemId=123)
- Related docs / mocks: [Figma](https://figma.com/file/...), [API spec](docs/api-profile.md)
```

Required links:

- **Source idea**: Must exist in `/ideas/` directory
- **Roadmap card**: GitHub Projects V2 card URL
- **Related docs**: Optional but recommended (mocks, specs, architecture docs)

### 4. Scope & Acceptance Criteria

Define what "done" looks like:

```markdown
**Scope**

- [ ] User can access profile form from navbar
- [ ] Form validates email format before submit
- [ ] Form saves data to `/api/profile` endpoint
- [ ] Success toast appears after save
- [ ] Form resets on successful submission
```

Best practices:

- Write 3-10 concrete, testable criteria
- Use checkboxes for tracking progress
- Include both happy path and error states
- Mention specific UI components or API endpoints

### 5. Technical Notes

Implementation guidance for engineers:

```markdown
**Technical Notes**

- Uses `<InlineEditLabel>` component from snippets library
- API endpoint: `POST /api/v1/user/profile`
- Validation: Zod schema from `lib/validators/profile.ts`
- State management: React Hook Form + Zustand
- Dependencies: None (can start immediately)
```

Include:

- Reusable components or patterns
- API contracts and endpoints
- External dependencies or libraries
- State management approach
- Testing requirements

### 6. Risks & Dependencies

Document blockers and edge cases:

```markdown
**Risks & Dependencies**

- **Dependency**: Auth system must support email verification first
- **Risk**: Mobile keyboard may obscure form submit button
- **Technical debt**: Profile schema duplicated in API and client
- **Edge case**: Handle users with no email (social login only)
```

Types to document:

- **Dependency**: Prerequisites that must complete first
- **Risk**: Potential implementation challenges
- **Technical debt**: Known shortcuts or temporary solutions
- **Edge case**: Uncommon scenarios requiring special handling

## Story Lifecycle

### 1. Draft Phase

Initial story creation:

```bash
# Create story from template
pnpm new:story

# Link to source idea
# Add roadmap card reference
# Write initial acceptance criteria
```

Story lives in `/ideas/U-feature-name.md` alongside source idea.

### 2. Refinement

Collaborative editing before development:

- Product reviews persona & scope alignment
- Engineering adds technical notes and effort estimate
- Design attaches mocks or prototypes
- Team identifies risks and dependencies

### 3. Ready for Development

Story moves to "Backlog" column in roadmap project when:

- All required sections complete
- Acceptance criteria validated by product
- Technical notes reviewed by engineering
- No blocking dependencies

### 4. In Progress

During active development:

- Check off acceptance criteria as completed
- Add comments for implementation decisions
- Link to PR when code is ready for review

### 5. Deployment

After story is deployed:

- Archive story to `/ideas/_archive/2025/`
- Update roadmap card to "Done"
- Link to deployed feature or demo

## Validation

### Pre-commit Checks

Stories are validated automatically when staged:

```bash
git add ideas/U-my-story.md
git commit -m "Add user story for feature X"

# Runs validation:
# - Title format correct
# - All required sections present
# - Source idea file exists
# - Roadmap card URL valid
```

### Manual Validation

Check story compliance manually:

```bash
# Validate all stories
pnpm docs:check

# Validate specific story
node scripts/checks/validate-story.mjs ideas/U-my-story.md
```

### CI Validation

GitHub Actions validates stories on PR:

- Story format matches template
- Links resolve correctly
- No missing required sections
- Story count doesn't exceed limits

## Tips & Best Practices

### Writing Good Acceptance Criteria

❌ Bad:

```markdown
- [ ] Profile form works correctly
- [ ] Data is saved properly
- [ ] UI looks good
```

✅ Good:

```markdown
- [ ] Form displays 5 input fields: name, email, bio, avatar, timezone
- [ ] Email field shows error "Invalid email" if format wrong
- [ ] Submit button disabled until all required fields filled
- [ ] Success toast "Profile updated" appears after save
- [ ] Avatar preview updates immediately when file selected
```

### Linking to Roadmap

Always use full GitHub Projects URLs:

```markdown
✅ https://github.com/users/yourname/projects/1?pane=issue&itemId=12345
❌ "See roadmap"
❌ "Lane B card 3"
```

### Managing Dependencies

Use story checklists to track blockers:

```markdown
**Dependencies**

- [ ] Auth system supports OAuth (@alice, PR #123)
- [ ] API endpoint `/api/profile` deployed (@bob, done)
- [ ] Design system updated with form components (@carol, in progress)
```

### Reusing Story Patterns

Common story patterns to reuse:

- CRUD operations: Create, Read, Update, Delete
- Form submissions with validation
- List views with filtering and pagination
- Authentication flows
- File upload workflows

Copy similar stories as starting point:

```bash
# Find similar stories
grep -r "form validation" ideas/U-*.md

# Copy and adapt
cp ideas/U-login-form.md ideas/U-signup-form.md
```

## Troubleshooting

### Story Validation Fails

**Error**: "Source idea file not found"

```bash
# Check if idea file exists
ls ideas/my-idea.md

# If missing, create or fix link in story
```

**Error**: "Invalid roadmap card URL"

```bash
# Get card URL from GitHub Projects:
# 1. Open project board
# 2. Click on card
# 3. Copy URL from browser
# 4. Paste full URL in story context section
```

### Story Too Large

If story has >10 acceptance criteria, split into multiple stories:

```bash
# Original: U-user-profile
# Split into:
cp ideas/U-user-profile.md ideas/U-profile-form.md
cp ideas/U-user-profile.md ideas/U-profile-avatar.md
cp ideas/U-user-profile.md ideas/U-profile-settings.md
```

Update roadmap to reflect multiple cards.

### Missing Technical Context

If technical notes section is empty:

1. Review similar implemented features
2. Check codebase for existing patterns
3. Ask engineering team lead for guidance
4. Document questions in "Risks & Dependencies" section

## Related Workflows

- **Idea to Story**: `/guides/guide-workflow.md` - Converting ideas to actionable stories
- **Story to PR**: `/guides/guide-workflow.md` - Linking stories to pull requests
- **Roadmap Management**: `/guides/guide-roadmap-setup.md` - Managing roadmap board

## Support

For questions or issues:

- Check `/guides/USER-STORY-GUIDE.md` if it exists
- Review existing stories in `/ideas/` for examples
- Ask in #product-development channel
