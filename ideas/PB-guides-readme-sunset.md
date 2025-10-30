---
id: PB-guides-readme-sunset
owner: lane.d
lane: D
type: playbook
priority: P1
state: ready
next_state: in-progress
acceptance:
  - Legacy developer guides archived under `_archive/2025/11-guides-sunset/`
  - `guides/README.md` replaced with stub pointing to template and view owners
  - Folder README coverage confirmed for templates/snippets/flows/scripts
  - CI guardrails updated to lint READMEs and templates instead of guides
---

# PB-guides-readme-sunset

Lane: D (Backlog & Documentation)

## Lane

- **Primary Lane:** D (Backlog & Documentation)
- **Partners:** Lane B for Storybook/Playbook copy, Lane C for guardrail wiring.

## Purpose

Sunset the `/guides` entry point so developers land directly on the owning
template README, while narrative content shifts to Storybook docs and Playbook
pages.

## Process

1. Archive legacy guides into `_archive/2025/11-guides-sunset/` and replace
   `guides/README.md` with a stub that points to the new sources.
2. Add README coverage checks and README lint tooling (`readme-lint`,
   `template-coverage`, `view-dedupe`).
3. Ensure every collection folder (`snippets`, `flows`, `scripts`) links out to
   the right template and view documentation.
4. Update ADR `2025-10-Overarching-v2` with the final decision details.

## Acceptance Checklist

- [x] Legacy guides archived under `_archive/2025/11-guides-sunset/`.
- [x] New `guides/README.md` stub directs developers to templates, Storybook,
      and Playbook.
- [ ] README lint + template coverage checks replace guide governance in CI.
- [ ] Folder README inventory verified; missing READMEs backfilled or marked with
      `// no-readme`.
- [ ] ADR entry updated and linked from decision file.

## Status

- 2025-10-30 - Advanced to `ready` by archiving legacy guides and publishing the
  stub README.
