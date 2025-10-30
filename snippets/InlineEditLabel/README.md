# Inline Edit Label

## When to use

- Ship inline renaming without rebuilding accessibility or optimistic save flows.
- Reuse the proven Storybook narrative and Playbook rationale for consistency.
- Keep UX changes fast by swapping views while the headless controller stays stable.

## Scaffold

```bash
pnpm run new:snippet InlineEditLabel -- --dry-run
# scaffold_ref: /templates/snippet-inline-edit-label@v0.1
```

## Wire

- Import `InlineEditLabel` from `/snippets/InlineEditLabel/InlineEditLabel`.
- Provide `value`, `onSave`, and `ariaLabel`; the controller handles focus + keys.
- Switch to `InlineEditLabelHeadless` when design needs a custom render function.

## Test

```bash
pnpm test --filter InlineEditLabel
```

## Rollback

```bash
git restore snippets/InlineEditLabel
```

## Links

- USAGE: /templates/snippet-inline-edit-label/USAGE.md
- Storybook: /storybook/?path=/docs/patterns-inline-edit--docs
- Playbook: /playbook/patterns/inline-edit-label.html

_Owner: @lane-c_
