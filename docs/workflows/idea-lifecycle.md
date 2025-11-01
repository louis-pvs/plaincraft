---
id: workflow-idea-lifecycle
owner: "@lane-d"
lane: D
version: 1.0.0
created: 2025-11-01
ttl_days: 90
last_verified: 2025-11-01
---

# Idea Lifecycle (Canonical Workflow)

**Single truth:** Content lives in Issues/ideas files; **status** lives in GitHub Projects.  
**IDs:** `ARCH-n`, `U-n`, `C-n`, `B-n`, `PB-n`.  
**States:** Draft → Ticketed → Branched → PR Open → In Review → Merged → Archived.

```mermaid
flowchart LR
    subgraph Sources["Sources of Truth"]
        I["Idea (Issue/idea file)<br/>Title • Goal • Acceptance"]
        P["Project Item<br/>ID • Type • Lane • Status"]
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

    %% Links to artifacts
    Branched -. "branch: type/ID-slug" .- BREF[Branch]
    PROpen -. "PR: [ID] slug — subject" .- PR[Pull Request]
    Merged -. "changelog entry" .- CL[Notes]

    %% Guardrails
    classDef g fill:#eef,stroke:#99f,stroke-width:1px;
    classDef s fill:#efe,stroke:#5b5,stroke-width:1px;
    classDef w fill:#ffe,stroke:#cc3,stroke-width:1px;

    class I,P g
    class Draft,Ticketed,Branched,PROpen,Review,Merged,Archived s
```

## RACI (summary)

- Lane D: policy owner, canonical doc, approvals.
- Lane B: Playbook page, narrative, decision visuals.
- Lane A: unit READMEs (scaffold/wire/test/rollback).
- Lane C: enforcement (commit/PR rules, CI checks, dashboards).

## Invariants

One ID → one branch → one PR.

PR title starts with [ID].

Commits: [ID] type(scope): subject (no slugs).

Project status is authoritative; reconcile updates idea frontmatter.

## Links

- Policy enforcement: /docs/policy/workflow-enforcement.md
- Project schema: /docs/reference/project-schema.md
- Runbooks: /docs/runbooks/
- ADR: /docs/adr/2025-10-idea-lifecycle.md
