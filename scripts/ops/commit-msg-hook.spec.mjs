import { describe, it, expect } from "vitest";
import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import {
  extractHeaderLine,
  extractTicketId,
  validateHeader,
} from "./commit-msg-hook.mjs";

describe("commit-msg-hook", () => {
  it("accepts a valid commit header", () => {
    const result = validateHeader({
      header: "[ARCH-123] feat(parser): handle empty input",
      branchId: "ARCH-123",
    });

    expect(result.valid).toBe(true);
    expect(result.data).toMatchObject({
      ticketId: "ARCH-123",
      type: "feat",
      scope: "parser",
      subject: "handle empty input",
    });
  });

  it("rejects when the ticket id does not match the branch", () => {
    const result = validateHeader({
      header: "[ARCH-123] fix(ui): repair button",
      branchId: "U-9",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Ticket id does not match branch");
  });

  it("rejects slug-based ticket prefixes", () => {
    const result = validateHeader({
      header: "[ARCH-subissue-fix] feat: add guard",
      branchId: "ARCH-12",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Slug detected in commit header");
  });

  it("rejects invalid commit types", () => {
    const result = validateHeader({
      header: "[ARCH-10] Fix(core): bad type casing",
      branchId: "ARCH-10",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Header must follow Conventional Commit format");
  });

  it("rejects overlength subjects", () => {
    const subject = "a".repeat(73);
    const result = validateHeader({
      header: `[ARCH-10] chore(ci): ${subject}`,
      branchId: "ARCH-10",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Subject too long");
  });

  it("rejects missing type or colon", () => {
    const result = validateHeader({
      header: "[ARCH-10] add helper",
      branchId: "ARCH-10",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Header must follow Conventional Commit format");
  });

  it("rejects unsupported commit types", () => {
    const result = validateHeader({
      header: "[ARCH-10] chorex(repo): tweak",
      branchId: "ARCH-10",
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid commit type");
  });

  it("extracts header when body lists multi-ticket refs", () => {
    const commitMsg = `

# Please enter the commit message for your changes. Lines starting
[ARCH-50] chore(repo): add prepare-commit hook

Refs: ARCH-100, U-5
# End of message
`;
    const header = extractHeaderLine(commitMsg);

    expect(header).toBe("[ARCH-50] chore(repo): add prepare-commit hook");
  });

  it("extracts ticket ids in any case", () => {
    expect(extractTicketId("feat/arch-10-prepare-hook")).toBe("ARCH-10");
    expect(extractTicketId("fix/U-2-demo")).toBe("U-2");
  });

  it("fails the CLI when header is invalid", async () => {
    const dir = await mkdtemp(join(tmpdir(), "commit-hook-"));
    const file = join(dir, "COMMIT_MSG");
    await writeFile(file, "Add feature without ticket\n");

    await expect(
      execa("node", [join(process.cwd(), "scripts/ops/commit-msg-hook.mjs"), file]),
    ).rejects.toMatchObject({ exitCode: 1 });
  });

  it("passes the CLI when header is valid", async () => {
    const dir = await mkdtemp(join(tmpdir(), "commit-hook-valid-"));
    const file = join(dir, "COMMIT_MSG");
    await writeFile(file, "[ARCH-10] fix(ui): repair bug\n");

    const result = await execa("node", [
      join(process.cwd(), "scripts/ops/commit-msg-hook.mjs"),
      file,
    ]);

    expect(result.exitCode).toBe(0);
  });
});
