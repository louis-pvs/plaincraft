---
id: ref-project-schema
owner: @lane-d
version: 1.0.0
created: 2025-11-02
ttl_days: 180
last_verified: 2025-11-02
---

# Project Schema (Status Source of Truth)

| Field    | Type          | Values/Format                                                   | Required |
| -------- | ------------- | --------------------------------------------------------------- | -------- |
| ID       | Text          | ARCH-n, U-n, C-n, B-n, PB-n                                     | Yes      |
| Type     | Single-select | Unit, Composition, Bug, Arch, Playbook                          | Yes      |
| Lane     | Single-select | A, B, C, D                                                      | Yes      |
| Status   | Single-select | Draft, Ticketed, Branched, PR Open, In Review, Merged, Archived | Yes      |
| Owner    | User          | GitHub handle                                                   | Yes      |
| Priority | Single-select | P1, P2, P3, P4                                                  | Optional |
| Release  | Text/Iter     | Sprint/Release name                                             | Optional |

## Rules

- Exactly one Project item per ID.
- Status may only move one step per transition.
- Reconcile writes back status to idea frontmatter.
