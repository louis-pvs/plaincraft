# InlineEditLabel

A small, pragmatic inline-edit React component. Single-file, no external dependencies, accessible, optimistic save, and built for fast rollout. Ideal for renaming, short labels, or micro-edits.

## Why this exists

Inline edits reduce friction for tiny tasks. This component gives users a quick, discoverable editing surface while keeping persistence logic outside the view layer.

## Benefits (short)

- Fast inline edits with predictable keyboard behaviors.
- Optimistic save UI and error handling.
- Single-file drop-in, no deps beyond React.
- Accessibility-first: keyboard, focus, and `aria` support.
- Safe rollout: caller controls network and validation.

## Install

No package published yet? Fine. Copy `InlineEditLabel.tsx` into your repo. Or, to add as a local package:

```bash
# copy file into src/components or install as local package by your own tooling
cp InlineEditLabel.tsx src/components/
```

## Quick usage

```tsx
import InlineEditLabel from "./InlineEditLabel";

function Example() {
  const [name, setName] = useState("Click to edit me");

  return (
    <InlineEditLabel
      value={name}
      max={64}
      onSave={async (next) => {
        // domain validation and persistence go here
        // throw new Error("bad word") to test error branch
        await api.updateName(next);
        setName(next);
      }}
    />
  );
}
```

**Demo note:** The file includes a demo mount you can view in a simple Vite or CodeSandbox environment.

## Props

| Prop           |                                      Type |               Default | Description                                                     |
| -------------- | ----------------------------------------: | --------------------: | --------------------------------------------------------------- |
| `value`        |                                  `string` |                  `""` | Current displayed value                                         |
| `onSave`       | `(next: string) => Promise<void> \| void` |           `undefined` | Seamed save callback. Caller handles persistence and validation |
| `max`          |                                  `number` |           `undefined` | Max characters allowed. Component enforces at input layer       |
| `placeholder`  |                                  `string` |          `"Add text"` | Shown when `value` is empty                                     |
| `className`    |                                  `string` |                  `""` | Container classes for styling                                   |
| `data-test-id` |                                  `string` | `"inline-edit-label"` | Test id for selectors                                           |

## Interaction model (explicit)

- Click label or press `Enter`/`Space` to enter edit mode.
- In edit mode: `Enter` saves, `Escape` cancels, `blur` saves (unless canceled).
- When saving: shows spinner; on success shows a brief Saved flash; on failure shows error text and stays editable.

## Accessibility

- Non-edit state exposes the label as a keyboard-focusable element with `role="button"`.
- Edit state uses a native `<input>` with `aria-invalid` and `aria-describedby` for error linking.
- Keyboard-only users can fully operate the component.
- Keep global `aria-busy` if you need to signal app-level loading.

## Acceptance tests (manual, 10 minutes)

1. Mount demo. See label "Click to edit me".
2. Click the label, edit text, press `Enter`. Observe spinner then label update and Saved flash.
3. Edit again and press `Escape`. Edit should cancel.
4. Simulate `onSave` throwing to verify error state persists and message is visible.
5. If `max` is set, try to exceed it and confirm input blocks further input.

## Rollout checklist

1. Add to one non-critical page or feature flag cohort.
2. Ensure `onSave` enforces domain validation and sanitization. Component enforces `max` only.
3. Run acceptance tests and one real user test.
4. Measure success metrics: completion rate, time-to-edit, error rate.
5. Expand to additional pages after pilot.

## Integration notes

- **Seam:** `onSave` is the single integration point. Keep network and domain logic there.
- **Invariants:** component enforces `max`. All other validation belongs to caller.
- **Tests:** write unit tests for Enter/Blur/Escape and save/error flows. Add an integration test that mocks `onSave` latency and failure.

## Development & contributing

- Keep component view-only. Avoid embedding network or domain logic inside.
- If adding features, preserve the current interaction model and keyboard behaviors.
- Add tests that cover the acceptance criteria.

## License

MIT. Do what you want but be responsible about copying company IP into public repos.
