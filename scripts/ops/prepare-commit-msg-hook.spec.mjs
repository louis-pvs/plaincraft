import { describe, it, expect } from "vitest";
import { prepareCommitHeader } from "./prepare-commit-msg-hook.mjs";

const join = (lines) => lines.join("\n");

describe("prepare-commit-msg-hook", () => {
  it("inserts a header when the file is empty", () => {
    const result = prepareCommitHeader([""], "ARCH-101");

    expect(result.modified).toBe(true);
    expect(result.skipReason).toBeNull();
    expect(join(result.lines)).toBe(`[ARCH-101] type(scope): \n`);
  });

  it("rewrites mismatched ticket ids", () => {
    const original = [
      "[U-9] feat(view): add placeholder",
      "",
      "Refs: ARCH-99",
    ];
    const result = prepareCommitHeader(original, "ARCH-99");

    expect(result.modified).toBe(true);
    expect(result.lines[0]).toBe("[ARCH-99] feat(view): add placeholder");
  });

  it("normalises headers missing the conventional commit skeleton", () => {
    const original = ["[ARCH-42] Add helper", ""]; // missing type
    const result = prepareCommitHeader(original, "ARCH-42");

    expect(result.modified).toBe(true);
    expect(result.lines[0]).toBe("[ARCH-42] type(scope): Add helper");
  });

  it("skips merge commits", () => {
    const original = ["Merge branch 'main'", ""];
    const result = prepareCommitHeader(original, "ARCH-1");

    expect(result.modified).toBe(false);
    expect(result.skipReason).toBe("merge");
  });

  it("leaves compliant headers untouched", () => {
    const original = ["[ARCH-77] fix(cache): expire stale entries", ""];
    const result = prepareCommitHeader(original, "ARCH-77");

    expect(result.modified).toBe(false);
    expect(result.lines).toEqual(original);
  });
});
