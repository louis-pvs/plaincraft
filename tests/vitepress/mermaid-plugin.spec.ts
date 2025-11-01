import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import {
  MERMAID_COMPONENT_TAG,
  mermaidPlugin,
} from "../../shared/vitepress/mermaid/plugin";
import { decodeMermaidCode } from "../../shared/vitepress/mermaid/decode";

const extractMermaidCode = (html: string): string | null => {
  const match = html.match(
    new RegExp(`<${MERMAID_COMPONENT_TAG}\\s+code="([^"]+)"\\s*/>`),
  );
  return match?.[1] ?? null;
};

describe("mermaidPlugin", () => {
  it("transforms mermaid fences into component placeholders", () => {
    const markdown = "```mermaid\ngraph TD\nA-->B\n```";
    const md = new MarkdownIt();
    md.use(mermaidPlugin);

    const html = md.render(markdown);
    const encoded = extractMermaidCode(html);

    expect(encoded).not.toBeNull();
    expect(decodeMermaidCode(encoded ?? "").trim()).toEqual("graph TD\nA-->B");
  });

  it("leaves non-mermaid fences untouched", () => {
    const markdown = "```ts\nconst value = 1;\n```";
    const md = new MarkdownIt();
    md.use(mermaidPlugin);

    const html = md.render(markdown);

    expect(html).toContain('<code class="language-ts">');
    expect(html).not.toContain(MERMAID_COMPONENT_TAG);
  });
});
