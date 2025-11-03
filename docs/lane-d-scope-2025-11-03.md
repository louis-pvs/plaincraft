# Lane D Scope Update (2025-11-03)

**Effective Date:** November 3, 2025  
**Document Owner:** Lane B (Narrative & Enablement)  
**Status:** Draft - Awaiting Lane D Review

## Overview

This document clarifies Lane D's current scope following the deprecation of the ideas workflow and GitHub Projects-based lifecycle governance on November 3, 2025.

## What Was Removed from Lane D

The following responsibilities have been **permanently removed** from Lane D's scope:

### ❌ Deprecated Responsibilities

1. **Lifecycle Governance via GitHub Projects**
   - Managing GitHub Projects v2 as status source of truth
   - Maintaining project schema (ID, Type, Lane, Status, Owner, Priority, Release)
   - Running reconciliation scripts between idea files and project boards
   - Status transition automation

2. **Backlog Management & Project Stewardship**
   - Backlog pilot procedures
   - Weekly audit scripts for drift detection
   - Project board health monitoring
   - Intake review workflows

3. **Idea File Management**
   - Idea intake automation (`ops/idea-intake.mjs`)
   - Idea-to-issue conversion (`ops/ideas-to-issues.mjs`)
   - Idea validation (`checks/validate-ideas.mjs`)
   - Checklist synchronization (`ops/sync-ideas-checklists.mjs`)

4. **TTL & Asset Tracking**
   - Time-to-live tracking for media assets via project boards
   - Recording delivery status tracking in project fields
   - Stale asset detection through backlog audits

## What Lane D May Still Own

> ⚠️ **Lane D Review Required** - The following is inferred from historical patterns. Lane D must confirm, clarify, or redefine these responsibilities.

### Potential Current Responsibilities

#### 1. Cross-Lane Coordination (Operational)

- **What:** Facilitate communication between Lane A, B, and C for multi-lane initiatives
- **Examples:**
  - Coordinating rollout schedules across lanes
  - Ensuring handoffs between lanes are documented
  - Managing dependencies when one lane blocks another
- **Tools:** Communication channels, status updates, meeting coordination
- **Not:** Direct project management or status tracking

#### 2. Documentation Rollout Support

- **What:** Support Lane B with documentation adoption and communication
- **Examples:**
  - Drafting rollout announcements for new documentation
  - Coordinating training materials distribution
  - Gathering feedback on documentation effectiveness
- **Tools:** Release notes, announcement templates, feedback collection
- **Not:** Authoring documentation (that's Lane B) or enforcing compliance

#### 3. Program Operations (To Be Defined)

- **What:** TBD by Lane D
- **Potential areas:**
  - Operational metrics reporting?
  - Rollout sequencing coordination?
  - Compliance tracking support?
- **Needs clarification:** Lane D should define this scope

## What Definitely Belongs to Other Lanes

To avoid confusion, here's what Lane D does **not** own:

### Lane A (Foundations & Tooling)

- Component/unit development and delivery
- Unit acceptance testing
- Storybook story creation
- Component API design

### Lane B (Narrative & Enablement)

- Documentation authoring (Playbook, README, guides)
- Template creation and maintenance
- Narrative storytelling and examples
- Onboarding content creation

### Lane C (DevOps & Automation)

- CI/CD pipeline management
- Script development and maintenance
- Guardrail enforcement
- Build automation and tooling

## Migration Guidance for Lane D Contributors

If you previously worked on Lane D tasks, here's how your work changes:

### If You Managed Project Boards

- **Old:** Maintained GitHub Projects v2, ran reconciliation scripts
- **New:** This responsibility is deprecated - no direct replacement
- **Alternative:** Standard GitHub Issues/PRs for tracking

### If You Ran Idea Intake

- **Old:** Used `ops/idea-intake.mjs` to create project items from idea files
- **New:** Use standard GitHub issue creation workflows
- **Reference:** GitHub CLI or web UI for issue management

### If You Audited Backlog for Drift

- **Old:** Weekly audit scripts to detect idea/project mismatches
- **New:** This responsibility is deprecated - no replacement needed
- **Alternative:** Standard GitHub issue hygiene (closing stale issues, etc.)

### If You Coordinated Rollouts

- **Old:** Used project board status + communication
- **New:** Direct coordination via issues, PRs, and announcements (clarification needed)
- **Reference:** TBD by Lane D

## Action Items for Lane D

Lane D must complete the following to finalize this transition:

### Required

1. **Review this document** - Confirm, correct, or expand the "What Lane D May Still Own" section
2. **Define Program Operations** - Clarify what "Program Operations" means in current scope
3. **Update training materials** - Remove references to deprecated workflows
4. **Create onboarding guide** - Document how new Lane D contributors get started
5. **Establish new workflows** - If Lane D coordinates rollouts, document the process

### Recommended

1. **Create examples** - Document 2-3 recent Lane D activities as reference
2. **Define success metrics** - How does Lane D measure effectiveness?
3. **Clarify escalation paths** - When should issues escalate to Lane D?

## Resources

### Historical Context

- **ADR:** `docs/adr/2025-11-03-ideas-workflow-deprecation.md`
- **Lane C Report:** `_archive/LANE-C-REPORT-IDEAS-SUNSET-2025-11-03.md`
- **Deprecation Summary:** `_archive/IDEAS-DEPRECATION-2025-11-03.md`
- **Archived Ideas:** `_archive/ideas-2025-11-03-deprecated/`

### Deprecated Scripts (Exit with Error)

- `scripts/ideas-to-issues.mjs`
- `scripts/validate-ideas.mjs`
- `scripts/sync-ideas-checklists.mjs`

### Deprecated Concepts

- Scripts-First Lifecycle v3
- GitHub Projects as status source of truth
- Project schema and reconciliation
- Backlog pilot procedures

## Timeline

| Date       | Milestone                                            |
| ---------- | ---------------------------------------------------- |
| 2025-11-03 | Ideas workflow deprecated, this document created     |
| 2025-11-10 | **Target: Lane D review complete**                   |
| 2025-11-17 | **Target: Updated scope documented**                 |
| 2025-12-03 | 30-day checkpoint - verify documentation accuracy    |
| 2026-02-01 | 90-day review - consider removing deprecated scripts |

## Questions?

If you're unsure whether something falls under Lane D's scope:

1. **Check this document** - Is it explicitly listed?
2. **Ask Lane D directly** - Coordinate via your team's communication channel
3. **Consult other lanes**:
   - Lane A for component work
   - Lane B for documentation
   - Lane C for automation/CI/CD

---

**Document Status:** Draft pending Lane D review  
**Created:** 2025-11-03  
**Owner:** Lane B (Narrative & Enablement)  
**Review By:** Lane D  
**Next Review:** 2025-12-03
