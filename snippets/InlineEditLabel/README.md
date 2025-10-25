# InlineEditLabel

A small, pragmatic inline-edit React component. Single-file, no external dependencies, accessible, optimistic save, and built for fast rollout. Now with **headless architecture** for maximum flexibility.

## Why this exists

Inline edits reduce friction for tiny tasks. This component gives users a quick, discoverable editing surface while keeping persistence logic outside the view layer. The refactored architecture separates controller logic from presentation, allowing you to use the default Tailwind UI or bring your own design system.

## Benefits (short)

- Fast inline edits with predictable keyboard behaviors.
- Optimistic save UI and error handling.
- **Headless architecture:** reusable controller hook with pluggable views.
- Single-file drop-in, no deps beyond React.
- Accessibility-first: keyboard, focus, and `aria` support.
- Safe rollout: caller controls network and validation.

## Architecture

The component is split into three layers:

1. **`useInlineEditLabelController`** - Headless hook managing state, lifecycle, and keyboard interactions
2. **`InlineEditLabelView`** - Default Tailwind-styled view consuming the controller
3. **`InlineEditLabel`** - Convenience component combining hook + default view

This separation follows SOLID principles:

- **Single Responsibility:** Controller handles logic, View handles presentation
- **Open/Closed:** Extend with custom views without modifying core logic
- **Dependency Inversion:** Controller depends on abstract render contract, not concrete DOM

## Install

No package published yet? Fine. Copy the files into your repo:

```bash
cp InlineEditLabel*.tsx src/components/
```

## Quick usage

### Default Component (Recommended for Quick Start)

```tsx
import { InlineEditLabel } from "./InlineEditLabel";

function Example() {
  const [name, setName] = useState("Click to edit me");

  return (
    <InlineEditLabel
      value={name}
      maxLength={64}
      onSave={async (next) => {
        await api.updateName(next);
        setName(next);
      }}
      ariaLabel="Edit name"
    />
  );
}
```

### Headless Component (Custom UI)

Use `InlineEditLabelHeadless` when you need full control over the presentation:

```tsx
import { InlineEditLabelHeadless } from "./InlineEditLabel";

function CustomExample() {
  const [name, setName] = useState("Custom styled");

  return (
    <InlineEditLabelHeadless
      value={name}
      maxLength={64}
      onSave={async (next) => {
        await api.updateName(next);
        setName(next);
      }}
      labels={{
        saving: "⏳ Saving...",
        success: "✅ Done!",
        error: "❌ Error",
        discarded: "🚫 Cancelled",
      }}
    >
      {(controller) => (
        <div>
          {!controller.isEditing ? (
            <button onClick={controller.beginEditing}>
              {controller.displayValue}
            </button>
          ) : (
            <input
              ref={controller.inputRef}
              value={controller.draft}
              onChange={(e) => controller.updateDraft(e.target.value)}
              onBlur={controller.handleBlur}
              onKeyDown={controller.handleInputKeyDown}
            />
          )}
          {controller.message && <div>{controller.message}</div>}
        </div>
      )}
    </InlineEditLabelHeadless>
  );
}
```

### Direct Hook Usage (Advanced)

For even more control, use the hook directly:

```tsx
import {
  useInlineEditLabelController,
  InlineEditLabelView,
} from "./InlineEditLabel";

function AdvancedExample() {
  const controller = useInlineEditLabelController({
    value: "Team charter",
    maxLength: 32,
    onSave: async (next) => await api.save(next),
  });

  // Use the default view
  return <InlineEditLabelView controller={controller} maxLength={32} />;

  // Or build your own completely custom UI
}
```

## Props

### InlineEditLabel Props

| Prop           | Type                                      | Default          | Description                                                     |
| -------------- | ----------------------------------------- | ---------------- | --------------------------------------------------------------- |
| `value`        | `string`                                  | required         | Current displayed value                                         |
| `maxLength`    | `number`                                  | required         | Max characters allowed. Component enforces at input layer       |
| `onSave`       | `(next: string) => Promise<void> \| void` | required         | Seamed save callback. Caller handles persistence and validation |
| `ariaLabel`    | `string`                                  | `"Edit label"`   | Accessible label for screen readers                             |
| `labels`       | `LabelsObject`                            | see below        | Optional label overrides for different states                   |
| `savingLabel`  | `string` (deprecated)                     | `"Saving…"`      | Use `labels.saving` instead                                     |
| `successLabel` | `string` (deprecated)                     | `"Saved"`        | Use `labels.success` instead                                    |
| `errorLabel`   | `string` (deprecated)                     | `"Save failed…"` | Use `labels.error` instead                                      |

### Labels Object

```tsx
{
  saving?: string;      // Default: "Saving…"
  success?: string;     // Default: "Saved"
  error?: string;       // Default: "Save failed. Try again."
  discarded?: string;   // Default: "Changes discarded."
}
```

### Controller State (returned by hook)

The `useInlineEditLabelController` hook returns:

```tsx
{
  // State
  displayValue: string;
  draft: string;
  isEditing: boolean;
  status: "idle" | "saving" | "success" | "error";
  message: string;
  messageTone: "info" | "success" | "error";

  // Refs
  inputRef: React.RefObject<HTMLInputElement>;
  inputId: string;
  inputProps: {
    id: string;
    value: string;
    maxLength: number;
    disabled: boolean;
    "aria-busy": boolean;
    "aria-describedby": string;
  };

  // Actions
  beginEditing: () => void;
  saveDraft: () => Promise<void>;
  cancelEditing: () => void;
  updateDraft: (value: string) => void;
  handleDisplayKeyDown: (event: React.KeyboardEvent) => void;
  handleInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
}
```

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
- **Invariants:** component enforces `maxLength`. All other validation belongs to caller.
- **Tests:** write unit tests for Enter/Blur/Escape and save/error flows. Add an integration test that mocks `onSave` latency and failure.
- **Extension:** Use `InlineEditLabelHeadless` or the hook directly to integrate with your design system (Material-UI, Chakra, etc.)

## Extending with Custom Views

The headless architecture makes it easy to integrate with any design system:

```tsx
// Example: Chakra UI integration
import { Input, Button, Box } from "@chakra-ui/react";
import { useInlineEditLabelController } from "./InlineEditLabel";

function ChakraInlineEdit({ value, maxLength, onSave }) {
  const controller = useInlineEditLabelController({
    value,
    maxLength,
    onSave,
  });

  return (
    <Box>
      {controller.isEditing ? (
        <Input
          ref={controller.inputRef}
          value={controller.draft}
          onChange={(e) => controller.updateDraft(e.target.value)}
          onBlur={controller.handleBlur}
          onKeyDown={controller.handleInputKeyDown}
        />
      ) : (
        <Button onClick={controller.beginEditing}>
          {controller.displayValue}
        </Button>
      )}
    </Box>
  );
}
```

## Development & contributing

- Keep controller logic pure and testable.
- View components should only handle presentation.
- If adding features, preserve the current interaction model and keyboard behaviors.
- All new behavior should have corresponding tests.
- Add tests that cover the acceptance criteria.

## License

MIT. Do what you want but be responsible about copying company IP into public repos.
