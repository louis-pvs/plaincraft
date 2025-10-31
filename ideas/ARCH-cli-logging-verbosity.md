# ARCH-cli-logging-verbosity

Lane: C (DevOps & Automation)
Status: Draft

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** cli, guardrails, observability

## Purpose

Provide a consistent CLI logging experience: quiet, single-line output by default, with an opt-in `--verbose` flag for detailed logs across all automation scripts.

## Problem

Current scripts emit varied log formats (multi-line info, debug chatter, dry-run tables). Impact:

- Developers see noisy output even for simple `--yes` runs, making it harder to spot failures.
- Automation logs (CI guardrails) become verbose, hiding actionable messages.
- No unified flag to toggle a more detailed view when debugging.

## Proposal

1. Extend `scripts/_lib/core.mjs::Logger` to honour a shared `--verbose` or `LOG_LEVEL=debug` flag, defaulting to a concise single-line summary for `info` level.
2. Update CLI templates and scripts to pipe all log calls through the shared logger (no ad-hoc `console.log`).
3. Ensure guardrail jobs run with clean mode (`info` only), while local debugging respects `--verbose`.
4. Document the behaviour in the script template README and Playbook guardrail guide.

## Acceptance Checklist

- [ ] Logger honours `--verbose` (or `--log-level debug`) across scripts while `info` level remains single-line per action.
- [ ] All lifecycle and guardrail scripts adopt the shared logging pattern (no mixed manual `console.log`).
- [ ] Script template README describes the verbosity contract and demonstrates usage.
- [ ] Storybook/Playbook guardrail docs reference the clean default and verbose option.
- [ ] CI guardrails confirmed to emit concise output while retaining debugging hooks when verbose.

## Status

- 2025-11-03 - Draft: captured need for unified logging verbosity flag across CLI scripts.

<!-- prettier-ignore -->
_Owner: @lane-c
