import { Buffer } from "node:buffer";

const textDecoder =
  typeof TextDecoder !== "undefined"
    ? new TextDecoder("utf-8", { fatal: false })
    : null;

const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;

const decodeWithAtob = (encoded: string): string => {
  if (typeof globalThis.atob !== "function") return "";

  try {
    const binary = globalThis.atob(encoded);
    if (textDecoder) {
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      return textDecoder.decode(bytes);
    }

    return binary;
  } catch {
    return "";
  }
};

const decodeWithBuffer = (encoded: string): string => {
  try {
    const buffer = (
      globalThis as typeof globalThis & { Buffer?: typeof Buffer }
    ).Buffer;
    if (!buffer) return "";
    return buffer.from(encoded, "base64").toString("utf-8");
  } catch {
    return "";
  }
};

export function decodeMermaidCode(encoded: string): string {
  if (!encoded) return "";

  const sanitized = encoded.replace(/\s+/g, "");
  if (!BASE64_PATTERN.test(sanitized)) return "";

  const valueFromAtob = decodeWithAtob(sanitized);
  if (valueFromAtob) return valueFromAtob;

  const valueFromBuffer = decodeWithBuffer(sanitized);
  if (valueFromBuffer) return valueFromBuffer;

  return "";
}
