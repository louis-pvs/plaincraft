# Ideas Folder Compliance Checklist

Run this checklist whenever you add or revise idea documents. It keeps `/ideas`
aligned with Issue templates, project automation, and the changelog/commit tag
rules.

## Structure

- [ ] Every initiative has a base brief (`ideas/<slug>.md`) using the Problem /
      Signal / Hunch / Notes / Tickets format.
- [ ] Each Unit idea lives in `ideas/U-<slug>.md` and follows the Unit template.
- [ ] Each Composition idea lives in `ideas/C-<slug>.md` and follows the
      Composition template.
- [ ] No stray files in `/ideas` (all entries mapped to tickets or archived).

## Content Requirements

- [ ] Ticket IDs in the idea files match expected commit/PR prefixes
      (`[U-…]`, `[C-…]`, `[B-…]`, `[ARCH-…]`, `[PB-…]`).
- [ ] Acceptance checklists are actionable and mirror what will land in Issues /
      PRs.
- [ ] Unit docs include: Lane, Linked Composition, Contracts, Props + Shape,
      Behaviors, Accessibility, Acceptance Checklist.
- [ ] Composition docs include: Lane, Metric Hypothesis, Invariants, Units In
      Scope, Acceptance Checklist.
- [ ] Briefs list the associated Unit/Composition ticket IDs under **Tickets**.

## Cross-linking

- [ ] Issues created from these ideas reference the source file path.
- [ ] Plaincraft Roadmap entries reference the same ticket IDs and lane labels.
- [ ] Changelog entries use the same tags as the idea / ticket (for later
      release notes).

## Templates & Guides

- [ ] `templates/ideas/*.md` reflects the latest Issue template sections.
- [ ] `guides/IDEAS-GUIDE.md` mirrors the current process and naming rules.
- [ ] `protocol.md` references the Ideas guide for Pair D ownership.

## Automation Compatibility

- [ ] `.github/pipeline-config.json` doesn’t require updates when new idea types
      are added (if it does, update the config first).
- [ ] Scripts generating Issues or PR content can parse the idea documents (keep
      headings consistent).

Document any deviations and raise them with Pair D before merging.
