# VitePress Mermaid Extension

Adds lightweight Mermaid diagram support to both the developer docs (`docs/`) and the playbook site (`playbook/`).

## Pieces

- `plugin.ts` – Markdown-it extension that rewrites ```mermaid fences to a Vue component and base64-encodes the diagram source.
- `Mermaid.vue` – Vue component that lazily imports the `mermaid` runtime, decodes the base64 payload, and renders the SVG output with a friendly error state.
- `decode.ts` – Shared utility used by the component to support both browser (`atob`) and Node (`Buffer`) environments.

## Usage

Both VitePress instances register the plugin in their `config.ts` and globally register the component in `theme/index.ts`:

```ts
import { mermaidPlugin } from "../../../shared/vitepress/mermaid/plugin";
import Mermaid from "../../../shared/vitepress/mermaid/Mermaid.vue";

export default defineConfig({
  markdown: {
    config: (md) => md.use(mermaidPlugin),
  },
  themeConfig: {
    /* ... */
  },
});

export default {
  enhanceApp({ app }) {
    app.component("Mermaid", Mermaid);
  },
};
```

## Tests

Run the unit tests to validate the Markdown transform and the decoding helper:

```bash
pnpm vitest run tests/vitepress/mermaid-plugin.spec.ts
```

`tests/vitepress/mermaid-plugin.spec.ts` covers the Markdown fence transform and `tests/vitepress/mermaid-decode.spec.ts` verifies the cross-environment base64 decoding.
