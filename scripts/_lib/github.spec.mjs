/**
 * github.spec.mjs
 * Unit tests for github.mjs
 */

import { execa } from "execa";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isGhAuthenticated,
  getIssue,
  createPR,
  listIssues,
  getPR,
  updatePR,
  createLabel,
  createIssue,
  updateIssue,
} from "./github.mjs";

// Mock execa
vi.mock("execa");

describe("isGhAuthenticated", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return true when authenticated", async () => {
    execa.mockResolvedValue({});

    const result = await isGhAuthenticated();

    expect(result).toBe(true);
    expect(execa).toHaveBeenCalledWith("gh", ["auth", "status"]);
  });

  it("should return false when not authenticated", async () => {
    execa.mockRejectedValue(new Error("Not authenticated"));

    const result = await isGhAuthenticated();

    expect(result).toBe(false);
  });

  it("should return false when gh CLI not installed", async () => {
    execa.mockRejectedValue(new Error("Command not found"));

    const result = await isGhAuthenticated();

    expect(result).toBe(false);
  });
});

describe("getIssue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch issue details", async () => {
    const mockIssue = {
      number: 42,
      title: "Test Issue",
      labels: [{ name: "bug" }],
      body: "Issue body",
      state: "open",
    };
    execa.mockResolvedValue({ stdout: JSON.stringify(mockIssue) });

    const result = await getIssue(42);

    expect(result).toEqual(mockIssue);
    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["issue", "view", "42", "--json", "number,title,labels,body,state"],
      expect.any(Object),
    );
  });

  it("should use provided cwd", async () => {
    const mockIssue = { number: 1, title: "Test" };
    execa.mockResolvedValue({ stdout: JSON.stringify(mockIssue) });

    await getIssue(1, "/custom/path");

    expect(execa).toHaveBeenCalledWith("gh", expect.any(Array), {
      cwd: "/custom/path",
    });
  });

  it("should handle issue with no labels", async () => {
    const mockIssue = {
      number: 1,
      title: "Test",
      labels: [],
      body: "",
      state: "closed",
    };
    execa.mockResolvedValue({ stdout: JSON.stringify(mockIssue) });

    const result = await getIssue(1);

    expect(result.labels).toEqual([]);
  });
});

describe("createPR", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create PR with basic options", async () => {
    execa.mockResolvedValue({
      stdout: "https://github.com/owner/repo/pull/123",
    });

    const result = await createPR({
      title: "New Feature",
      body: "Feature description",
    });

    expect(result.url).toBe("https://github.com/owner/repo/pull/123");
    expect(execa).toHaveBeenCalledWith(
      "gh",
      [
        "pr",
        "create",
        "--title",
        "New Feature",
        "--body",
        "Feature description",
        "--base",
        "main",
      ],
      expect.any(Object),
    );
  });

  it("should create draft PR", async () => {
    execa.mockResolvedValue({
      stdout: "https://github.com/owner/repo/pull/123",
    });

    await createPR({
      title: "Draft PR",
      body: "Work in progress",
      draft: true,
    });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["--draft"]),
      expect.any(Object),
    );
  });

  it("should use custom base branch", async () => {
    execa.mockResolvedValue({
      stdout: "https://github.com/owner/repo/pull/123",
    });

    await createPR({
      title: "Feature",
      body: "Description",
      base: "develop",
    });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["--base", "develop"]),
      expect.any(Object),
    );
  });

  it("should handle empty body", async () => {
    execa.mockResolvedValue({
      stdout: "https://github.com/owner/repo/pull/123",
    });

    await createPR({ title: "Feature" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["--body", ""]),
      expect.any(Object),
    );
  });

  it("should use bodyFile when provided", async () => {
    execa.mockResolvedValue({
      stdout: "https://github.com/owner/repo/pull/123",
    });

    await createPR({ title: "Feature", bodyFile: "/tmp/pr-body.md" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["--body-file", "/tmp/pr-body.md"]),
      expect.any(Object),
    );
  });

  it("should prefer bodyFile over body", async () => {
    execa.mockResolvedValue({
      stdout: "https://github.com/owner/repo/pull/123",
    });

    await createPR({
      title: "Feature",
      body: "inline body",
      bodyFile: "/tmp/pr-body.md",
    });

    const call = execa.mock.calls[0][1];
    expect(call).toContain("--body-file");
    expect(call).toContain("/tmp/pr-body.md");
    expect(call).not.toContain("inline body");
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({ stdout: "url" });

    await createPR({ title: "Test" }, "/custom/path");

    expect(execa).toHaveBeenCalledWith("gh", expect.any(Array), {
      cwd: "/custom/path",
    });
  });

  it("should trim URL from stdout", async () => {
    execa.mockResolvedValue({ stdout: "  https://github.com/pr/123  \n" });

    const result = await createPR({ title: "Test" });

    expect(result.url).toBe("https://github.com/pr/123");
  });
});

describe("listIssues", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should list issues without filters", async () => {
    const mockIssues = [
      { number: 1, title: "Issue 1", labels: [], state: "open" },
      { number: 2, title: "Issue 2", labels: [], state: "closed" },
    ];
    execa.mockResolvedValue({ stdout: JSON.stringify(mockIssues) });

    const result = await listIssues();

    expect(result).toEqual(mockIssues);
    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["issue", "list", "--json", "number,title,labels,state"],
      expect.any(Object),
    );
  });

  it("should filter by state", async () => {
    execa.mockResolvedValue({ stdout: "[]" });

    await listIssues({ state: "closed" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["--state", "closed"]),
      expect.any(Object),
    );
  });

  it("should filter by label", async () => {
    execa.mockResolvedValue({ stdout: "[]" });

    await listIssues({ label: "bug" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["--label", "bug"]),
      expect.any(Object),
    );
  });

  it("should apply multiple filters", async () => {
    execa.mockResolvedValue({ stdout: "[]" });

    await listIssues({ state: "open", label: "enhancement" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["--state", "open", "--label", "enhancement"]),
      expect.any(Object),
    );
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({ stdout: "[]" });

    await listIssues({}, "/custom/path");

    expect(execa).toHaveBeenCalledWith("gh", expect.any(Array), {
      cwd: "/custom/path",
    });
  });

  it("should return empty array when no issues", async () => {
    execa.mockResolvedValue({ stdout: "[]" });

    const result = await listIssues();

    expect(result).toEqual([]);
  });
});

describe("getPR", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch PR details", async () => {
    const mockPR = {
      number: 123,
      title: "Test PR",
      body: "PR description",
      state: "open",
      labels: [{ name: "feature" }],
    };
    execa.mockResolvedValue({ stdout: JSON.stringify(mockPR) });

    const result = await getPR(123);

    expect(result).toEqual(mockPR);
    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["pr", "view", "123", "--json", "number,title,body,state,labels"],
      expect.any(Object),
    );
  });

  it("should use provided cwd", async () => {
    const mockPR = { number: 1, title: "Test" };
    execa.mockResolvedValue({ stdout: JSON.stringify(mockPR) });

    await getPR(1, "/custom/path");

    expect(execa).toHaveBeenCalledWith("gh", expect.any(Array), {
      cwd: "/custom/path",
    });
  });
});

describe("updatePR", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should update PR title", async () => {
    execa.mockResolvedValue({});

    await updatePR(123, { title: "New Title" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["pr", "edit", "123", "--title", "New Title"],
      expect.any(Object),
    );
  });

  it("should update PR body", async () => {
    execa.mockResolvedValue({});

    await updatePR(123, { body: "New body" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["pr", "edit", "123", "--body", "New body"],
      expect.any(Object),
    );
  });

  it("should update both title and body", async () => {
    execa.mockResolvedValue({});

    await updatePR(123, { title: "New Title", body: "New body" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["pr", "edit", "123", "--title", "New Title", "--body", "New body"],
      expect.any(Object),
    );
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({});

    await updatePR(123, { title: "Test" }, "/custom/path");

    expect(execa).toHaveBeenCalledWith("gh", expect.any(Array), {
      cwd: "/custom/path",
    });
  });

  it("should handle empty updates", async () => {
    execa.mockResolvedValue({});

    await updatePR(123, {});

    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["pr", "edit", "123"],
      expect.any(Object),
    );
  });
});

describe("createLabel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create label with all fields", async () => {
    execa.mockResolvedValue({});

    await createLabel({
      name: "enhancement",
      color: "00ff00",
      description: "New feature or request",
    });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      [
        "label",
        "create",
        "enhancement",
        "--color",
        "00ff00",
        "--description",
        "New feature or request",
        "--force",
      ],
      expect.any(Object),
    );
  });

  it("should handle empty description", async () => {
    execa.mockResolvedValue({});

    await createLabel({ name: "bug", color: "ff0000" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["--description", ""]),
      expect.any(Object),
    );
  });

  it("should use --force flag", async () => {
    execa.mockResolvedValue({});

    await createLabel({ name: "test", color: "000000" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["--force"]),
      expect.any(Object),
    );
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({});

    await createLabel({ name: "test", color: "fff" }, "/custom/path");

    expect(execa).toHaveBeenCalledWith("gh", expect.any(Array), {
      cwd: "/custom/path",
    });
  });
});

describe("createIssue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create issue with basic info", async () => {
    execa.mockResolvedValue({
      stdout: "https://github.com/owner/repo/issues/42",
    });

    const result = await createIssue("Bug Report", "Bug description");

    expect(result).toBe("https://github.com/owner/repo/issues/42");
    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["issue", "create", "--title", "Bug Report", "--body", "Bug description"],
      expect.any(Object),
    );
  });

  it("should assign issue to current user", async () => {
    execa.mockResolvedValue({ stdout: "url" });

    await createIssue("Issue", "Body", true);

    expect(execa).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["--assignee", "@me"]),
      expect.any(Object),
    );
  });

  it("should add labels", async () => {
    execa.mockResolvedValue({ stdout: "url" });

    await createIssue("Issue", "Body", false, ["bug", "urgent"]);

    expect(execa).toHaveBeenCalledWith(
      "gh",
      expect.arrayContaining(["--label", "bug,urgent"]),
      expect.any(Object),
    );
  });

  it("should combine all options", async () => {
    execa.mockResolvedValue({ stdout: "url" });

    await createIssue("Issue", "Body", true, ["bug"]);

    const call = execa.mock.calls[0];
    expect(call[1]).toContain("--assignee");
    expect(call[1]).toContain("--label");
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({ stdout: "url" });

    await createIssue("Issue", "Body", false, [], "/custom/path");

    expect(execa).toHaveBeenCalledWith("gh", expect.any(Array), {
      cwd: "/custom/path",
    });
  });

  it("should trim URL from stdout", async () => {
    execa.mockResolvedValue({ stdout: "  https://github.com/issues/1  \n" });

    const result = await createIssue("Test", "Body");

    expect(result).toBe("https://github.com/issues/1");
  });
});

describe("updateIssue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should update issue title", async () => {
    execa.mockResolvedValue({});

    await updateIssue(42, { title: "New Title" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["issue", "edit", "42", "--title", "New Title"],
      expect.any(Object),
    );
  });

  it("should update issue body", async () => {
    execa.mockResolvedValue({});

    await updateIssue(42, { body: "New body" });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["issue", "edit", "42", "--body", "New body"],
      expect.any(Object),
    );
  });

  it("should add labels", async () => {
    execa.mockResolvedValue({});

    await updateIssue(42, { addLabels: ["bug", "urgent"] });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["issue", "edit", "42", "--add-label", "bug,urgent"],
      expect.any(Object),
    );
  });

  it("should remove labels", async () => {
    execa.mockResolvedValue({});

    await updateIssue(42, { removeLabels: ["wontfix"] });

    expect(execa).toHaveBeenCalledWith(
      "gh",
      ["issue", "edit", "42", "--remove-label", "wontfix"],
      expect.any(Object),
    );
  });

  it("should handle multiple updates", async () => {
    execa.mockResolvedValue({});

    await updateIssue(42, {
      title: "New Title",
      body: "New body",
      addLabels: ["feature"],
      removeLabels: ["bug"],
    });

    const call = execa.mock.calls[0];
    expect(call[1]).toContain("--title");
    expect(call[1]).toContain("--body");
    expect(call[1]).toContain("--add-label");
    expect(call[1]).toContain("--remove-label");
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({});

    await updateIssue(42, { title: "Test" }, "/custom/path");

    expect(execa).toHaveBeenCalledWith("gh", expect.any(Array), {
      cwd: "/custom/path",
    });
  });
});
