# InlineEditLabel Template — Usage

## 1. Scaffold

```bash
pnpm run new:snippet InlineEditLabel --yes
```

- Adds controller, default view, headless renderer, tests, stories, Autodocs MDX, and README.
- Uses the shared snippet template to guarantee lane guardrails.

## 2. Wire into your feature

1. Import `{ InlineEditLabel }` wherever you need the inline edit pattern.
2. Provide a controlled string value and async `onSave` to handle persistence.
3. Set `ariaLabel` to describe the editable field for assistive tech.

```tsx
import { InlineEditLabel } from "./InlineEditLabel";

function Example({ name, onRename }) {
  return (
    <InlineEditLabel
      value={name}
      maxLength={64}
      ariaLabel="Edit project name"
      onSave={onRename}
    />
  );
}
```

## 3. Validate

- `pnpm storybook:test` — runs Interaction, Cancel, and Retry stories.
- `pnpm test -- InlineEditLabel` — unit tests for controller and view seams.
- `pnpm typecheck` — ensures consuming surface stays type-safe.

## 4. Rollout

- Start with a single low-risk surface or behind a flag.
- Monitor saved vs. error rates before broad deployment.
- Use the headless export if you need to align with an existing design system.
