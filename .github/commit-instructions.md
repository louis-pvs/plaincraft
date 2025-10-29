# Commit Message Instructions

This repository enforces a compact ticket-first commit format so automation can map commits → tickets → changelog entries without human cleanup. When Copilot (or any agent) proposes a commit message, mirror these rules exactly.

## Required Header Format

```
[ID] type(scope): subject
```

- **ID** must be one of: `ARCH-<number>`, `U-<number>`, `C-<number>`, `B-<number>`, `PB-<number>`.
- **type** is lower-case Conventional Commit atom: `feat`, `fix`, `perf`, `refactor`, `chore`, `docs`, `test`, `build`, `ci`, or `revert`.
- **scope** is optional; if present use kebab-case (letters/numbers/hyphen only).
- **subject** is imperative, ≤ 72 characters, no trailing period, no emojis.
- Entire header must be ≤ 100 characters.

### Examples

```
[ARCH-123] fix(parser): handle empty input arrays
[U-58] feat(inline-edit): add escape to cancel
[C-7] chore(ci): raise timeout for sb-test
```

### Invalid Patterns

- Missing ticket (`feat: add feature`).
- Non-numeric or slug IDs (`[ARCH-changelog-rewrite] chore:`).
- Capitalized types (`[ARCH-10] Fix:`) or unsupported types (`style`, `wip`).
- Subjects longer than 72 characters or ending with punctuation.

## ID Resolution Order

1. Prefer the ticket encoded in the current branch name (first `([A-Z]+-\d+)`).
2. Otherwise, use the primary ticket for this work item and request confirmation if ambiguous.

## Body Guidance

- Keep bodies optional unless referencing secondary tickets: `Refs: ARCH-456, U-99`.
- For `revert:` commits include the original header in the body per git convention.

## Hooks & CI

- `prepare-commit-msg` will prefill `[ID] type(scope): ` based on the branch ticket.
- `commit-msg` hook and CI job (`scripts/ops/validate-commit-headers.mjs`) reject anything that violates the rules above.

## Quick Checklist for Copilot

- [ ] Header starts with `[ARCH-#/U-#/C-#/B-#/PB-#]`.
- [ ] Type is valid, lower-case, optionally followed by `(scope)`.
- [ ] Subject is imperative, ≤ 72 chars, no trailing period.
- [ ] Primary ticket matches current branch when available.
- [ ] Additional ticket references live in the body (`Refs:` lines).
