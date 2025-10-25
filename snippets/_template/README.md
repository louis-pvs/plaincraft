# TemplateSnippet

One file UX snippet template.

## Use case

Short description of what this snippet solves.

## Props

- `label?: string`
- `onAction?: () => void | Promise<void>`
- `max?: number`

## Behaviors

- Input enforces a soft max
- Button triggers `onAction`

## Accessibility

- Labeled input
- Hint text via `aria-describedby`
- Focus rings and keyboard path

## 10 minute acceptance test

1. Clone fresh and install
2. Add a new snippet from template
3. Import Demo into `demo/src/App.tsx`
4. Run dev server and interact with keyboard only
5. Confirm no type errors and CI green
