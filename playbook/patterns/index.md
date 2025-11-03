# Component Patterns

This section contains detailed documentation for each Plaincraft component pattern. Each pattern includes API documentation, architecture overview, usage examples, and adoption guides.

## Available Patterns

### [Inline Edit Label](/patterns/inline-edit-label)

A pragmatic inline-edit component with optimistic save, keyboard navigation, and headless architecture. Perfect for quick label editing without full form submission.

**Key Features:**

- Optimistic UI with error handling
- Headless architecture (reusable controller hook)
- Keyboard navigation (Enter to save, Escape to cancel)
- Accessibility-first (ARIA, focus management)
- No external dependencies

---

## Deprecated Patterns

The following patterns are no longer actively maintained and will be archived by 2025-12-31:

- **Release Changelog Automation** - Deprecated lifecycle automation workflow
- **Ideas Source of Truth** - Superseded by current backlog management
- **Script Automation Guardrails** - Consolidated into unified guardrails system
- **Scripts-First Lifecycle Overview** - Deprecated lifecycle automation workflow
- **Scripts-First Lifecycle Rollout** - Deprecated lifecycle automation workflow
- **Scripts-First Lifecycle Rollback** - Deprecated lifecycle automation workflow
- **Roadmap Project Onboarding** - Deprecated lifecycle automation workflow

For current automation patterns, refer to the `/scripts` directory documentation.

---

## Future Patterns

Additional component patterns will be documented here as they are developed

Codifies the GitHub Projects setup so roadmap automation, lane views, and stakeholders stay aligned.

**Key Features:**

- Reproducible project scaffolding with scripts
- WIP limits and lane filters baked into the template
- Immediate pipeline-config sync guidance
- Authentication cues for GitHub CLI usage

---

## Pattern Categories

### Unit Components

Self-contained, single-purpose components that solve specific UI problems:

- **Inline Edit Label** — Quick inline text editing
- _(More patterns coming soon)_

### Operational Patterns

Plays that wrap automation or workflow scripts around template-first docs:

- **Scripts-First Lifecycle Overview** — Coordinates intake through closeout using the sanctioned commands.
- **Release Changelog Automation** — Script + template handshake to publish post-merge highlights.
- **Ideas Source of Truth** — Keeps `/ideas` authoritative for automation and storytelling.
- **Script Automation Guardrails** — Standardizes ops scripts around the shared CLI contract.
- **Scripts-First Lifecycle Rollout** — Bootstraps branches and draft PRs directly from the idea file.
- **Scripts-First Lifecycle Rollback** — Rewinds branches and PRs while preserving audit transcripts.
- **Roadmap Project Onboarding** — Rebuilds the Plaincraft roadmap with reproducible automation.

### Compositions

Multi-component flows that combine unit components into larger patterns:

- _(Patterns coming soon)_

---

## Using Patterns

Each pattern page provides:

1. **README content** — Imported directly from the component source
2. **API documentation** — Props, types, and interfaces
3. **Usage examples** — Copy-paste code snippets
4. **Architecture notes** — Controller hook and view layer details
5. **Adoption guide** — Step-by-step integration instructions
6. **Storybook link** — Interactive demos and interaction tests

## Contributing

To add a new pattern:

1. Create the component following the [architecture guide](/architecture)
2. Add comprehensive README.md and ADOPTION.md
3. Create Storybook stories with interaction tests
4. Add pattern page to this playbook
5. Submit PR with all documentation

See the [repository](https://github.com/louis-pvs/plaincraft) for contribution guidelines.
