---
id: pattern-inline-edit-label
type: ui-component
owner: "@lane-a"
lane: A
version: 1.0.0
created: 2025-11-02
ttl_days: 180
last_verified: 2025-11-02
storybook_path: /docs/snippets-inlineeditlabel--docs
prev: /patterns/
next: /patterns/ideas-source-of-truth
---

# Inline Edit Label Pattern

::: tip View Interactive Demo
See live examples and interaction tests in [Storybook](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/snippets-inlineeditlabel--docs)
:::

## Component README

The content below is imported directly from the component source to ensure documentation stays in sync with implementation.

---

A small, pragmatic inline-edit React component. Single-file, no external dependencies, accessible, optimistic save, and built for fast rollout. Now with **headless architecture** for maximum flexibility.

## Why this exists

Inline edits reduce friction for tiny tasks. This component gives users a quick, discoverable editing surface while keeping persistence logic outside the view layer. The refactored architecture separates controller logic from presentation, allowing you to use the default Tailwind UI or bring your own design system.

## Benefits

- Fast inline edits with predictable keyboard behaviors
- Optimistic save UI and error handling
- **Headless architecture:** reusable controller hook with pluggable views
- Single-file drop-in, no deps beyond React
- Accessibility-first: keyboard, focus, and ARIA support
- Safe rollout: caller controls network and validation

## Pilot Rationale (Lane B)

This pattern was selected as the first registry-driven docs pilot because it is a self-contained UI unit with full asset coverage already in place: implementation source, a rich Storybook suite (success, error, empty, interaction, cancel, retry flows), and a Playbook entry that stays lightweight. Risk is low: no external dependencies, a narrow surface area, and clear keyboard/ARIA behaviors make correctness easy to validate. It provides measurable signals for the governance experiment—storybook render time, build inclusion cost, and doc gate pass/fail—without conflating with complex data flows. The recent headless refactor gives us a clean separation of controller logic and view layer, ideal for demonstrating projection integrity (do not hand-edit generated docs) while letting teams explore alternative presentations safely. Its small footprint means any CI performance regression beyond the +90s tripwire is almost certainly systemic (registry/gates) rather than domain noise. Success here establishes the handoff rhythm (ADR → Lane A assets → Lane B narrative → Lane C enforcement) and produces a repeatable template for subsequent patterns.

## Architecture

The component is split into three layers:

1. **`useInlineEditLabelController`** - Headless hook managing state, lifecycle, and keyboard interactions
2. **`InlineEditLabelView`** - Default Tailwind-styled view consuming the controller
3. **`InlineEditLabel`** - Convenience component combining hook + default view

This separation follows SOLID principles:

- **Single Responsibility:** Controller handles logic, View handles presentation
- **Open/Closed:** Extend with custom views without modifying core logic
- **Dependency Inversion:** Controller depends on abstract render contract, not concrete DOM

## Installation

Copy the component files into your project:

```bash
cp snippets/InlineEditLabel/*.tsx src/components/
```

## Usage Examples

### Default Component (Quick Start)

```tsx
import { InlineEditLabel } from "./InlineEditLabel";
import { useState } from "react";

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

## API Reference

### Props

| Prop        | Type                              | Default        | Description                         |
| ----------- | --------------------------------- | -------------- | ----------------------------------- |
| `value`     | `string`                          | required       | Current displayed value             |
| `maxLength` | `number`                          | required       | Max characters allowed              |
| `onSave`    | `(next: string) => Promise<void>` | required       | Save callback                       |
| `ariaLabel` | `string`                          | `"Edit label"` | Accessible label for screen readers |
| `labels`    | `LabelsObject`                    | see below      | Optional label overrides for states |

### Labels Object

```tsx
{
  saving?: string;      // Default: "Saving…"
  success?: string;     // Default: "Saved"
  error?: string;       // Default: "Save failed. Try again."
  discarded?: string;   // Default: "Changes discarded."
}
```

## Interaction Model

- Click label or press `Enter`/`Space` to enter edit mode
- In edit mode: `Enter` saves, `Escape` cancels, blur saves
- Saving: shows spinner → success flash → returns to display mode
- Error: shows error message and stays editable

## Accessibility

- Non-edit state: keyboard-focusable with `role="button"`
- Edit state: native `<input>` with `aria-invalid` and `aria-describedby`
- Full keyboard navigation support
- Screen reader announcements for state changes

## Extending with Custom Views

The headless architecture integrates easily with any design system:

```tsx
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

## Further Reading

- [Full API Documentation](https://github.com/louis-pvs/plaincraft/tree/main/snippets/InlineEditLabel)
- [Storybook Examples](https://louis-pvs.github.io/plaincraft/storybook/?path=/docs/snippets-inlineeditlabel--docs)
- [Architecture Guide](/architecture)
