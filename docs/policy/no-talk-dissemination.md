---
id: policy-no-talk-dissemination
owner: @lane-d
lane: D
version: 1.0.0
created: 2025-11-02
last_verified: 2025-11-02
ttl_days: 365
---

# No-Talk Dissemination Policy

**Goal:** Nobody passes PDFs or pings manually. The system routes work.

## Contracts

- **Single edit point:** `docs/_registry.yaml`. All projections read from it.
- **Auto-notify:** `CODEOWNERS` requests the right lane when their surface changes.
- **Status changes:** happen only in the Project item, not chat.
- **Baton:** `current_owner` and `next_owner` must always be set in the Project item.

## Stop rules

- Missing registry entry → work blocked. Lane D must seed it.
- Missing next_owner → status cannot advance.
- D cannot accept without A/B/C evidence in the registry row.
