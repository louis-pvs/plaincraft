# User Story Guide

Use this handbook when translating an initiative or idea into a backlog-ready
user story. Align every story with the Plaincraft ticketing system so it flows
cleanly into Issues, commits, and PRs.

## When to Write a User Story

Create a user story when:

- An idea in `/ideas` has stakeholder sign-off.
- A single Unit (`U-…`) or Composition (`C-…`) is ready to enter development.
- You need to sync acceptance criteria across Issues, PRs, and changelog entries.

## Story Structure

| Section             | Description                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| Title               | Begin with the ticket ID (`[U-…]` / `[C-…]` / `[PB-…]`) followed by a concise outcome. |
| Persona & Need      | “As a … I want … so that …” framing tied to the idea’s Problem/Hunch.                  |
| Context             | Link to the idea file, roadmap item, and any earlier research.                         |
| Scope               | List what is in/out for this iteration; link to Units/Compositions as needed.          |
| Acceptance Criteria | Markdown checklist copied to the Issue and PR template.                                |
| Metrics             | Expected signal change and measurement plan (if applicable).                           |
| Rollout Plan        | Notes on feature flags, integration window, communication.                             |
| Dependencies        | Other tickets, analytics hooks, docs, or ops tasks.                                    |

## Template

Copy this block into your story (e.g. Notion, Issue body, RFC):

```markdown
**Title:** [U-<slug>] Short outcome statement

**Persona & Need**

- As a …
- I want …
- So that …

**Context**

- Source idea: `ideas/<slug>.md`
- Roadmap item: Plaincraft Roadmap → Lane <A/B/C/D> → <card link>

**Scope**

- In scope:
  - …
- Out of scope:
  - …

**Acceptance Criteria**

- [ ] …
- [ ] …
- [ ] …

**Metrics**

- Hypothesis: …
- Measurement: …

**Rollout Plan**

- Flag / release steps: …
- Comms / docs owner: …

**Dependencies**

- …
```

## Ticket & PR Alignment

- The story title and ticket title should match (including the `[U-…]`/`[C-…]`
  tag).
- Acceptance criteria must be identical in the user story, GitHub Issue
  template, and PR checklist.
- Reference the story in the Issue body (`Source: guides/USER-STORY-GUIDE.md`
  or per-story doc) so context stays discoverable.
- Commits and changelog entries should reuse the same ticket ID.

## Best Practices

- Keep scope to one Unit or Composition. Split stories if you need separate
  deployments.
- Avoid UX mocks inside the story; link to Figma or docs instead.
- Note any analytics events or data contracts under Dependencies.
- When scope changes mid-sprint, update the story and propagate the new
  acceptance criteria to the Issue and PR.

## Checklist Before Story Handoff

- [ ] Story references the idea and roadmap card.
- [ ] Acceptance criteria reviewed with QA/Design/Docs.
- [ ] Metrics defined (or marked “N/A” with rationale).
- [ ] Rollout plan covers flags, monitoring, and comms.
- [ ] Ticket and PR templates updated with the same checklist.
