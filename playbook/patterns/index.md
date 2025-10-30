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

### [Release Changelog Automation](/patterns/release-changelog-automation)

Keeps `_tmp/` release summaries flowing into `CHANGELOG.md` while Playbook stories stay focused on business outcomes.

**Key Features:**

- Guardrailed consolidation script with dry-run mode
- Template-enforced narrative structure for release notes
- Automatic cleanup of processed `_tmp/` entries
- Links directly to Playbook status updates for stakeholders

---

## Pattern Categories

### Unit Components

Self-contained, single-purpose components that solve specific UI problems:

- **Inline Edit Label** — Quick inline text editing
- _(More patterns coming soon)_

### Operational Patterns

Plays that wrap automation or workflow scripts around template-first docs:

- **Release Changelog Automation** — Script + template handshake to publish post-merge highlights.

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
