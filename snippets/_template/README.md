# TemplateSnippet

One file UX snippet template following Plaincraft architecture standards.

## Overview

Short description of what this snippet solves and why it exists.

## Scaffold

```bash
pnpm run new:snippet TemplateSnippet -- --dry-run
# scaffold_ref: /templates/snippet-template-snippet@v0.1
```

## Architecture

This snippet follows the Plaincraft layered architecture:

- **`useTemplateSnippetController`** - Headless hook with business logic
- **`TemplateSnippetView`** - Default Tailwind-styled view
- **`TemplateSnippet`** - Convenience component (hook + view)
- **`TemplateSnippetHeadless`** - Render-prop component for custom views

## Quick Start

### Default Component

```tsx
import { TemplateSnippet } from "./TemplateSnippet";

function Example() {
  return (
    <TemplateSnippet
      label="Click me"
      onAction={async () => {
        await api.doSomething();
      }}
      max={100}
    />
  );
}
```

### Headless Component (Custom UI)

```tsx
import { TemplateSnippetHeadless } from "./TemplateSnippet";

function CustomExample() {
  return (
    <TemplateSnippetHeadless label="Custom" onAction={handleAction}>
      {(controller) => (
        <div>
          <button onClick={controller.handleAction}>{controller.label}</button>
          {controller.message && <span>{controller.message}</span>}
        </div>
      )}
    </TemplateSnippetHeadless>
  );
}
```

### Direct Hook Usage

```tsx
import { useTemplateSnippetController } from "./TemplateSnippet";

function AdvancedExample() {
  const controller = useTemplateSnippetController({
    label: "Advanced",
    onAction: handleAction,
    max: 50,
  });

  // Build your own UI with controller state
  return <div>{/* Custom implementation */}</div>;
}
```

## Props

### TemplateSnippet Props

| Prop       | Type                          | Default | Description                        |
| ---------- | ----------------------------- | ------- | ---------------------------------- |
| `label`    | `string`                      | -       | Button label text                  |
| `onAction` | `() => void \| Promise<void>` | -       | Callback triggered on button click |
| `max`      | `number`                      | `100`   | Maximum value for input validation |
| `labels`   | `{ loading?: string; ... }`   | -       | Optional label overrides           |

### Controller State (returned by hook)

```tsx
{
  label: string;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  inputRef: React.RefObject<HTMLInputElement>;
  handleAction: () => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
}
```

## Behaviors

- Input enforces a soft max validation
- Button triggers `onAction` callback
- Status messages display feedback
- Keyboard navigation supported (Enter to submit, Escape to cancel)
- Optimistic UI updates with error rollback

## Accessibility

- ✅ Labeled input with proper `aria-label`
- ✅ Hint text via `aria-describedby`
- ✅ Focus rings and keyboard navigation
- ✅ Screen reader announcements for status changes
- ✅ `aria-busy` during async operations
- ✅ Error messages announced with `role="alert"`

## Testing

```bash
# Run unit tests
pnpm test TemplateSnippet

# Run Storybook interaction + docs smoke tests
pnpm storybook:test

# View in Storybook
pnpm storybook

# Run repository guardrails (required before PR)
pnpm guardrails
```

## Examples

See `TemplateSnippet.stories.tsx` for:

- Basic usage
- Interaction tests
- Error handling
- Custom headless views

## 10 Minute Acceptance Test

1. Clone fresh and install dependencies
2. Add a new snippet from template
3. Import Demo into `demo/src/App.tsx`
4. Run dev server: `pnpm dev`
5. Test keyboard-only interaction:
   - Tab to focus button
   - Enter to trigger action
   - Escape to cancel (if applicable)
6. Verify accessibility with screen reader
7. Confirm no TypeScript errors: `pnpm typecheck`
8. Confirm linting passes: `pnpm lint`
9. Confirm tests pass: `pnpm test`
10. Review in Storybook: `pnpm storybook`
11. Run repository guardrails: `pnpm guardrails`

## Migration & Customization

See `ADOPTION.md` for detailed guidance on:

- Integration strategies
- Custom styling
- Advanced patterns
- Troubleshooting

## See Also

- **ADOPTION.md** - Adoption guide and best practices
- **DEVELOPMENT.md** (in `/guides/`) - Architecture standards
- **InlineEditLabel** - Reference implementation

\_Owner: @lane-x
