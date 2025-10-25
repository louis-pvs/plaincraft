# InlineEditLabel

Turn a static label into an inline text field with optimistic save and escape to cancel.

## Props

| Prop           | Type                                           | Notes                                                                      |
| -------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `value`        | `string`                                       | Current label value rendered in read-only mode.                            |
| `maxLength`    | `number`                                       | Upper bound used for trimming and invariant checks.                        |
| `onSave`       | `(nextValue: string) => Promise<void> \| void` | Seam that persists optimistic edits; errors keep the field open for retry. |
| `ariaLabel`    | `string`                                       | Accessible label announced for both read-only and edit modes.              |
| `savingLabel`  | `string`                                       | Optional copy shown while a save is pending.                               |
| `successLabel` | `string`                                       | Optional copy shown after a successful save.                               |
| `errorLabel`   | `string`                                       | Optional copy shown when a save fails.                                     |

## Behaviors

- Enter to save, Esc to cancel, clicks outside save the current draft.
- Spinner for pending saves with optimistic UI before callbacks resolve.
- Failed saves restore the previous value and keep focus for retry.

## Accessibility

- `role="button"` applied to the read-only label with keyboard entry (Enter/Space).
- `aria-busy` toggled during async saves plus `aria-live` feedback for status text.
- Focus ring on the editable field with 2px outline and offset for visibility.

## 10-minute acceptance test

1. Open the demo, edit the InlineEditLabel text, and press Enter to trigger save.
2. Observe the optimistic update, pending spinner, and brief saved toast.
3. Press Esc while editing to verify cancellation restores the original text.
4. Trigger the demo edge case to see the retry path after a simulated failure.

## When to use / when not to

<README_BENEFITS>

## Recording

Add a 10–15s GIF of the happy path and the retry edge case after implementation.
