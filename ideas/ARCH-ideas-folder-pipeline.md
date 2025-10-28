# ARCH-ideas-folder-pipeline

Lane: C (DevOps & Automation)
Issue: #22

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, ideas-pipeline

## Purpose

Ensure every repository has a ready-to-use `/ideas` workspace so the idea → issue → PR pipeline runs without manual scaffolding.

## Problem

New contributors cloning the repo (or creating fresh forks) land in an empty `/ideas` directory. Without a bootstrap command the automation breaks early:

- GitHub Actions workflows fail when the directory is missing or empty.
- Contributors must copy templates by hand, leading to inconsistent cards.
- Validation scripts surface confusing errors instead of actionable guidance.

## Proposal

1. Ship a `pnpm ideas:init` helper that seeds `/ideas` with the canonical templates from `templates/ideas/`.
2. Extend the validation workflow to detect a missing/empty directory and emit a helpful warning instead of hard failure.
3. Update `IDEAS-GUIDE.md` and `CI-STRATEGY.md` with initialization steps and expectations for first-time setup.

## Acceptance Checklist

- [ ] New `pnpm ideas:init` script copies starter templates (`idea-brief`, `idea-unit`, `idea-composition`).
- [ ] GitHub Actions `ideas.yml` validates the directory and emits actionable errors.
- [ ] Guides (`IDEAS-GUIDE.md`, `CI-STRATEGY.md`) updated with initialization instructions.
- [ ] Added regression test or dry-run path proving pipeline handles empty repos.
