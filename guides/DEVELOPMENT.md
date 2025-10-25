# Plaincraft Snippet Development Guide

## Code Standards for Component Architecture

This guide defines the standard architecture pattern for Plaincraft snippets, based on SOLID principles and the successful InlineEditLabel refactor.

## Architecture Pattern

All Plaincraft snippets should follow this layered architecture:

```
snippet-name/
├── useSnippetNameController.ts      # Headless hook (business logic)
├── useSnippetNameController.spec.ts # Hook unit tests
├── SnippetNameView.tsx              # Default styled view
├── SnippetName.tsx                  # Main export (hook + view)
├── SnippetNameHeadless.tsx          # Render-prop component
├── SnippetName.spec.tsx             # Integration tests
├── SnippetName.stories.tsx          # Storybook examples
├── SnippetName.mdx                  # Storybook documentation
├── README.md                        # API documentation
└── ADOPTION.md                      # User-facing adoption guide
```

## Layer Responsibilities

### 1. Controller Hook (`useSnippetNameController.ts`)

**Purpose:** Pure business logic, state management, and lifecycle handling.

**Responsibilities:**

- State management (local state, derived state)
- Business logic and validation
- Side effects (timers, network calls via callbacks)
- Keyboard and interaction handlers
- Runtime guards and invariant checking

**Must NOT contain:**

- JSX or DOM manipulation
- Framework-specific rendering logic
- Styling or CSS classes
- Direct DOM refs (except for focus management)

**Example Structure:**

```typescript
import { useState, useEffect, useRef, useId } from "react";

export type SnippetControllerProps = {
  // Required props
  value: string;
  onChange: (value: string) => void;

  // Optional customization
  labels?: {
    loading?: string;
    success?: string;
    error?: string;
  };
};

export type SnippetControllerState = {
  // State
  value: string;
  status: "idle" | "loading" | "success" | "error";
  message: string;

  // Refs for consumers
  inputRef: React.RefObject<HTMLInputElement>;
  inputId: string;

  // Actions
  handleAction: () => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  handleBlur: () => void;
};

export function useSnippetNameController(
  props: SnippetControllerProps,
): SnippetControllerState {
  // Runtime guards
  if (import.meta.env.DEV) {
    if (!props.value) {
      console.warn("SnippetName: value is required");
    }
  }

  // State management
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Effects
  useEffect(() => {
    // Lifecycle logic
  }, []);

  // Actions
  const handleAction = () => {
    // Action logic
  };

  return {
    value: props.value,
    status,
    message: "",
    inputRef,
    inputId,
    handleAction,
    handleKeyDown: (e) => {},
    handleBlur: () => {},
  };
}
```

### 2. Default View (`SnippetNameView.tsx`)

**Purpose:** Default styled presentation layer.

**Responsibilities:**

- Rendering JSX structure
- Applying Tailwind CSS classes
- Consuming controller state
- Passing events to controller handlers

**Must NOT contain:**

- Business logic
- State management (beyond local UI state like hover)
- API calls or side effects
- Complex calculations

**Example Structure:**

```typescript
import React from "react";
import type { SnippetControllerState } from "./useSnippetNameController";

export type SnippetNameViewProps = {
  controller: SnippetControllerState;
  ariaLabel?: string;
  className?: string;
};

export function SnippetNameView({
  controller,
  ariaLabel = "Snippet label",
  className,
}: SnippetNameViewProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={controller.inputRef}
        id={controller.inputId}
        value={controller.value}
        onChange={(e) => controller.handleChange(e.target.value)}
        onKeyDown={controller.handleKeyDown}
        onBlur={controller.handleBlur}
        aria-label={ariaLabel}
        className="w-full rounded-md border border-slate-300 px-3 py-2"
      />
      {controller.message && (
        <div className="text-sm text-slate-600">{controller.message}</div>
      )}
    </div>
  );
}
```

### 3. Main Component (`SnippetName.tsx`)

**Purpose:** Convenience wrapper combining hook and default view.

**Responsibilities:**

- Composing hook + view
- Exposing simplified API
- Maintaining backward compatibility

**Example Structure:**

```typescript
import React from "react";
import { useSnippetNameController } from "./useSnippetNameController";
import { SnippetNameView } from "./SnippetNameView";

export type SnippetNameProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  labels?: {
    loading?: string;
    success?: string;
    error?: string;
  };
};

export function SnippetName(props: SnippetNameProps) {
  const controller = useSnippetNameController({
    value: props.value,
    onChange: props.onChange,
    labels: props.labels,
  });

  return (
    <SnippetNameView
      controller={controller}
      ariaLabel={props.ariaLabel}
    />
  );
}
```

### 4. Headless Component (`SnippetNameHeadless.tsx`)

**Purpose:** Render-prop API for custom views.

**Example Structure:**

```typescript
import React from "react";
import {
  useSnippetNameController,
  type SnippetControllerProps,
  type SnippetControllerState,
} from "./useSnippetNameController";

export type SnippetNameHeadlessProps = SnippetControllerProps & {
  children: (controller: SnippetControllerState) => React.ReactNode;
};

export function SnippetNameHeadless({
  children,
  ...controllerProps
}: SnippetNameHeadlessProps) {
  const controller = useSnippetNameController(controllerProps);
  return <>{children(controller)}</>;
}
```

## Testing Strategy

### Controller Tests (`useSnippetNameController.spec.ts`)

Test the hook in isolation using React's test utilities:

```typescript
import React, { act } from "react";
import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { useSnippetNameController } from "./useSnippetNameController";

describe("useSnippetNameController", () => {
  it("initializes with correct state", () => {
    let controllerState;

    function TestComponent() {
      controllerState = useSnippetNameController({
        value: "test",
        onChange: vi.fn(),
      });
      return null;
    }

    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(TestComponent));
    });

    expect(controllerState!.value).toBe("test");
    expect(controllerState!.status).toBe("idle");

    act(() => root.unmount());
    container.remove();
  });

  // More tests...
});
```

### Integration Tests (`SnippetName.spec.tsx`)

Test the full component integration:

```typescript
import React, { act } from "react";
import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { SnippetName } from "./SnippetName";

describe("SnippetName", () => {
  it("renders and handles interaction", () => {
    const onChange = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        React.createElement(SnippetName, {
          value: "test",
          onChange,
        }),
      );
    });

    const input = container.querySelector("input");
    expect(input).not.toBeNull();
    expect(input!.value).toBe("test");

    act(() => root.unmount());
    container.remove();
  });
});
```

### Storybook Stories (`SnippetName.stories.tsx`)

Provide interactive examples and test scenarios:

```typescript
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within, userEvent } from "storybook/test";
import { SnippetName, SnippetNameHeadless } from "./SnippetName";

const meta: Meta<typeof SnippetName> = {
  title: "Snippets/SnippetName",
  component: SnippetName,
  args: {
    value: "Default value",
    onChange: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof SnippetName>;

export const Basic: Story = {};

export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "New value");
    await expect(input).toHaveValue("New value");
  },
};

export const HeadlessCustom: Story = {
  render: (args) => (
    <SnippetNameHeadless {...args}>
      {(controller) => (
        <div className="custom-styling">
          <input
            ref={controller.inputRef}
            value={controller.value}
            onChange={(e) => controller.handleChange(e.target.value)}
          />
        </div>
      )}
    </SnippetNameHeadless>
  ),
};
```

## SOLID Principles in Practice

### Single Responsibility Principle (SRP)

- **Controller:** State management and business logic only
- **View:** Presentation and styling only
- **Main Component:** Composition only

### Open/Closed Principle (OCP)

- Open for extension via render props and custom views
- Closed for modification via stable controller contract

### Liskov Substitution Principle (LSP)

- Any view implementing the controller interface can replace the default
- Controller state contract is well-typed and predictable

### Interface Segregation Principle (ISP)

- Controller exposes minimal, focused interface
- Views depend only on what they use
- No forced dependencies on unused features

### Dependency Inversion Principle (DIP)

- High-level policy (controller) doesn't depend on low-level details (view)
- Both depend on abstractions (TypeScript interfaces)

## Documentation Requirements

### README.md

Must include:

1. **Overview** - What the component does and why
2. **Quick Start** - Minimal working example
3. **API Reference** - All props, types, and exports
4. **Examples** - Common use cases
5. **Architecture** - Brief explanation of layers
6. **Accessibility** - Keyboard support and ARIA details

### ADOPTION.md

Must include:

1. **Integration Options** - Default, headless, hook-only
2. **Adoption Checklist** - Step-by-step rollout guide
3. **Best Practices** - Do's and don'ts
4. **Troubleshooting** - Common issues and solutions
5. **Migration Guide** - How to upgrade from legacy code

### Storybook MDX

Must include:

1. **Component description**
2. **Interactive examples**
3. **Prop documentation** (auto-generated)
4. **Usage guidelines**

## TypeScript Standards

### Export Types

```typescript
// Always export prop types
export type SnippetNameProps = {
  /* ... */
};

// Export controller types for consumers
export type SnippetControllerState = {
  /* ... */
};
export type SnippetControllerProps = {
  /* ... */
};
```

### Use Type Over Interface

```typescript
// ✅ Good
export type Props = {
  value: string;
};

// ❌ Avoid
export interface Props {
  value: string;
}
```

### Strict Null Checking

```typescript
// Use non-null assertion only when certain
expect(controllerState!.value).toBe("test");

// Use optional chaining for safety
const value = controller?.value ?? "default";
```

## Naming Conventions

### Files

- `useComponentNameController.ts` - Hook
- `ComponentNameView.tsx` - Default view
- `ComponentName.tsx` - Main export
- `ComponentNameHeadless.tsx` - Render-prop component

### Types

- `ComponentNameProps` - Main component props
- `ComponentControllerProps` - Hook props
- `ComponentControllerState` - Hook return type
- `ComponentNameViewProps` - View component props

### Functions/Variables

- `handleAction` - Event handlers
- `isCondition` - Boolean flags
- `itemCount` - Derived values

## Accessibility Checklist

Every snippet must:

- ✅ Support keyboard navigation
- ✅ Include proper ARIA attributes
- ✅ Manage focus appropriately
- ✅ Announce state changes to screen readers
- ✅ Provide meaningful labels
- ✅ Use semantic HTML
- ✅ Support high contrast mode
- ✅ Scale with text zoom

## Performance Considerations

- ✅ Minimize re-renders with proper dependency arrays
- ✅ Use `useCallback` for stable references
- ✅ Avoid inline function creation in render
- ✅ Debounce expensive operations
- ✅ Clean up effects and timers

## Migration Checklist

When refactoring an existing snippet:

1. ☐ Extract business logic into controller hook
2. ☐ Create comprehensive hook tests
3. ☐ Extract view component with current styling
4. ☐ Update main component to use hook + view
5. ☐ Create headless export
6. ☐ Add Storybook examples (basic, interaction, headless)
7. ☐ Update README with new architecture
8. ☐ Create ADOPTION.md guide
9. ☐ Verify all existing tests pass
10. ☐ Add hook-specific tests
11. ☐ Update component contracts documentation
12. ☐ Ensure backward compatibility
13. ☐ Run full test suite (`pnpm test && pnpm lint && pnpm typecheck`)
14. ☐ Build Storybook (`pnpm build:storybook`)

## Code Review Checklist

Before merging a new snippet or refactor:

### Architecture

- ☐ Business logic in controller hook
- ☐ Presentation in view component
- ☐ Headless export available
- ☐ All layers properly separated

### Testing

- ☐ Hook tests cover all scenarios
- ☐ Integration tests verify composition
- ☐ Storybook interaction tests pass
- ☐ Accessibility manually verified

### Documentation

- ☐ README.md complete with examples
- ☐ ADOPTION.md provides clear guidance
- ☐ Storybook MDX documents usage
- ☐ TypeScript types fully exported

### Quality

- ☐ TypeScript compiles without errors
- ☐ ESLint passes without warnings
- ☐ All tests passing
- ☐ Storybook builds successfully

### Performance

- ☐ No unnecessary re-renders
- ☐ Effects properly cleaned up
- ☐ Callbacks memoized when needed

## Examples

Reference the InlineEditLabel implementation as the gold standard:

- `/snippets/InlineEditLabel/` - Complete example
- Well-documented, tested, and following all standards
- Use as template for new snippets

## Questions?

For clarification on these standards:

1. Review InlineEditLabel implementation
2. Check existing snippet examples
3. Refer to SOLID principles documentation
4. Discuss with team before deviating from standards
