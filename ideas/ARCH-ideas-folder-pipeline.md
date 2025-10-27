# ARCH-ideas-folder-pipeline

Lane: C
Purpose: Ensure `/ideas` scaffolding exists and is wired into the ideas → issues pipeline.

## Problem

New repos or fresh clones that run `pnpm ideas:create` fail when the `/ideas` directory is absent (e.g., after pruning or starting greenfield). The workflow currently expects the folder and templates to exist, producing confusing "No such file or directory" errors before any Issues are generated.

## Proposal

1. Add bootstrap logic to `scripts/ideas-to-issues.mjs` (and the GitHub Actions workflow) that creates `/ideas` and seeds template files when missing.
2. Provide a `pnpm ideas:init` helper that copies starter templates from `templates/ideas/`.
3. Update docs (Ideas Guide + CI Strategy) to call out the bootstrap command and pipeline expectations.
4. Add validation so the workflow surfaces a friendly message when the directory is empty rather than crashing.

## Acceptance Checklist

- [ ] `ideas-to-issues.mjs` gracefully creates `/ideas` (with `.gitkeep`) if absent.
- [ ] New `pnpm ideas:init` script copies starter templates (`idea-brief`, `idea-unit`, `idea-composition`).
- [ ] GitHub Actions `ideas.yml` validates the directory and emits actionable errors.
- [ ] Guides (`IDEAS-GUIDE.md`, `CI-STRATEGY.md`) updated with initialization instructions.
- [ ] Added regression test or dry-run path proving pipeline handles empty repos.
