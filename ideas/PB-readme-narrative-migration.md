---
id: PB-readme-narrative-migration
owner: lane.b
lane: B
type: playbook
priority: P1
state: ready
next_state: in-progress
acceptance:
  - Storybook docs updated to host the former guide "view/read" narratives
  - Playbook pages refreshed with business-facing guidance linked from READMEs
  - Template README "Links" sections point to the new Storybook/Playbook routes
  - Content review signed off by Lane B and paired with README owner acknowledgements
---

# PB-readme-narrative-migration

Lane: B (Narrative & Playbook Stewardship)

## Lane

- **Primary Lane:** B (Narrative & Playbook Stewardship)
- **Partners:** Lane D for backlog tracking, Lane C for guardrail signals.

## Purpose

Move all developer-facing narratives out of `/guides` into the correct
Storybook docs and Playbook routes so template-first READMEs stay thin while
teams still have a rich "view/read" experience.

## Process

1. Audit the archived guide set and map each narrative to an existing or new
   Storybook doc (`storybook/docs/**`) or Playbook page (`playbook/pages/**`).
2. Preserve deep links by adding redirect stubs where needed and updating the
   navigation index for Storybook and Playbook.
3. Ensure each template README's "Links" section points to the refreshed doc/
   page and backfills owner metadata for follow-up maintenance.
4. Coordinate with Lane D to announce the migration and communicate the new
   entry points in the ADR and decision summary.

## Acceptance Checklist

- [ ] Archived guide narratives mapped and migrated to Storybook docs or Playbook pages.
- [ ] Storybook navigation updated; Playbook sidebar reflects the new entries.
- [ ] Template README "Links" sections verified against migrated content.
- [ ] Redirect or pointer stubs added for any legacy URLs shared externally.
- [ ] Release note / announcement drafted with Lane D for developer visibility.

## Status

- 2025-10-31 - In progress: Published Playbook pattern `release-changelog-automation` to anchor changelog workflows. See `/playbook/patterns/release-changelog-automation.html` and the newest `CHANGELOG.md` entry for the worked example.
