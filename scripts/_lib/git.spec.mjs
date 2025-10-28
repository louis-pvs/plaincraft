/**
 * git.spec.mjs
 * Unit tests for git.mjs
 */

import { execa } from "execa";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isGitClean,
  getCurrentBranch,
  branchExists,
  getRecentCommits,
  createWorktree,
  removeWorktree,
  listWorktrees,
  execCommand,
} from "./git.mjs";

// Mock execa
vi.mock("execa");

describe("isGitClean", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return true when working directory is clean", async () => {
    execa.mockResolvedValue({ stdout: "" });

    const result = await isGitClean();

    expect(result).toBe(true);
    expect(execa).toHaveBeenCalledWith(
      "git",
      ["status", "--porcelain"],
      expect.any(Object),
    );
  });

  it("should return false when working directory has changes", async () => {
    execa.mockResolvedValue({ stdout: " M file.txt\n?? new-file.txt" });

    const result = await isGitClean();

    expect(result).toBe(false);
  });

  it("should return false when git command fails", async () => {
    execa.mockRejectedValue(new Error("Not a git repository"));

    const result = await isGitClean();

    expect(result).toBe(false);
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({ stdout: "" });

    await isGitClean("/custom/path");

    expect(execa).toHaveBeenCalledWith("git", ["status", "--porcelain"], {
      cwd: "/custom/path",
    });
  });

  it("should trim whitespace from status output", async () => {
    execa.mockResolvedValue({ stdout: "  \n  " });

    const result = await isGitClean();

    expect(result).toBe(true);
  });
});

describe("getCurrentBranch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return current branch name", async () => {
    execa.mockResolvedValue({ stdout: "main\n" });

    const result = await getCurrentBranch();

    expect(result).toBe("main");
    expect(execa).toHaveBeenCalledWith(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      expect.any(Object),
    );
  });

  it("should return feature branch name", async () => {
    execa.mockResolvedValue({ stdout: "feat/new-feature" });

    const result = await getCurrentBranch();

    expect(result).toBe("feat/new-feature");
  });

  it("should trim whitespace from branch name", async () => {
    execa.mockResolvedValue({ stdout: "  develop  \n" });

    const result = await getCurrentBranch();

    expect(result).toBe("develop");
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({ stdout: "main" });

    await getCurrentBranch("/custom/path");

    expect(execa).toHaveBeenCalledWith(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      { cwd: "/custom/path" },
    );
  });

  it("should handle detached HEAD state", async () => {
    execa.mockResolvedValue({ stdout: "HEAD" });

    const result = await getCurrentBranch();

    expect(result).toBe("HEAD");
  });
});

describe("branchExists", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return true when branch exists", async () => {
    execa.mockResolvedValue({ stdout: "abc123def456" });

    const result = await branchExists("main");

    expect(result).toBe(true);
    expect(execa).toHaveBeenCalledWith(
      "git",
      ["rev-parse", "--verify", "main"],
      expect.any(Object),
    );
  });

  it("should return false when branch doesn't exist", async () => {
    execa.mockRejectedValue(new Error("fatal: Needed a single revision"));

    const result = await branchExists("nonexistent");

    expect(result).toBe(false);
  });

  it("should check remote branches", async () => {
    execa.mockResolvedValue({ stdout: "abc123" });

    const result = await branchExists("origin/main");

    expect(result).toBe(true);
    expect(execa).toHaveBeenCalledWith(
      "git",
      ["rev-parse", "--verify", "origin/main"],
      expect.any(Object),
    );
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({ stdout: "abc123" });

    await branchExists("main", "/custom/path");

    expect(execa).toHaveBeenCalledWith(
      "git",
      ["rev-parse", "--verify", "main"],
      { cwd: "/custom/path" },
    );
  });
});

describe("getRecentCommits", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return recent commit messages", async () => {
    const commits = "fix: bug fix\nfeat: new feature\ndocs: update readme";
    execa.mockResolvedValue({ stdout: commits });

    const result = await getRecentCommits();

    expect(result).toEqual([
      "fix: bug fix",
      "feat: new feature",
      "docs: update readme",
    ]);
    expect(execa).toHaveBeenCalledWith(
      "git",
      ["log", "-10", "--pretty=format:%s"],
      expect.any(Object),
    );
  });

  it("should limit commit count", async () => {
    const commits = "commit 1\ncommit 2\ncommit 3";
    execa.mockResolvedValue({ stdout: commits });

    const result = await getRecentCommits(3);

    expect(result).toHaveLength(3);
    expect(execa).toHaveBeenCalledWith(
      "git",
      ["log", "-3", "--pretty=format:%s"],
      expect.any(Object),
    );
  });

  it("should filter out empty lines", async () => {
    const commits = "commit 1\n\ncommit 2\n\n\ncommit 3";
    execa.mockResolvedValue({ stdout: commits });

    const result = await getRecentCommits();

    expect(result).toEqual(["commit 1", "commit 2", "commit 3"]);
  });

  it("should return empty array when no commits", async () => {
    execa.mockResolvedValue({ stdout: "" });

    const result = await getRecentCommits();

    expect(result).toEqual([]);
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({ stdout: "commit" });

    await getRecentCommits(5, "/custom/path");

    expect(execa).toHaveBeenCalledWith(
      "git",
      ["log", "-5", "--pretty=format:%s"],
      { cwd: "/custom/path" },
    );
  });

  it("should handle special characters in commit messages", async () => {
    const commits = "fix: 'quoted' message\nfeat: message with \"quotes\"";
    execa.mockResolvedValue({ stdout: commits });

    const result = await getRecentCommits();

    expect(result).toEqual([
      "fix: 'quoted' message",
      'feat: message with "quotes"',
    ]);
  });
});

describe("createWorktree", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create worktree with branch", async () => {
    execa.mockResolvedValue({});

    await createWorktree("/path/to/worktree", "feature-branch");

    expect(execa).toHaveBeenCalledWith(
      "git",
      ["worktree", "add", "-b", "feature-branch", "/path/to/worktree"],
      expect.any(Object),
    );
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({});

    await createWorktree("/worktree", "branch", "/custom/path");

    expect(execa).toHaveBeenCalledWith(
      "git",
      ["worktree", "add", "-b", "branch", "/worktree"],
      { cwd: "/custom/path" },
    );
  });

  it("should propagate errors", async () => {
    execa.mockRejectedValue(new Error("fatal: '/path' already exists"));

    await expect(createWorktree("/path", "branch")).rejects.toThrow(
      "already exists",
    );
  });
});

describe("removeWorktree", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should remove worktree", async () => {
    execa.mockResolvedValue({});

    await removeWorktree("/path/to/worktree");

    expect(execa).toHaveBeenCalledWith(
      "git",
      ["worktree", "remove", "/path/to/worktree"],
      expect.any(Object),
    );
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({});

    await removeWorktree("/worktree", "/custom/path");

    expect(execa).toHaveBeenCalledWith(
      "git",
      ["worktree", "remove", "/worktree"],
      { cwd: "/custom/path" },
    );
  });

  it("should propagate errors", async () => {
    execa.mockRejectedValue(new Error("fatal: '/path' is not a working tree"));

    await expect(removeWorktree("/path")).rejects.toThrow("not a working tree");
  });
});

describe("listWorktrees", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should list all worktrees", async () => {
    const output = `worktree /home/user/project
branch refs/heads/main

worktree /home/user/project-feature
branch refs/heads/feature-branch

`;
    execa.mockResolvedValue({ stdout: output });

    const result = await listWorktrees();

    expect(result).toEqual([
      { path: "/home/user/project", branch: "main" },
      { path: "/home/user/project-feature", branch: "feature-branch" },
    ]);
  });

  it("should handle worktree without branch", async () => {
    const output = `worktree /home/user/project

`;
    execa.mockResolvedValue({ stdout: output });

    const result = await listWorktrees();

    expect(result).toEqual([{ path: "/home/user/project" }]);
  });

  it("should return empty array when no worktrees", async () => {
    execa.mockResolvedValue({ stdout: "" });

    const result = await listWorktrees();

    expect(result).toEqual([]);
  });

  it("should strip refs/heads/ prefix from branch names", async () => {
    const output = `worktree /path
branch refs/heads/feat/complex-branch-name

`;
    execa.mockResolvedValue({ stdout: output });

    const result = await listWorktrees();

    expect(result[0].branch).toBe("feat/complex-branch-name");
  });

  it("should use provided cwd", async () => {
    execa.mockResolvedValue({ stdout: "" });

    await listWorktrees("/custom/path");

    expect(execa).toHaveBeenCalledWith(
      "git",
      ["worktree", "list", "--porcelain"],
      {
        cwd: "/custom/path",
      },
    );
  });

  it("should handle multiple worktrees correctly", async () => {
    const output = `worktree /path1
branch refs/heads/branch1

worktree /path2
branch refs/heads/branch2

worktree /path3
branch refs/heads/branch3

`;
    execa.mockResolvedValue({ stdout: output });

    const result = await listWorktrees();

    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({ path: "/path3", branch: "branch3" });
  });
});

describe("execCommand", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should execute command with args", async () => {
    execa.mockResolvedValue({ stdout: "output", stderr: "" });

    const result = await execCommand("git", ["status"]);

    expect(result.stdout).toBe("output");
    expect(execa).toHaveBeenCalledWith("git", ["status"], {});
  });

  it("should pass options to execa", async () => {
    execa.mockResolvedValue({ stdout: "output", stderr: "" });

    await execCommand("git", ["status"], { cwd: "/custom" });

    expect(execa).toHaveBeenCalledWith("git", ["status"], { cwd: "/custom" });
  });

  it("should return stdout and stderr", async () => {
    execa.mockResolvedValue({ stdout: "out", stderr: "err" });

    const result = await execCommand("cmd", ["arg"]);

    expect(result.stdout).toBe("out");
    expect(result.stderr).toBe("err");
  });

  it("should propagate errors", async () => {
    execa.mockRejectedValue(new Error("Command failed"));

    await expect(execCommand("bad", ["cmd"])).rejects.toThrow("Command failed");
  });
});
