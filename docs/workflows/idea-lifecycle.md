---
id: workflow-idea-lifecycle
owner: "@lane-d"
lane: D
version: 1.0.0
created: 2025-11-02
ttl_days: 90
last_verified: 2025-11-02
next: /workflows/pr-changelog-pipeline
---

# Idea Lifecycle (Canonical Workflow)

Single truth: content lives in Issues/ideas files. Status lives in GitHub Projects. Project state is authoritative on conflict.

**IDs:** ARCH-n, U-n, C-n, B-n, PB-n  
**States:** Draft → Ticketed → Branched → PR Open → In Review → Merged → Archived

## Workflow Diagram

```mermaid
graph TB
  subgraph Sources["Sources of Truth"]
    Idea["Idea (Issue/idea file)<br/>Title • Goal • Acceptance"]
    Project["Project Item<br/>ID • Type • Lane • Status"]
  end

  Idea -->|intake| Project

  Draft[Draft] --> Ticketed[Ticketed]
  Ticketed -->|create-branch| Branched[Branched]
  Branched -->|first push| PROpen[PR Open]
  PROpen --> Review[In Review]
  Review -->|approve & squash| Merged[Merged]
  Merged -->|closeout| Archived[Archived]

  Branched -.->|type/ID-slug| Branch[Branch]
  PROpen -.->|PR: ID slug| PR[Pull Request]
  Merged -.->|changelog| Notes[Notes]

  classDef source fill:#eef,stroke:#99f,stroke-width:2px
  classDef state fill:#efe,stroke:#5b5,stroke-width:2px

  class Idea,Project source
  class Draft,Ticketed,Branched,PROpen,Review,Merged,Archived state
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
