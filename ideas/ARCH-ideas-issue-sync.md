# ARCH-ideas-issue-sync

Lane: C
Purpose: Enhance ideas-to-issues script to populate full metadata from idea files into GitHub Issues.
Issue: #29
Parent: #26 (ARCH-source-of-truth)

## Problem

Currently `scripts/ideas-to-issues.mjs` only creates basic Issues with title and labels. The full Problem, Proposal, and Acceptance Checklist sections from idea files are not transferred to Issue bodies, requiring manual duplication and leading to drift between the source card and the Issue.

## Proposal

1. Update `parseIdeaFile()` to extract Problem, Proposal, and Purpose sections in addition to existing metadata.
2. Modify `createIssue()` to generate comprehensive Issue bodies that include:
   - Purpose statement
   - Problem description
   - Proposed solution/approach
   - Full acceptance checklist (not just as checkboxes, but with context)
   - Link back to idea file location
3. Add template formatting that matches GitHub Issue markdown conventions.
4. Preserve backward compatibility with existing Issue structure while adding the new content.
5. Update issue body template to include "Source: `/ideas/ARCH-*.md`" footer.

## Acceptance Checklist

- [ ] `parseIdeaFile()` extracts Purpose, Problem, and Proposal sections from idea markdown.
- [ ] `createIssue()` generates Issue body with all metadata from idea file.
- [ ] Issue bodies include formatted sections: Purpose, Problem, Proposal, Acceptance Checklist.
- [ ] Issue body includes footer linking back to source idea file.
- [ ] Existing Issues continue to work with enhanced script (backward compatible).
- [ ] Dry-run mode shows full Issue body preview before creation.
- [ ] Script tested with all prefix types (U-, C-, B-, ARCH-, PB-).
