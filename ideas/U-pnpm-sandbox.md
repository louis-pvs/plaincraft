# U-pnpm-sandbox

## Lane

Lane: C  
Linked Composition: `ARCH-pnpm-in-sandbox`

## Contracts

- Only work on your own C lane

## Props + Shape

- `scripts/ops/create-worktree-pr.mjs` (script, required) — bootstraps worktree `node_modules` from the primary checkout so the vendored `pnpm` binary is present offline.
- `scripts/ops/post-checkout.mjs` (script, required) — honors `PLAINCRAFT_BOOTSTRAPPED_NODE_MODULES` to skip installs that would hit the network.

## Implementation

- `scripts/ops/create-worktree-pr.mjs` copies the source checkout `node_modules` into the fresh worktree before post-checkout runs so `.bin/pnpm` is immediately available offline.
- Successful bootstraps invoke `scripts/ops/post-checkout.mjs` with `PLAINCRAFT_BOOTSTRAPPED_NODE_MODULES=1`, letting setup skip `pnpm install` while still surfacing recovery guidance when the copy fails.

## Behaviors

- Worktree creation copies the source checkout's `node_modules` before running setup, exposing `.bin/pnpm` without requiring a download.
- Post-checkout setup skips `pnpm install` when dependencies are bootstrapped, avoiding network calls that fail inside the sandbox.

## Accessibility

- CLI workflow; focus/ARIA not applicable. Ensure terminal logs clearly note when bootstrap skips dependency installation.

## Usability Testing

- `PLAINCRAFT_BOOTSTRAPPED_NODE_MODULES=1 node scripts/ops/post-checkout.mjs --dry-run` prints the skip banner, confirming the hook honours the bootstrap flag:

```text
[INFO] Skipping dependency installation (dependencies bootstrapped from source worktree)
```

- `node_modules/.bin/pnpm --version` succeeds after bootstrap, confirming the vendored binary is exposed in the worktree.

## Findings

- Sandbox session showed new worktrees lacked `node_modules`, leaving `pnpm` unavailable and blocking scripts.
- Copying dependencies ahead of post-checkout exposed the vendored pnpm binary and satisfied CLI tooling without network access; executing the dry-run hook highlights the skip banner for clarity.
- Skipping installs after bootstrap prevented accidental `pnpm` network requests while still logging guidance for manual recovery, and manual `pnpm --version` checks validated the binary remains executable.

## Acceptance Checklist

- [x] Verify by running `pnpm docs:lint --filter ideas/U-pnpm-sandbox.md`
- [x] Developer able to access pnpm in sandbox while working on worktree
- [x] Documentation updated
- [x] Write out finding notes from usability testing in this doc
