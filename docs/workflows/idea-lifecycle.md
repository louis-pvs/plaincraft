---
id: "workflow-idea-lifecycle"
owner: "@lane-d"
lane: "D"
version: "1.0.0"
created: "2025-11-02"
ttl_days: 90
last_verified: "2025-11-02"
---

# Idea Lifecycle (Canonical)

Single truth: content lives in Ideas/Issues; status lives in GitHub Projects.

**States:** Draft → Ticketed → Branched → PR Open → In Review → Merged → Archived

```mermaid
flowchart LR
  subgraph Sources_of_Truth
    I[Idea file or Issue\nTitle • Goal • Acceptance]
    P[Project Item\nID • Type • Lane • Status]
  end
  I -- "intake" --> P

  Draft((Draft)) --> Ticketed((Ticketed)) -->|create branch| Branched((Branched)) -->|first push → PR| PROpen((PR Open)) --> Review((In Review)) -->|approve & squash| Merged((Merged)) -->|closeout| Archived((Archived))

  classDef g fill:#eef,stroke:#99f,stroke-width:1px;
  classDef s fill:#efe,stroke:#5b5,stroke-width:1px;

  class I,P g
  class Draft,Ticketed,Branched,PROpen,Review,Merged,Archived s
```

## Invariants

- One ID → one branch → one PR.
- PR title starts with [ID].
- Project status is authoritative on conflict.
