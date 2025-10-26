# NotificationBadge

Notification badge counter with dismiss functionality, following Plaincraft architecture standards.

## Overview

A compact notification badge that displays a count and provides click and dismiss actions. Designed for notification indicators, unread message counters, or any UI pattern requiring countable alerts with user interaction.

## Architecture

This snippet follows the Plaincraft layered architecture:

- **`useNotificationBadgeController`** - Headless hook with business logic
- **`NotificationBadgeView`** - Default Tailwind-styled view
- **`NotificationBadge`** - Convenience component (hook + view)
- **`NotificationBadgeHeadless`** - Render-prop component for custom views

## Quick Start

### Default Component

```tsx
import { NotificationBadge } from "./NotificationBadge";

function Example() {
  return (
    <NotificationBadge
      count={5}
      label="Messages"
      variant="primary"
      onClick={async () => {
        // Handle badge click (e.g., navigate to messages)
        await router.push("/messages");
      }}
      onDismiss={async () => {
        // Handle dismiss action (e.g., mark all as read)
        await api.markAllRead();
      }}
    />
  );
}
```

### Headless Component (Custom UI)

```tsx
import { NotificationBadgeHeadless } from "./NotificationBadge";

function CustomExample() {
  return (
    <NotificationBadgeHeadless count={10} onDismiss={handleDismiss}>
      {(state) => (
        <div>
          <button onClick={state.handleBadgeClick}>
            {state.displayCount} new items
          </button>
          {state.hasNotifications && (
            <button onClick={state.handleDismiss}>Clear</button>
          )}
        </div>
      )}
    </NotificationBadgeHeadless>
  );
}
```

### Direct Hook Usage

```tsx
import { useNotificationBadgeController } from "./NotificationBadge";

function AdvancedExample() {
  const state = useNotificationBadgeController({
    count: 15,
    onClick: handleClick,
    onDismiss: handleDismiss,
  });

  // Build your own UI with controller state
  return (
    <div>
      <button {...state.badgeProps} onClick={state.handleBadgeClick}>
        {state.displayCount}
      </button>
    </div>
  );
}
```

## Props

### NotificationBadge Props

| Prop          | Type                                              | Default           | Description                             |
| ------------- | ------------------------------------------------- | ----------------- | --------------------------------------- |
| `count`       | `number`                                          | `0`               | Number of notifications                 |
| `label`       | `string`                                          | `"Notifications"` | Screen reader label                     |
| `variant`     | `"default" \| "primary" \| "warning" \| "danger"` | `"default"`       | Visual style variant                    |
| `maxCount`    | `number`                                          | `99`              | Max count before showing "N+"           |
| `showDismiss` | `boolean`                                         | `true`            | Show/hide dismiss button                |
| `onClick`     | `() => void \| Promise<void>`                     | -                 | Callback when badge is clicked          |
| `onDismiss`   | `() => void \| Promise<void>`                     | -                 | Callback when dismiss button is clicked |

### Controller State (returned by hook)

```tsx
{
  count: number;
  status: "idle" | "loading" | "success" | "error";
  dismissed: boolean;
  displayCount: string;          // "5" or "99+"
  hasNotifications: boolean;
  badgeProps: {...};              // Props for badge button
  dismissButtonProps: {...};     // Props for dismiss button
  handleBadgeClick: () => Promise<void>;
  handleDismiss: () => Promise<void>;
  resetBadge: () => void;
}
```

## Behaviors

- **Count display:** Shows actual count up to `maxCount`, then displays "N+" (e.g., "99+")
- **Zero count:** Component renders nothing when `count` is 0
- **Badge click:** Triggers `onClick` callback, sets loading state during execution
- **Dismiss action:** Triggers `onDismiss`, hides badge after successful completion
- **Error handling:** Errors are caught, logged in dev, and badge remains visible
- **Loading states:** Button disabled during async operations
- **Reset:** `resetBadge()` clears dismissed state and resets status

## Accessibility

- ✅ Proper ARIA roles: badge has `role="status"` with `aria-live="polite"`
- ✅ Accessible name: `aria-label` combines count and label (e.g., "5 Messages")
- ✅ Screen reader text: Uses `.sr-only` span for label with visible count in `aria-hidden` span
- ✅ Dismiss button: Clear `aria-label="Dismiss notifications"`
- ✅ Keyboard navigation: Full keyboard support (Tab, Enter, Space)
- ✅ Focus management: Visible focus indicators
- ✅ `aria-busy` during async operations
- ✅ Status updates announced to screen readers via `aria-live`

## Testing

```bash
# Run unit tests
pnpm test NotificationBadge

# Run Storybook interaction tests
pnpm storybook:test

# View in Storybook
pnpm storybook
```

## Examples

See `NotificationBadge.stories.tsx` for:

- **Basic** - Simple badge display
- **Interaction** - Full click and dismiss flow (tagged for GIF recording)
- **Variants** - Visual style options
- **ExceedsMaxCount** - Count overflow handling
- **ZeroCount** - Hidden when no notifications
- **NoDismiss** - Badge without dismiss button
- **HeadlessCustomView** - Custom rendering example

## 10-Minute Acceptance Test

1. **Setup**: `pnpm install` and verify dependencies
2. **Import**: Add `NotificationBadge` to demo app or create test harness
3. **Visual test**: Verify badge displays with count and dismiss button
4. **Click badge**: Confirm `onClick` callback fires
5. **Dismiss**: Click dismiss button, verify badge disappears
6. **Keyboard test**:
   - Tab to badge → Enter triggers onClick
   - Tab to dismiss → Space triggers onDismiss
7. **Screen reader**: Verify "N <label>" is announced (e.g., "5 Messages")
8. **Zero count**: Set `count={0}`, verify badge doesn't render
9. **Max count**: Set `count={150} maxCount={99}`, verify shows "99+"
10. **All checks pass**: `pnpm typecheck && pnpm lint && pnpm test && pnpm storybook:test`

**Storybook Story ID for GIF:** `snippets-notificationbadge--interaction`
**GIF Placeholder Name:** `notification-badge-interaction.gif` (10-15s, captures badge click → dismiss flow)

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
