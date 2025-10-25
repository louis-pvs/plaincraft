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
