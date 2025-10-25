# plaincraft

One file UX snippets for React and TypeScript. Each snippet is a single TSX file with a tiny Demo at the bottom and an acceptance test you can verify in minutes.

## Philosophy

Seams via props. Invariants guarded at the top. A11y first. Runnable in under 10 minutes from a clean clone.

## Use this template

- GitHub: Use this template then create your repo, run `pnpm i` and `pnpm dev`
- CLI: `gh repo create <name> --template louis-pvs/plaincraft --public`
- Clean copy: `pnpm dlx degit louis-pvs/plaincraft <name>`

## Getting started

```bash
pnpm i
pnpm dev
```

## Add a snippet

```bash
pnpm new:snippet <PascalCaseName>
pnpm dev
```

Each snippet lives in `snippets/<Name>/<Name>.tsx` and exports both the component and `Demo`.

## Repo layout

```
demo/           Vite app that imports snippet Demos
snippets/       Snippets and the _template
docs/           Optional docs landing
scripts/        Helper scripts
```

## 10 minute runnable contract

- Fresh clone to running demo in under 10 minutes
- Keyboard and screen reader paths documented
- No external UI dependency
- TypeScript strict passes, CI is green

## License

MIT © 2024 Louis Phang

---

## Storybook

Run Storybook locally:

```bash
pnpm storybook
```

Build static Storybook:

```bash
pnpm build:storybook
```

Install Playwright browsers (once per environment):

```bash
pnpm exec playwright install --with-deps
```

Headless interaction tests:

```bash
TARGET_URL=http://127.0.0.1:6006 pnpm storybook:test
```

### How docs get generated

Each snippet includes:

- `README.md` with use case, props, behavior, a11y, and a 10-minute acceptance checklist.
- `*.mdx` that imports `README.md` via `?raw` and renders it inside Storybook docs.
- `*.stories.tsx` with 2–3 stories: Basic, Interaction (with `play()`), and an Edge case.

### Scaffolding a new snippet (stories included)

```bash
pnpm new:snippet <PascalCaseName>
pnpm storybook
```

This creates:

- `snippets/<Name>/<Name>.tsx`
- `snippets/<Name>/<Name>.spec.tsx`
- `snippets/<Name>/README.md`
- `snippets/<Name>/<Name>.stories.tsx`
- `snippets/<Name>/<Name>.mdx`

Import its `Demo` into the demo app to keep the “single source of truth”:

```ts
import { Demo as <Name>Demo } from "../../snippets/<Name>/<Name>";
```

---

Quality gates

- From a clean clone:
  - `pnpm i && pnpm storybook` starts Storybook successfully.
  - `pnpm storybook:test` runs (Storybook test runner against the static build) and passes.
  - Creating a new snippet via `pnpm new:snippet <Name>` yields working docs and stories without manual edits.

- GitHub Actions:
  - `app-checks` installs deps once, then format, typecheck, lint, unit test, and build the app.
  - `storybook-tests` restores Playwright browsers cached per `@playwright/test` version/runner arch, installs browsers only on cache misses, builds Storybook, serves the static bundle, waits on `http://127.0.0.1:6006`, and runs the Storybook 9 test runner with the same command we use locally.

Do not exceed these time boxes:

- Storybook setup ≤ 60 minutes
- CI build+tests additional time ≤ 90 seconds vs. baseline
