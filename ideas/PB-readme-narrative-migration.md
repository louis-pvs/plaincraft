---
id: PB-readme-narrative-migration
owner: lane.b
lane: B
type: playbook
priority: P1
state: delivered
next_state: archive
acceptance:
  - [x] Storybook docs updated to host the former guide "view/read" narratives
  - [x] Playbook pages refreshed with business-facing guidance linked from READMEs
  - [x] Template README "Links" sections point to the new Storybook/Playbook routes
  - [x] Content review signed off by Lane B and paired with README owner acknowledgements
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

- [x] Archived guide narratives mapped and migrated to Storybook docs or Playbook pages.
- [x] Storybook navigation updated; Playbook sidebar reflects the new entries.
- [x] Template README "Links" sections verified against migrated content.
- [x] Redirect or pointer stubs added for any legacy URLs shared externally.
- [x] Release note / announcement drafted with Lane D for developer visibility.

## Status

- 2025-10-31 - In progress: Published Playbook pattern `release-changelog-automation` to anchor changelog workflows. See `/playbook/patterns/release-changelog-automation.html` and the newest `CHANGELOG.md` entry for the worked example.
- 2025-11-01 - Delivered: New Playbook narratives published (`ideas-source-of-truth`, `script-automation-guardrails`, `roadmap-project-onboarding`) with matching Storybook docs and README backlinks. Redirect stubs now point legacy guide URLs to the new locations.

## Announcement Draft

**Subject:** Guides → Playbook/Storybook migration complete  
**Summary:** Lane B finished moving legacy `/guides` narratives into Playbook and Storybook. Templates now link directly to the new pages, Storybook navigation ships with governance docs, and legacy guide URLs redirect to the right destinations.  
**Call to action:** Refresh local clones, run `pnpm docs:views` before committing doc changes, and update any external bookmarks to the new Playbook URLs.
