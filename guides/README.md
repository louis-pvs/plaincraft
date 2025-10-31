# Developer Guides Deprecated

This folder is now an archive checkpoint. Developer workflows live alongside
their source templates:

- `/templates/<name>/README.md` - entry point for scaffolding and executable
  steps (template-first is the rule).
- `snippets|flows|scripts/**/README.md` - thin hand-off back to the owning
  template's `USAGE.md` and Storybook docs.
- `storybook/docs/**` and `playbook/pages/**` - long-form narratives and
  examples owned by Lane B.

Legacy guides (pre-template-first) live under `_archive/2025/11-guides-sunset/`.
Do not add new content here - link the owning template README instead.

If you land on anything inside `guides/_archive/` or `guides/DEPRECATED/`, treat it as historical reference only. Do not follow, copy, or update those files for live workflows—always bounce back to the template README, Storybook doc, or Playbook pattern that owns the narrative today.
