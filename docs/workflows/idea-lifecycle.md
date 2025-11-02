---
id: workflow-idea-lifecycle
owner: "@lane-d"
lane: D
version: 1.0.0
created: 2025-11-02
ttl_days: 90
last_verified: 2025-11-02
---

# Idea Lifecycle (Canonical Workflow)

Single truth: content lives in Issues/ideas files. Status lives in GitHub Projects. Project state is authoritative on conflict.

**IDs:** ARCH-n, U-n, C-n, B-n, PB-n  
**States:** Draft → Ticketed → Branched → PR Open → In Review → Merged → Archived

```mermaid
flowchart LR
  subgraph Sources_of_Truth
    I[Idea (Issue/idea file)\nTitle • Goal • Acceptance]
    P[Project Item\nID • Type • Lane • Status]
  end
  I -- "intake" --> P

  Draft((Draft))
  Ticketed((Ticketed))
  Branched((Branched))
  PROpen((PR Open))
  Review((In Review))
  Merged((Merged))
  Archived((Archived))

  Draft --> Ticketed
  Ticketed -->|create-branch| Branched
  Branched -->|first push → PR| PROpen
  PROpen --> Review
  Review -->|approve & squash| Merged
  Merged -->|closeout| Archived

  Branched -. "branch: type/ID-slug" .- BREF[Branch]
  PROpen -. "PR: [ID] slug — subject" .- PR[Pull Request]
  Merged -. "changelog entry" .- CL[Notes]

  classDef g fill:#eef,stroke:#99f,stroke-width:1px;
  classDef s fill:#efe,stroke:#5b5,stroke-width:1px;

  class I,P g
  class Draft,Ticketed,Branched,PROpen,Review,Merged,Archived s
```

## RACI (summary)

- Lane D: policy owner, canonical doc, approvals.
- Lane B: Playbook page, narrative, decision visuals.
- Lane A: unit READMEs (scaffold/test/rollback).
- Lane C: enforcement (commit/PR rules, CI checks, dashboards).

## Invariants

- One ID → one branch → one PR.
- PR title starts with [ID].
- Commits: [ID] type(scope): subject (no slugs).
- Project status is authoritative; reconcile updates idea frontmatter.

## Links

- Policy enforcement: /docs/policy/workflow-enforcement.md
- Project schema: /docs/reference/project-schema.md
- Runbooks: /docs/runbooks/
