# Ideas Playbook

The `/ideas` folder captures product hypotheses before they mature into tickets.
This guide explains how to structure idea briefs so they sync cleanly with our
Plaincraft Roadmap project and CI expectations.

## Folder Structure

```
ideas/
  <initiative>.md            # High-level brief (problem / signal / hunch)
  U-<slug>.md                # Unit-level details
  C-<slug>.md                # Composition-level details
  ...
```

- **Initiative briefs** use the free-form template in
  `templates/ideas/idea-brief-template.md`.
- **Unit files** mirror the data we expect in a Unit Issue template
  (`templates/ideas/idea-unit-template.md`).
- **Composition files** mirror the Composition Issue template
  (`templates/ideas/idea-composition-template.md`).

Each idea document should live in the repo before creating the corresponding
Issues, so the acceptance checklist and contracts can be copied forward.

## Naming Conventions

- Top-level briefs use a descriptive slug like `creator-onboarding-bridge.md`.
- Unit files must be prefixed with their ticket ID, e.g. `U-bridge-intro-card.md`.
- Composition files must be prefixed with their ticket ID, e.g.
  `C-creator-onboarding-bridge.md`.
- Slugs should match the final GitHub Issue titles and commit tags.

## Required Sections

| File type   | Required sections                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Brief       | Problem, Signal, Hunch, Notes, Tickets (links to Unit/Composition IDs)                             |
| Unit        | Lane, Linked Composition, Contracts, Props + Shape, Behaviors, Accessibility, Acceptance Checklist |
| Composition | Lane, Metric Hypothesis, Invariants, Units In Scope, Acceptance Checklist                          |

See `templates/ideas/` for copy-ready skeletons.

## Workflow

1. **Draft** idea briefs and supporting Unit/Composition docs under `/ideas`.
2. **Share** with the owning lane for feedback; update acceptance checklists as
   contracts solidify.
3. **Create Issues** using the matching templates (`Unit`, `Composition`, `Bug`)
   and copy relevant sections from the idea files.
4. **Link Tickets** back to the idea by referencing the file path in the Issue
   description (e.g. `Source: ideas/U-bridge-intro-card.md`).
5. **Update** the idea files as decisions change; they become living references
   until the work ships.

## Relationship to Roadmap & PRs

- Ticket IDs in idea files must match the IDs used in Issues, PR titles, and
  commit prefixes (`[U-…]`, `[C-…]`, etc.).
- Acceptance checklists from the idea files flow into Issues, then into PRs via
  the template. Keep them current to avoid drift.
- Ensure the Plaincraft Roadmap project captures the same Units/Compositions
  with the correct lane labels and custom field values.

## Maintenance Checklist

- [ ] Every initiative has an accompanying brief + unit/composition docs.
- [ ] Ticket IDs in `/ideas` match GitHub Issues and commits.
- [ ] Acceptance checklists are current and mirrored in Issues.
- [ ] `/templates/ideas/*.md` updated when Issue templates change.
- [ ] Guides referenced in `protocol.md` stay accurate.

Use `guides/IDEAS-COMPLIANCE.md` to audit existing idea files.
