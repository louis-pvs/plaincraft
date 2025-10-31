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

### [Ideas Source of Truth](/patterns/ideas-source-of-truth)

Makes `/ideas` the authoritative contract between backlog automation, roadmap views, and Playbook storytelling.

**Key Features:**

- Aligns Purpose/Problem/Proposal/Acceptance metadata across automation
- Preserves parent/child hierarchy for sub-issue pipelines
- Keeps roadmap, changelog, and PR narratives in sync
- Anchors governance metrics for lane health

---

### [Script Automation Guardrails](/patterns/script-automation-guardrails)

Ensures every ops script ships with the template contract so guardrails stay predictable for dry-runs and CI.

**Key Features:**

- Standard CLI header and exit-code semantics
- Preview-first execution with `--yes` gates for writes
- Shared `_lib/` helpers for composability
- Guardrail test suite coverage (policy, smoke, size)

---

### [Scripts-First Lifecycle Overview](/patterns/scripts-first-lifecycle-overview)

Tracks every lifecycle transition through the sanctioned scripts so ideas, branches, PRs, and releases stay in sync.

**Key Features:**

- Maps intake → branch → PR → closeout to existing automation
- Requires dry-run transcripts for audit-ready status notes
- Enforces idea frontmatter as the narrative source of truth
- Links to Storybook governance docs for each command

---

### [Scripts-First Lifecycle Rollout](/patterns/scripts-first-lifecycle-rollout)

Keeps idea metadata, branches, and draft PRs aligned the moment work begins so lifecycle reporting never drifts.

**Key Features:**

- `pnpm gh:worktree` stamps `Issue`/`Status` directly on the idea file
- Bootstrap commit + draft PR give stakeholders an immediate artifact
- Dry-run logs capture the contract diff before anything is written
- Links back to the script template so new lifecycle commands stay consistent

---

### [Scripts-First Lifecycle Rollback](/patterns/scripts-first-lifecycle-rollback)

Walks the lifecycle backward with the same commands used to advance it so rollback events leave a complete audit trail.

**Key Features:**

- Uses `remove-worktree.mjs` to unwind bootstrap artifacts safely
- Replays branch + PR scripts in dry-run mode to confirm state
- Requires updated transcripts in Playbook status updates
- Calls out changelog follow-ups when releases already shipped

---

### [Roadmap Project Onboarding](/patterns/roadmap-project-onboarding)

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
