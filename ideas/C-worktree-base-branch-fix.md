# C-worktree-base-branch-fix

## Lane

Lane: C  
Linked Composition: `ARCH-ci-cd-implementation`

## Metric Hypothesis

- Worktree automation succeeds across sandboxes, reducing reported setup failures to 0 in weekly CI smoke runs.
- Base-branch selection logs appear in ≥90% of new worktree logs captured during dry runs.
- No new `spawn git ENOENT` errors reported after rollout.

## Units In Scope

- `scripts/_lib/git.mjs` — worktree helper
- `scripts/ops/create-worktree-pr.mjs` — worktree orchestration script

## Contracts

- Worktree automation must succeed from any repo checkout without manual intervention.
- Git commands run by scripts must execute from the repository root and respect the requested base branch.

## Props + Shape

- `scripts/_lib/git.mjs` — extends `createWorktree()` to accept an explicit base branch and ensures the git invocation runs from the repository root.
- `scripts/ops/create-worktree-pr.mjs` — passes `cwd: <repoRoot>` and forwards the requested base branch when creating the worktree.

## Implementation

- Update `createWorktree(path, branch, options)` to accept an options object with `{ cwd, baseBranch }`, defaulting `cwd` to `process.cwd()`, and include the base branch when building the git command.
- Adjust every call site (currently `create-worktree-pr.mjs`) to provide `{ cwd: repoRoot, baseBranch: args.baseBranch }`.
- Add a guardrail log when `baseBranch` differs from the default to confirm the branch source in script output.

## Behaviors

- Worktree creation always shells out to git using the repo root as `cwd`, eliminating `spawn git ENOENT` errors.
- Supplying `--base develop` (or any other branch) creates the worktree from that base, mirroring manual `git worktree add` behavior.
- Script logs clearly note the resolved base branch to aid debugging in sandboxed environments.
- Husky hooks and lint-staged configs call project scripts or local binaries so they remain agnostic to the package manager and keep sandbox bootstrap steps deterministic.

## Accessibility

- CLI flow only; ensure terminal output surfaces the base branch confirmation and error corrections for screen readers via standard logging.

## Usability Testing

- Run `node scripts/ops/create-worktree-pr.mjs <issue> --yes --force --base main` in the sandbox: worktree succeeds, no ENOENT, log shows `Base branch: main`.
- Run the same command with `--base develop` after checking out `develop` locally; verify the worktree log notes `Base branch: develop` and `git worktree list` shows the new branch tracking `develop`.

## Findings

- Current implementation passes the base branch string as the `cwd` parameter, so git executes with `cwd: "main"`, which does not exist in sandboxed worktrees, causing `spawn git ENOENT`.
- Because the base branch is never forwarded to `git worktree add`, even successful executions branch off the current HEAD instead of the intended base, risking regressions in multi-branch workflows.
- Sandboxed checkouts commonly start without shell profile exports, so global `pnpm` is missing from `PATH`; standardizing on Corepack activation and hook scripts that avoid direct `pnpm` calls keeps the environment stable enough for worktree automation to run consistently across fresh VMs.

## Guardrails

- Extend `scripts/checks/policy-lint.mjs` (or add a dedicated lint) to fail CI if `pnpm` appears inside `.husky/` or the `prepare` script to prevent regressions.
- Add a bootstrap check (e.g. `pnpm guardrails`) that runs `corepack prepare pnpm@<version>` when `pnpm -v` mismatches, enforcing the Corepack workflow locally and in CI.
- Document the hook expectations in `docs/scripts-reference.md` and the developer onboarding guide so contributors know to modify package scripts rather than Husky/Lint-Staged directly.

## Invariants

- `package.json:packageManager` and the Corepack activation script reference the same pnpm version so every environment resolves the identical toolchain.
- Husky hooks and lint-staged configs invoke project scripts or binaries from `node_modules/.bin`; direct calls to `pnpm` or other globals are prohibited.
- `prepare` remains idempotent and package-manager agnostic (Husky install only), guaranteeing it succeeds in fresh sandboxes, CI, and contributor machines alike.

## Acceptance Checklist

- [ ] `node scripts/ops/create-worktree-pr.mjs <issue> --dry-run` reports the correct base branch without errors.
- [ ] `node scripts/ops/create-worktree-pr.mjs <issue> --yes --force` succeeds from a development worktree and creates a branch with the expected upstream base.
- [ ] Documentation (`docs/scripts-reference.md`) updated to note the clarified base-branch handling once the fix ships.
