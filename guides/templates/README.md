# Templates Catalog

Templates and scaffolds are the single source of truth for every guide in this repository. Use this README to jump straight to the asset you need before writing or updating documentation.

## Core Template Families

- `/templates/guide/` — Authoring skeletons and schema for guide frontmatter.
- `/templates/ideas/` — Idea specs feeding issue automation (`USAGE.md` consumed by scripts).
- `/templates/issue-unit/` & `/templates/issue-composition/` — GitHub issue scaffolds for execution lanes.
- `/templates/pull-request/` — PR description with acceptance checklist mirrors.
- `/templates/changelog/` — Release note outline plus validation helpers.
- `/templates/script/` — Script README scaffolds for developer tooling.

## Governance Checks

- JSON schema: `/templates/template.schema.json`
- Validation commands:
  ```bash
  pnpm guides:lint     # frontmatter + TTL + executable command enforcement
  pnpm guides:dedupe   # duplication guardrail
  pnpm guides:ttl      # archive expired guides (use --yes to execute)
  pnpm guides:index    # regenerate metadata index
  ```

## Adding or Updating a Template

1. Introduce or modify the scaffold under `/templates/**`.
2. Update accompanying `USAGE.md` or config files for machine consumption.
3. Bump `version` and log changes in the template `CHANGELOG.md` (if present).
4. Regenerate indices or caches required by automation (`pnpm guides:index --yes`).
5. Only after the template is merged should a guide reference it via `scaffold_ref`.

## Related Guides

- [`guide-scripts.md`](../guide-scripts.md) — Explains enforcement scripts tied to template metadata.
- [`guide-workflow.md`](../guide-workflow.md) — Shows how templates chain together across lanes.
- [`guide-guardrails.md`](../guide-guardrails.md) — Hard requirement checklist for running `pnpm guardrails` before every PR.
- [`guide-roadmap-setup.md`](../guide-roadmap-setup.md) — Consumes roadmap and idea templates.

If documentation starts duplicating template content, prune the guide and move details back into the scaffold. The template is the product; the guide is the map.
