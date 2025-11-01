import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decodeMermaidCode } from "../../shared/vitepress/mermaid/decode";
import { encodeMermaidCode } from "../../shared/vitepress/mermaid/plugin";

const originalAtob = globalThis.atob;

describe("decodeMermaidCode", () => {
  beforeEach(() => {
    globalThis.atob = undefined as unknown as typeof globalThis.atob;
  });

  afterEach(() => {
    globalThis.atob = originalAtob;
  });

  it("decodes using Node Buffer fallback", () => {
    const encoded = encodeMermaidCode("graph TD\nA-->B");

    expect(decodeMermaidCode(encoded)).toEqual("graph TD\nA-->B");
  });

  it("prefers atob when available", () => {
    const encoded = encodeMermaidCode("sequenceDiagram\nA->>B: Ping");

    globalThis.atob = (input: string) =>
      Buffer.from(input, "base64").toString("binary");

    expect(decodeMermaidCode(encoded)).toEqual("sequenceDiagram\nA->>B: Ping");
  });

  it("returns empty string for invalid payloads", () => {
    expect(decodeMermaidCode("not-base64")).toEqual("");
    expect(decodeMermaidCode("")).toEqual("");
  });
});
