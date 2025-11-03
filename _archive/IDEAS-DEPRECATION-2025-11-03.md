# Ideas Workflow Deprecation Summary

**Date:** November 3, 2025  
**Reason:** Project governance and lifecycle management removed from Lane D responsibilities

## What Was Deprecated

### 1. Ideas Folder Structure
- **Removed:** `/ideas/` folder with 86 markdown files
- **Archived to:** `/_archive/ideas-2025-11-03-deprecated/`
- **Replaced with:** Stub README explaining deprecation

### 2. Lane D Responsibilities
The following responsibilities have been removed from Lane D:
- ❌ Lifecycle governance via GitHub Projects
- ❌ Backlog management and project stewardship
- ❌ Idea intake and status tracking
- ❌ Project schema maintenance (ID, Type, Lane, Status, Owner, Priority, Release)
- ❌ Backlog pilot procedures
- ❌ Project board reconciliation

### 3. Deprecated Ideas
Marked as DEPRECATED in frontmatter:
- `ARCH-scripts-first-project-governance.md` - Project governance
- `scripts-firstlifecycle-v3.md` - Scripts-First Lifecycle
- `ARCH-recording-handoff-operations.md` - Backlog-based recording handoffs
- `PB-guides-readme-sunset.md` - Already delivered, but used backlog procedures

### 4. Deprecated Scripts
Scripts that are now non-functional:
- `scripts/ideas-to-issues.mjs` - Convert ideas to GitHub issues
- `scripts/sync-ideas-checklists.mjs` - Sync idea checklists with issues
- `scripts/validate-ideas.mjs` - Validate idea file structure
- `scripts/ops/idea-intake.mjs` - Idea intake automation (if exists)
- `scripts/ops/ideas-to-issues.mjs` - Idea to issue conversion (if exists)
- `scripts/ops/sync-ideas-checklists.mjs` - Checklist sync (if exists)
- `scripts/checks/validate-ideas.mjs` - Idea validation (if exists)

All DEPRECATED scripts in `scripts/DEPRECATED/` that reference ideas workflow.

### 5. Updated Documentation
Files updated with deprecation notices:
- `/ideas/README.md` - New stub explaining deprecation
- `/templates/INDEX.md` - Marked ideas template as deprecated
- `/templates/guide/USAGE.md` - Deprecated idea-related steps
- `/README.md` - Removed ideas from Template-First Toolkit

### 6. Removed Concepts
- GitHub Projects v2 integration for status tracking
- Project schema fields (ID, Type, Lane, Status, Owner, Priority, Release)
- Idea frontmatter-to-project synchronization
- State machine: Draft → Ticketed → Branched → PR Open → In Review → Merged → Archived
- Reconciliation scripts for SoT merge
- Backlog audit procedures
- TTL tracking for media assets via project boards

## What Remains

Lane D may still be responsible for:
- ❓ Program Operations (to be defined)
- ❓ Cross-lane coordination (to be defined)
- ❓ Documentation rollout support (to be defined)

Refer to updated Lane D documentation for current scope.

## Migration Path

1. **For historical reference:** Check `/_archive/ideas-2025-11-03-deprecated/`
2. **For new work:** Use updated workflows that don't depend on ideas folder
3. **For scripts:** Remove any CI/CD references to idea validation or intake
4. **For Lane D contributors:** Await updated role definition without project governance

## Files Changed

### Archived
- `/ideas/` → `/_archive/ideas-2025-11-03-deprecated/` (86 files)

### Modified
- `/ideas/README.md` (new deprecation stub)
- `/ideas/ARCH-scripts-first-project-governance.md` (marked deprecated)
- `/ideas/scripts-firstlifecycle-v3.md` (marked deprecated)
- `/ideas/ARCH-recording-handoff-operations.md` (marked deprecated)
- `/templates/INDEX.md` (ideas section deprecated)
- `/templates/guide/USAGE.md` (idea steps deprecated)
- `/README.md` (ideas template removed)
- `/scripts/ideas-to-issues.mjs` (stronger deprecation)
- `/scripts/sync-ideas-checklists.mjs` (stronger deprecation)
- `/scripts/validate-ideas.mjs` (stronger deprecation)

## Next Steps

1. Update Lane D runbook/documentation with new responsibilities
2. Remove CI/CD workflows that reference ideas validation
3. Update any GitHub Actions that depend on ideas folder
4. Remove package.json scripts related to ideas (ideas:create, ideas:sync, ideas:validate)
5. Archive or update any templates that reference the ideas workflow
