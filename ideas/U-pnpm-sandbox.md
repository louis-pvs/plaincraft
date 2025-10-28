# U-pnpm-sandbox

- **Lane**: C
- **Linked Composition**: `ARCH-pnpm-in-sandbox`
- **Contracts**: Only work on your own C lane

## Contracts:

- Only work on your own C lane

## Props + Shape

- `scripts/ops/create-worktree-pr.mjs` (script, required) — bootstraps worktree `node_modules` from the primary checkout so the vendored `pnpm` binary is present offline.
- `scripts/ops/post-checkout.mjs` (script, required) — honors `PLAINCRAFT_BOOTSTRAPPED_NODE_MODULES` to skip installs that would hit the network.

## Behaviors

- Worktree creation copies the source checkout's `node_modules` before running setup, exposing `.bin/pnpm` without requiring a download.
- Post-checkout setup skips `pnpm install` when dependencies are bootstrapped, avoiding network calls that fail inside the sandbox.

## Accessibility

- CLI workflow; focus/ARIA not applicable. Ensure terminal logs clearly note when bootstrap skips dependency installation.

## Findings

- Sandbox session showed new worktrees lacked `node_modules`, leaving `pnpm` unavailable and blocking scripts.
- Copying dependencies ahead of post-checkout exposed the vendored pnpm binary and satisfied CLI tooling without network access.
- Skipping installs after bootstrap prevented accidental `pnpm` network requests while still logging guidance for manual recovery.

## Acceptance Checklist

- [x] developer able to access pnpm in sandbox while working on worktree
- [x] Documentation updated.
- [x] Write out finding notes from usability testing in this doc.
