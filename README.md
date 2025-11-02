## START HERE

Workflows included

- `.github/workflows/adr-intake-auto.yml` — parses ADR → creates/updates Intake Card, assigns A.
- `.github/workflows/registry-cascade.yml` — on registry push, assigns `next_owner` and labels the lane.
- `.github/workflows/registry-enforcement.yml` — CI check for missing ADR IDs, baton fields, evidence links.
