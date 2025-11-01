import { Buffer } from "node:buffer";
import type MarkdownIt from "markdown-it";

const MERMAID_FENCE = /^mermaid(?:\s+.*)?$/i;

export const MERMAID_COMPONENT_TAG = "Mermaid";

export function encodeMermaidCode(code: string): string {
  return Buffer.from(code, "utf-8").toString("base64");
}

export function mermaidPlugin(md: MarkdownIt): void {
  const defaultFence = md.renderer.rules.fence?.bind(md.renderer.rules);

  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx];
    if (!token) {
      return "";
    }
    const info = token.info.trim();

    if (MERMAID_FENCE.test(info)) {
      const encoded = encodeMermaidCode(token.content);
      return `<${MERMAID_COMPONENT_TAG} code="${encoded}" />`;
    }

    return defaultFence
      ? defaultFence(tokens, idx, options, env, slf)
      : slf.renderToken(tokens, idx, options);
  };
}
