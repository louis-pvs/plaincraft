import { describe, it, expect } from "vitest";
import { validateCommitHeadersList } from "./validate-commit-headers.mjs";

describe("validate-commit-headers", () => {
  it("passes when all headers are valid", () => {
    const { invalid, checked } = validateCommitHeadersList([
      "[ARCH-10] feat(parser): add guard",
      "[U-2] fix(ui): adjust spacing",
    ]);

    expect(checked).toBe(2);
    expect(invalid).toHaveLength(0);
  });

  it("collects invalid headers", () => {
    const { invalid, checked } = validateCommitHeadersList([
      "[ARCH-test] feat: bad id",
      "Feature without prefix",
    ]);

    expect(checked).toBe(2);
    expect(invalid).toHaveLength(2);
    expect(invalid[0].error).toBe("Invalid ticket prefix");
    expect(invalid[1].error).toBe("Missing ticket prefix");
  });
});
