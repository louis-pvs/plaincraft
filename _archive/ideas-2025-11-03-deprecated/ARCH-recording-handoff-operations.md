# ARCH-recording-handoff-operations [DEPRECATED]

Lane: D (Backlog & Program Operations)
Issue: 95

> **⚠️ DEPRECATED (2025-11-03):** Project board-based tracking and backlog pilot procedures are no longer required. Recording handoff coordination has been simplified without project governance dependencies.

## Lane

- **Primary Lane:** D (Backlog & Program Operations)
- **Labels:** recordings, backlog, coordination

## Purpose

Establish the hand-off contract between lanes for deterministic recordings,
track embed locations, and ensure media freshness audits become part of the
regular backlog workflow.

## Problem

Lane A will produce assets and Lane B will curate them, but without Lane D
procedures:

- ~~Project boards won't reflect which decisions gained clips or need refresh.~~ [DEPRECATED: Project boards no longer used]
- Media can go stale when units change; no one records TTL breaches.
- ~~Backlog pilots lack a clear checklist for verifying hand-offs and triggering
  replacements.~~ [DEPRECATED: Backlog pilot role removed]

## Proposal

1. Add recording-specific fields/checklists to the Project/idea workflow (e.g.,
   “Recording delivered”, “Playbook embed”, “TTL date”).
2. Define the logging format Lane B must update (asset path, decision, owner)
   and wire that into regular backlog audits.
3. Document stop rules (“publish thumbnail only”, “wait for Lane C migration”)
   and escalation routes when assets break guardrails.
4. Train backlog pilots on how to request re-recordings, track stale assets, and
   coordinate with Lane C on pipeline issues.

## Acceptance Checklist

- [ ] Project board/idea template updated with recording delivery & embed status
      fields or checklist items.
- [ ] Backlog audit procedure documents how to review the curation log, TTL
      dates, and escalate stale/ missing assets.
- [ ] Communication template (issue/Slack snippet) prepared for requesting new
      recordings or raising pipeline blocks.
- [ ] First audit run completed, capturing baseline inventory of recording
      assets and open gaps.
