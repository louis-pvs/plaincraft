# Guide Template

Version: 0.1.0  
Last Updated: 2025-10-28

## Overview

Template for creating compliant guides that follow the template-first governance model.

## Files

- `guide-template.md` - Main guide template with required frontmatter
- `USAGE.md` - How to use this template
- `README.md` - This file
- `template.config.json` - Metadata and validation schema

## Quick Start

```bash
# 1. Copy template
cp templates/guide/guide-template.md guides/guide-your-topic.md

# 2. Fill frontmatter
# - Update id, owner, lane, artifact_id, scaffold_ref
# - Set created date and last_verified

# 3. Write content
# - When to use / not use
# - Executable steps only
# - Rollback procedures
# - Requirements
# - Links to templates/scripts

# 4. Validate
wc -w guides/guide-your-topic.md  # Must be < 600 words
```

## Required Frontmatter

```yaml
---
id: guide-<slug>              # Unique identifier
owner: @handle                # Exactly one owner
lane: A|B|C|D                 # Roadmap lane
artifact_id: U-*|C-*|ARCH-*   # Linked ticket
scaffold_ref: /templates/<name>@vX.Y  # Template reference
version: X.Y.Z                # Guide version
created: YYYY-MM-DD           # Creation date
ttl_days: 90                  # Time to live
last_verified: YYYY-MM-DD     # Last verification date
---
```

## Structure

### When to use

3-5 specific scenarios where this guide applies

### When not to use

3-5 anti-patterns or scenarios where this guide doesn't apply

### Steps (all executable)

Numbered list of commands that can be run. Each step must:

- Have a descriptive title
- Include executable command in code block
- Be testable on clean clone within 10 minutes

### Rollback

How to undo the changes made by the guide

### Requirements

Preconditions needed before following the guide

### Links

References to templates, scripts, related guides

## Constraints

- **Word limit**: 600 words maximum
- **Template-first**: Must reference existing template or script
- **Executable steps**: Every step must have a runnable command
- **No duplication**: Reference templates, don't reproduce them
- **TTL tracking**: 90-day expiration enforced by CI

## Best Practices

1. **Keep it short**: Target 200-400 words
2. **Reference, don't duplicate**: Point to templates
3. **Executable only**: No narrative instructions without commands
4. **One owner**: Avoid shared ownership
5. **Current date**: Update last_verified when reviewing

## Related

- Governance: `/guides/README.md` (rules and guardrails)
- Active guides: `/guides/guide-*.md` (examples)
- Historical docs in `/guides/_archive/**` are reference-only—never copy them into new work.
- Templates: `/templates/` (what guides reference)
