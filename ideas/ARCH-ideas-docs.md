# ARCH-ideas-docs

Lane: C
Purpose: Update all guides to document the new ideas-as-source-of-truth workflow and lifecycle automation.
Issue: #34
Parent: #26 (ARCH-source-of-truth)

## Problem

Existing documentation (`IDEAS-GUIDE.md`, `IDEAS-COMPLIANCE.md`, `SCRIPTS-REFERENCE.md`, `CI-STRATEGY.md`) describes a manual workflow where idea files are separate from Issues/PRs/changelog. After implementing source-of-truth automation, this documentation will be outdated and misleading.

## Proposal

1. Update `guides/IDEAS-GUIDE.md`:
   - Document that idea files are the master source for all metadata
   - Explain automatic Issue population from idea files
   - Describe automatic PR body generation from idea files
   - Document automatic changelog generation from idea files
   - Add Sub-Issues section format and usage
   - Explain idea lifecycle (creation → issue → PR → merge → archive)

2. Update `guides/IDEAS-COMPLIANCE.md`:
   - Add compliance rule: "Idea file must exist before creating Issue"
   - Document requirement for Sub-Issues section in large architectural work
   - Explain Parent: reference format for child issues
   - Add rule about keeping idea files in sync until Issue closes

3. Update `guides/SCRIPTS-REFERENCE.md`:
   - Document enhanced `ideas-to-issues.mjs` behavior (full metadata, sub-issues)
   - Update `create-worktree-pr.mjs` documentation (idea file sourcing)
   - Update `consolidate-changelog.mjs` documentation (automatic generation)
   - Add documentation for new `cleanup-ideas.mjs` script
   - Document `findIdeaFileForIssue()` helper usage

4. Update `guides/CI-STRATEGY.md`:
   - Document `idea-lifecycle.yml` workflow
   - Explain automatic idea archival on Issue close
   - Document safety checks and override mechanisms
   - Add workflow diagram showing idea → issue → PR → merge → archive flow

5. Create migration guide:
   - Add section explaining transition from manual to automated workflow
   - Document backward compatibility approach
   - Provide examples of new vs. old workflow

## Acceptance Checklist

- [ ] `IDEAS-GUIDE.md` updated with source-of-truth workflow and Sub-Issues format.
- [ ] `IDEAS-COMPLIANCE.md` updated with new compliance rules.
- [ ] `SCRIPTS-REFERENCE.md` updated with all enhanced script behaviors.
- [ ] `CI-STRATEGY.md` updated with idea-lifecycle workflow documentation.
- [ ] Migration guide section added explaining transition.
- [ ] All documentation examples use new workflow patterns.
- [ ] Documentation reviewed for consistency and clarity.
- [ ] Cross-references between guides updated to reflect new automation.
