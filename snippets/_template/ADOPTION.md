# TemplateSnippet Adoption Guide

[Replace "TemplateSnippet" with your actual snippet name throughout this document]

## Overview

Brief description of what this snippet does and the problem it solves. Explain why teams should adopt it and what value it provides.

## Integration Options

You have three ways to integrate this snippet:

### 1. Default Component (Fastest)

Use the pre-styled component for quickest integration:

```tsx
import { TemplateSnippet } from "./TemplateSnippet";

function MyComponent() {
  return (
    <TemplateSnippet
      label="Action Label"
      onAction={async () => {
        // Your logic here
      }}
    />
  );
}
```

**When to use:**

- You're happy with the default Tailwind styling
- You need quick integration
- Standard behavior meets your needs

### 2. Headless Component (Custom UI)

Use the render-prop API for custom styling:

```tsx
import { TemplateSnippetHeadless } from "./TemplateSnippet";

function CustomComponent() {
  return (
    <TemplateSnippetHeadless label="Custom" onAction={handleAction}>
      {(controller) => (
        <div className="your-custom-classes">
          <button onClick={controller.handleAction}>{controller.label}</button>
          {controller.message && (
            <div className="your-message-style">{controller.message}</div>
          )}
        </div>
      )}
    </TemplateSnippetHeadless>
  );
}
```

**When to use:**

- You have a custom design system
- You need specialized UI behavior
- You want full control over markup and styling

### 3. Hook Only (Maximum Control)

Use the controller hook directly:

```tsx
import { useTemplateSnippetController } from "./TemplateSnippet";

function AdvancedComponent() {
  const controller = useTemplateSnippetController({
    label: "Advanced",
    onAction: handleAction,
  });

  // Build completely custom implementation
  return (
    <YourCustomComponent
      onClick={controller.handleAction}
      status={controller.status}
    />
  );
}
```

**When to use:**

- You're building a non-React wrapper
- You need to compose with other hooks
- You require maximum flexibility

## Adoption Checklist

### 1. Identify Use Cases

List where this snippet will be used:

- [ ] Screen/Page A
- [ ] Screen/Page B
- [ ] Feature X

### 2. Choose Integration Mode

Based on your needs:

- [ ] Default component (fast path)
- [ ] Headless component (custom UI)
- [ ] Hook only (maximum control)

### 3. Implement Business Logic

```tsx
const handleAction = async () => {
  try {
    // 1. Validation
    if (!isValid(input)) {
      throw new Error("Validation failed");
    }

    // 2. API call
    await api.performAction(data);

    // 3. Update state
    setState(newState);

    // 4. Track success
    analytics.track("action_completed");
  } catch (error) {
    // Error is handled by component
    throw error;
  }
};
```

### 4. Customize Labels (Optional)

```tsx
<TemplateSnippet
  label="Custom Action"
  onAction={handleAction}
  labels={{
    loading: "Processing...",
    success: "Done!",
    error: "Failed to process",
  }}
/>
```

### 5. Add Tests

```tsx
// Unit test
it("handles action correctly", async () => {
  const onAction = vi.fn();
  render(<TemplateSnippet label="Test" onAction={onAction} />);

  await userEvent.click(screen.getByRole("button"));
  expect(onAction).toHaveBeenCalled();
});

// Storybook interaction test
export const InteractionTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));
    await canvas.findByText("Success");
  },
};
```

### 6. Verify Accessibility

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces actions and status
- [ ] Focus management is correct
- [ ] ARIA attributes are present
- [ ] Color contrast meets WCAG standards

## Rollout Strategy

### Phase 1: Pilot (Week 1-2)

- Pick 1-2 low-risk locations
- Use default component
- Ship behind feature flag
- Monitor closely

**Success Criteria:**

- No accessibility issues reported
- User feedback positive
- No performance degradation

### Phase 2: Expand (Week 3-4)

- Roll out to more locations
- Introduce custom views if needed
- Gather metrics

**Success Criteria:**

- [Define your metrics]
- [Define your targets]

### Phase 3: Standardize (Week 5+)

- Make it the default pattern
- Update documentation
- Train team members

## Best Practices

### Do's ✅

- Start with the default component
- Test keyboard navigation thoroughly
- Provide clear error messages
- Use descriptive labels
- Track important actions
- Handle loading states
- Clean up side effects

### Don'ts ❌

- Don't put business logic in render functions
- Don't override accessibility features
- Don't skip error handling
- Don't forget to test async behavior
- Don't ignore loading states
- Don't bypass type safety

## Monitoring & Instrumentation

### Key Metrics

Track these for success:

```tsx
const handleAction = async () => {
  const startTime = Date.now();

  try {
    await performAction();

    analytics.track("snippet_action_success", {
      component: "TemplateSnippet",
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    analytics.track("snippet_action_error", {
      component: "TemplateSnippet",
      error_type: error.code,
      duration_ms: Date.now() - startTime,
    });

    throw error;
  }
};
```

**Recommended Metrics:**

- Action completion rate
- Error rate
- Average duration
- User satisfaction
- Support tickets

## Troubleshooting

### Issue: Action doesn't trigger

**Solution:** Ensure `onAction` is provided and not undefined:

```tsx
<TemplateSnippet
  label="Test"
  onAction={() => console.log("Action triggered")} // Must be defined
/>
```

### Issue: Custom view loses functionality

**Solution:** Make sure you're using all necessary controller props:

```tsx
{
  (controller) => (
    <button
      onClick={controller.handleAction} // Required
      disabled={controller.status === "loading"} // Recommended
    >
      {controller.label}
    </button>
  );
}
```

### Issue: TypeScript errors

**Solution:** Import and use the correct types:

```tsx
import type { TemplateSnippetControllerState } from "./TemplateSnippet";
```

### Issue: Tests failing

**Solution:** Wait for async operations:

```tsx
await act(async () => {
  await controller.handleAction();
});
```

## Migration Guide

### From Custom Implementation

**Before:**

```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleClick = async () => {
  setLoading(true);
  setError(null);
  try {
    await api.action();
  } catch (e) {
    setError(e.message);
  }
  setLoading(false);
};

return (
  <div>
    <button onClick={handleClick} disabled={loading}>
      {loading ? "Loading..." : "Click Me"}
    </button>
    {error && <div>{error}</div>}
  </div>
);
```

**After:**

```tsx
return (
  <TemplateSnippet label="Click Me" onAction={async () => await api.action()} />
);
```

**Benefits:**

- 80% less code
- Built-in accessibility
- Consistent UX
- Error handling included
- Loading states managed

## Advanced Patterns

### Composing with Other Hooks

```tsx
function ComposedExample() {
  const [data, setData] = useState();
  const controller = useTemplateSnippetController({
    label: "Save",
    onAction: async () => {
      const result = await api.save(data);
      setData(result);
    },
  });

  const otherHook = useOtherFeature();

  // Combine multiple hooks for complex behavior
  return /* ... */;
}
```

### Conditional Rendering

```tsx
{
  showSnippet && (
    <TemplateSnippet label="Conditional" onAction={handleAction} />
  );
}
```

### Dynamic Labels

```tsx
const label = count > 0 ? `Process ${count} items` : "Process";

<TemplateSnippet label={label} onAction={handleAction} />;
```

## Resources

- **README.md** - API documentation
- **TemplateSnippet.stories.tsx** - Interactive examples
- **useTemplateSnippetController.spec.ts** - Test examples
- **DEVELOPMENT.md** (`/guides/`) - Architecture details

## Support

For questions:

1. Check README.md for API reference
2. Review Storybook examples
3. Check test files for usage patterns
4. Refer to DEVELOPMENT.md for standards
5. Ask team for guidance

---

**Remember:** Start simple. Use the default component first. Only customize when you have proven needs.
