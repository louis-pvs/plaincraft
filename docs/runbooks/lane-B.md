---
id: "runbook-lane-b"
owner: "@lane-b"
lane: "B"
version: "1.1.0"
created: "2025-11-02"
ttl_days: 60
last_verified: "2025-11-02"
---

# Lane B Runbook (Playbook)

**Trigger**: Lane A pilot PR is green  
**Inputs required**: Pilot ID, GIF ≤2 MB at 960 px, README snippet link  
**Owner**: Lane B  
**Time box**: 1 working day  
**Stop rule**: Asset exceeds 2 MB or missing backlinks

**Steps**

1. Write 200-word narrative and 2-line caption for the pilot page.
2. Embed asset and link to README and Storybook.
3. Flip Stale to Verified when checks pass.

**Outputs**: Playbook page updated and Verified  
**Hand-off**: Lane C confirms gates and budgets  
**Evidence**: Page link, asset size note, Verified badge diff
