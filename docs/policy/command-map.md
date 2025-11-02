---
id: "policy-command-map"
owner: "@lane-c"
lane: "C"
version: "1.0.0"
created: "2025-11-02"
last_verified: "2025-11-02"
ttl_days: 365
---

# Command Map (Triggers → Artifacts)

| Trigger              | Files created/updated                                                                             | Paths                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| ADR NOW              | ADR → Action workflow, Intake Card template, lane runbooks (ADR Mode), policy refs, registry seed | `docs/workflows/`, `.github/ISSUE_TEMPLATE/`, `docs/runbooks/`, `docs/policy/`, `docs/_registry.yaml` |
| DOC ROUTE `<id>`     | Routing verdict + links, visibility flag, owner/TTL in registry                                   | `docs/policy/content-routing-matrix.md`, `docs/_registry.yaml`                                        |
| PLAYBOOK PAGE `<id>` | Playbook page skeleton with narrative/caption placeholders                                        | `playbook/pages/patterns/<id>.md`                                                                     |
| STORYBOOK DOC `<id>` | MDX skeleton with props/states/a11y slots                                                         | `storybook/docs/Patterns/<id>.mdx`                                                                    |
| POLICY ENFORCE       | Commit/PR/branch invariants + CI gates summary                                                    | `docs/policy/workflow-enforcement.md`                                                                 |

## Linking Rules

- Every public page must link its registry ID.
- CI blocks edits to generated projections and public→internal links.
