# ARCH-ideas-folder-pipeline

Lane: C
Purpose: Ensure `/ideas` scaffolding exists and is wired into the ideas → issues pipeline.
Issue: #22

## Problem

## Proposal

2. Provide a `pnpm ideas:init` helper that copies starter templates from `templates/ideas/`.
3. Update docs (Ideas Guide + CI Strategy) to call out the bootstrap command and pipeline expectations.
4. Add validation so the workflow surfaces a friendly message when the directory is empty rather than crashing.

## Acceptance Checklist

- [ ] New `pnpm ideas:init` script copies starter templates (`idea-brief`, `idea-unit`, `idea-composition`).
- [ ] GitHub Actions `ideas.yml` validates the directory and emits actionable errors.
- [ ] Guides (`IDEAS-GUIDE.md`, `CI-STRATEGY.md`) updated with initialization instructions.
- [ ] Added regression test or dry-run path proving pipeline handles empty repos.
