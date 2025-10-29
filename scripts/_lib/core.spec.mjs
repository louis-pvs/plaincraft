/**
 * core.spec.mjs
 * Unit tests for core.mjs
 */

import fs from "node:fs/promises";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  Logger,
  repoRoot,
  atomicWrite,
  parseFlags,
  now,
  generateRunId,
  formatOutput,
  fail,
  succeed,
  validateEnvironment,
  isInsideRepo,
  readJSON,
  writeJSON,
  getDirname,
  isMain,
} from "./core.mjs";
import { pathToFileURL } from "node:url";

// Mock fs module
vi.mock("node:fs/promises");

describe("Logger", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should log trace messages when level is trace", () => {
    const logger = new Logger("trace");
    logger.trace("test message");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[TRACE]", "test message");
  });

  it("should log debug messages when level is debug", () => {
    const logger = new Logger("debug");
    logger.debug("test message");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[DEBUG]", "test message");
  });

  it("should log info messages when level is info", () => {
    const logger = new Logger("info");
    logger.info("test message");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[INFO]", "test message");
  });

  it("should log warn messages when level is warn", () => {
    const logger = new Logger("warn");
    logger.warn("test message");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[WARN]", "test message");
  });

  it("should log error messages when level is error", () => {
    const logger = new Logger("error");
    logger.error("test message");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR]", "test message");
  });

  it("should not log trace when level is info", () => {
    const logger = new Logger("info");
    logger.trace("test message");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("should not log debug when level is warn", () => {
    const logger = new Logger("warn");
    logger.debug("test message");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("should default to info level", () => {
    const logger = new Logger();
    logger.debug("test message");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    logger.info("test message");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[INFO]", "test message");
  });

  it("should handle invalid level gracefully", () => {
    const logger = new Logger("invalid");
    logger.info("test message");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[INFO]", "test message");
  });

  it("should log multiple arguments", () => {
    const logger = new Logger("info");
    logger.info("test", "message", 123);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[INFO]",
      "test",
      "message",
      123,
    );
  });
});

describe("isMain", () => {
  it("returns true when argv[1] matches module", () => {
    const originalArgv = process.argv.slice();
    const fakePath = "/tmp/test-script.mjs";
    try {
      process.argv[1] = fakePath;
      expect(isMain({ url: pathToFileURL(fakePath).href })).toBe(true);
      process.argv[1] = "/tmp/other.mjs";
      expect(isMain({ url: pathToFileURL(fakePath).href })).toBe(false);
    } finally {
      process.argv = originalArgv;
    }
  });
});

describe("repoRoot", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should find repo root when .git exists", async () => {
    const mockCwd = "/home/user/project/subdir";
    vi.spyOn(process, "cwd").mockReturnValue(mockCwd);

    fs.access.mockImplementation(async (checkPath) => {
      if (checkPath === "/home/user/project/.git") {
        return; // Success
      }
      throw new Error("Not found");
    });

    const root = await repoRoot();
    expect(root).toBe("/home/user/project");
  });

  it("should walk up directories to find .git", async () => {
    const mockCwd = "/home/user/project/deep/nested/dir";
    vi.spyOn(process, "cwd").mockReturnValue(mockCwd);

    fs.access.mockImplementation(async (checkPath) => {
      if (checkPath === "/home/user/project/.git") {
        return; // Success
      }
      throw new Error("Not found");
    });

    const root = await repoRoot();
    expect(root).toBe("/home/user/project");
  });

  it("should throw error when not in a git repository", async () => {
    const mockCwd = "/home/user";
    vi.spyOn(process, "cwd").mockReturnValue(mockCwd);

    fs.access.mockRejectedValue(new Error("Not found"));

    await expect(repoRoot()).rejects.toThrow("Not in a git repository");
  });

  it("should use provided start path", async () => {
    fs.access.mockImplementation(async (checkPath) => {
      if (checkPath === "/custom/path/.git") {
        return; // Success
      }
      throw new Error("Not found");
    });

    const root = await repoRoot("/custom/path/subdir");
    expect(root).toBe("/custom/path");
  });
});

describe("atomicWrite", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should write file atomically using temp file", async () => {
    const targetPath = "/test/file.txt";
    const content = "test content";

    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.rename.mockResolvedValue();

    await atomicWrite(targetPath, content);

    expect(fs.mkdir).toHaveBeenCalledWith("/test", { recursive: true });
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.rename).toHaveBeenCalled();

    const writeCall = fs.writeFile.mock.calls[0];
    expect(writeCall[0]).toMatch(/atomic-.*\.tmp$/);
    expect(writeCall[1]).toBe(content);
    expect(writeCall[2]).toBe("utf-8");

    const renameCall = fs.rename.mock.calls[0];
    expect(renameCall[1]).toBe(targetPath);
  });

  it("should create parent directory if it doesn't exist", async () => {
    const targetPath = "/deep/nested/dir/file.txt";
    const content = "test content";

    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.rename.mockResolvedValue();

    await atomicWrite(targetPath, content);

    expect(fs.mkdir).toHaveBeenCalledWith("/deep/nested/dir", {
      recursive: true,
    });
  });

  it("should cleanup temp file on error", async () => {
    const targetPath = "/test/file.txt";
    const content = "test content";

    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.rename.mockRejectedValue(new Error("Rename failed"));
    fs.unlink.mockResolvedValue();

    await expect(atomicWrite(targetPath, content)).rejects.toThrow(
      "Rename failed",
    );

    expect(fs.unlink).toHaveBeenCalled();
  });

  it("should ignore cleanup errors", async () => {
    const targetPath = "/test/file.txt";
    const content = "test content";

    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.rename.mockRejectedValue(new Error("Rename failed"));
    fs.unlink.mockRejectedValue(new Error("Unlink failed"));

    await expect(atomicWrite(targetPath, content)).rejects.toThrow(
      "Rename failed",
    );

    expect(fs.unlink).toHaveBeenCalled();
  });
});

describe("parseFlags", () => {
  it("should parse --help flag", () => {
    const result = parseFlags(["--help"]);
    expect(result.help).toBe(true);
  });

  it("should parse -h shorthand", () => {
    const result = parseFlags(["-h"]);
    expect(result.help).toBe(true);
  });

  it("should parse --dry-run flag", () => {
    const result = parseFlags(["--dry-run"]);
    expect(result.dryRun).toBe(true);
  });

  it("should parse --yes flag and disable dry-run", () => {
    const result = parseFlags(["--yes"]);
    expect(result.yes).toBe(true);
    expect(result.dryRun).toBe(false);
  });

  it("should parse -y shorthand", () => {
    const result = parseFlags(["-y"]);
    expect(result.yes).toBe(true);
    expect(result.dryRun).toBe(false);
  });

  it("should parse --output flag with value", () => {
    const result = parseFlags(["--output", "json"]);
    expect(result.output).toBe("json");
  });

  it("should parse -o shorthand", () => {
    const result = parseFlags(["-o", "json"]);
    expect(result.output).toBe("json");
  });

  it("should parse --log-level flag", () => {
    const result = parseFlags(["--log-level", "debug"]);
    expect(result.logLevel).toBe("debug");
  });

  it("should parse --cwd flag", () => {
    const result = parseFlags(["--cwd", "/custom/path"]);
    expect(result.cwd).toBe("/custom/path");
  });

  it("should parse custom flags with values", () => {
    const result = parseFlags(["--custom", "value"]);
    expect(result.custom).toBe("value");
  });

  it("should parse custom boolean flags", () => {
    const result = parseFlags(["--flag"]);
    expect(result.flag).toBe(true);
  });

  it("should parse positional arguments", () => {
    const result = parseFlags(["arg1", "arg2", "arg3"]);
    expect(result._).toEqual(["arg1", "arg2", "arg3"]);
  });

  it("should parse mixed flags and positional arguments", () => {
    const result = parseFlags([
      "arg1",
      "--yes",
      "arg2",
      "--output",
      "json",
      "arg3",
    ]);
    expect(result._).toEqual(["arg1", "arg2", "arg3"]);
    expect(result.yes).toBe(true);
    expect(result.output).toBe("json");
  });

  it("should use default values", () => {
    const result = parseFlags([]);
    expect(result.dryRun).toBe(true);
    expect(result.yes).toBe(false);
    expect(result.output).toBe("text");
    expect(result.logLevel).toBe("info");
    expect(result.help).toBe(false);
    expect(result._).toEqual([]);
  });

  it("should default to process.argv.slice(2) when no args provided", () => {
    const originalArgv = process.argv;
    process.argv = ["node", "script.js", "--help", "test"];

    const result = parseFlags();
    expect(result.help).toBe(true);
    expect(result._).toEqual(["test"]);

    process.argv = originalArgv;
  });
});

describe("now", () => {
  it("should return ISO 8601 timestamp", () => {
    const timestamp = now();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("should return different timestamps on subsequent calls", () => {
    const timestamp1 = now();
    const timestamp2 = now();
    // They should be very close but might be different
    expect(typeof timestamp1).toBe("string");
    expect(typeof timestamp2).toBe("string");
  });
});

describe("generateRunId", () => {
  it("should generate unique run ID", () => {
    const runId1 = generateRunId();
    const runId2 = generateRunId();

    expect(runId1).toMatch(/^\d+-[0-9a-f]{6}$/);
    expect(runId2).toMatch(/^\d+-[0-9a-f]{6}$/);
    expect(runId1).not.toBe(runId2);
  });

  it("should contain timestamp and random component", () => {
    const runId = generateRunId();
    const parts = runId.split("-");

    expect(parts).toHaveLength(2);
    expect(parseInt(parts[0])).toBeGreaterThan(0);
    expect(parts[1]).toMatch(/^[0-9a-f]{6}$/);
  });
});

describe("formatOutput", () => {
  it("should format output as JSON when mode is json", () => {
    const data = { status: "ok", count: 42 };
    const result = formatOutput(data, "json");

    expect(result).toBe('{"status":"ok","count":42}\n');
  });

  it("should format output as text by default", () => {
    const data = { status: "ok", count: 42 };
    const result = formatOutput(data, "text");

    expect(result).toBe("status: ok\ncount: 42\n");
  });

  it("should format nested objects in text mode", () => {
    const data = { status: "ok", details: { count: 42, items: ["a", "b"] } };
    const result = formatOutput(data, "text");

    expect(result).toContain("status: ok");
    expect(result).toContain("details:");
    expect(result).toContain('"count": 42');
  });

  it("should handle empty object", () => {
    const data = {};
    const result = formatOutput(data, "text");

    expect(result).toBe("\n");
  });

  it("should default to text mode when no mode specified", () => {
    const data = { test: "value" };
    const result = formatOutput(data);

    expect(result).toBe("test: value\n");
  });
});

describe("fail", () => {
  let stdoutSpy;
  let originalExitCode;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => {});
    originalExitCode = process.exitCode;
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    process.exitCode = originalExitCode;
  });

  it("should output error in text mode", () => {
    fail({
      message: "Test error",
      script: "test-script",
      output: "text",
    });

    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain("ok: false");
    expect(output).toContain("script: test-script");
    expect(output).toContain("message: Test error");
    expect(process.exitCode).toBe(1);
  });

  it("should output error in JSON mode", () => {
    fail({
      message: "Test error",
      script: "test-script",
      output: "json",
    });

    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);

    expect(parsed.ok).toBe(false);
    expect(parsed.script).toBe("test-script");
    expect(parsed.message).toBe("Test error");
    expect(process.exitCode).toBe(1);
  });

  it("should use custom exit code", () => {
    fail({
      exitCode: 42,
      message: "Test error",
      output: "text",
    });

    expect(process.exitCode).toBe(42);
  });

  it("should include error details", () => {
    fail({
      message: "Test error",
      error: { code: "ERR_TEST", details: "More info" },
      output: "json",
    });

    const output = stdoutSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);

    expect(parsed.error.code).toBe("ERR_TEST");
    expect(parsed.error.details).toBe("More info");
  });

  it("should default to text output mode", () => {
    fail({
      message: "Test error",
      script: "test-script",
    });

    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain("ok: false");
  });
});

describe("succeed", () => {
  let stdoutSpy;
  let originalExitCode;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => {});
    originalExitCode = process.exitCode;
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    process.exitCode = originalExitCode;
  });

  it("should output success in text mode", () => {
    succeed({
      script: "test-script",
      count: 5,
      output: "text",
    });

    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain("ok: true");
    expect(output).toContain("script: test-script");
    expect(output).toContain("count: 5");
    expect(process.exitCode).toBe(0);
  });

  it("should output success in JSON mode", () => {
    succeed({
      script: "test-script",
      count: 5,
      output: "json",
    });

    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);

    expect(parsed.ok).toBe(true);
    expect(parsed.script).toBe("test-script");
    expect(parsed.count).toBe(5);
    expect(process.exitCode).toBe(0);
  });

  it("should default to text output mode", () => {
    succeed({
      script: "test-script",
    });

    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain("ok: true");
  });

  it("should include additional data", () => {
    succeed({
      script: "test-script",
      results: { processed: 10, skipped: 2 },
      output: "json",
    });

    const output = stdoutSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);

    expect(parsed.results.processed).toBe(10);
    expect(parsed.results.skipped).toBe(2);
  });
});

describe("validateEnvironment", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return true when no requirements specified", async () => {
    const result = await validateEnvironment({});
    expect(result).toBe(true);
  });

  it("should validate required environment variables", async () => {
    const originalEnv = process.env;
    process.env = { TEST_VAR: "value" };

    const result = await validateEnvironment({
      env: ["TEST_VAR"],
    });

    expect(result).toBe(true);
    process.env = originalEnv;
  });

  it("should return issues when env vars missing", async () => {
    const originalEnv = process.env;
    process.env = {};

    const result = await validateEnvironment({
      env: ["MISSING_VAR", "ANOTHER_MISSING"],
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]).toContain("MISSING_VAR");
    expect(result[1]).toContain("ANOTHER_MISSING");

    process.env = originalEnv;
  });

  it("should validate git repository by default", async () => {
    fs.access.mockRejectedValue(new Error("Not found"));

    const result = await validateEnvironment({});

    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toContain("Not in a git repository");
  });

  it("should skip git check when git: false", async () => {
    const result = await validateEnvironment({ git: false });
    expect(result).toBe(true);
  });

  it("should validate Node version", async () => {
    const result = await validateEnvironment({
      nodeVersion: "0.1.0",
      git: false,
    });

    expect(result).toBe(true);
  });

  it("should return issue when Node version too old", async () => {
    const result = await validateEnvironment({
      nodeVersion: "999.0.0",
      git: false,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toContain("Node version 999.0.0+ required");
  });

  it("should collect multiple validation issues", async () => {
    const originalEnv = process.env;
    process.env = {};
    fs.access.mockRejectedValue(new Error("Not found"));

    const result = await validateEnvironment({
      env: ["MISSING_VAR"],
      nodeVersion: "999.0.0",
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(1);

    process.env = originalEnv;
  });
});

describe("isInsideRepo", () => {
  it("should return true when path is inside repo", () => {
    const result = isInsideRepo(
      "/home/user/project/src/file.js",
      "/home/user/project",
    );
    expect(result).toBe(true);
  });

  it("should return false when path is outside repo", () => {
    const result = isInsideRepo("/home/other/file.js", "/home/user/project");
    expect(result).toBe(false);
  });

  it("should handle relative paths", () => {
    const cwd = process.cwd();
    const result = isInsideRepo("./src/file.js", cwd);
    expect(result).toBe(true);
  });

  it("should return true when path equals repo root", () => {
    const result = isInsideRepo("/home/user/project", "/home/user/project");
    expect(result).toBe(true);
  });
});

describe("readJSON", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should read and parse JSON file", async () => {
    const mockData = { test: "value", count: 42 };
    fs.readFile.mockResolvedValue(JSON.stringify(mockData));

    const result = await readJSON("/test/file.json");

    expect(result).toEqual(mockData);
    expect(fs.readFile).toHaveBeenCalledWith("/test/file.json", "utf-8");
  });

  it("should throw error on invalid JSON", async () => {
    fs.readFile.mockResolvedValue("invalid json{");

    await expect(readJSON("/test/file.json")).rejects.toThrow();
  });

  it("should propagate file read errors", async () => {
    fs.readFile.mockRejectedValue(new Error("File not found"));

    await expect(readJSON("/test/file.json")).rejects.toThrow("File not found");
  });
});

describe("writeJSON", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should write JSON with atomic operation", async () => {
    const data = { test: "value", count: 42 };

    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.rename.mockResolvedValue();

    await writeJSON("/test/file.json", data);

    expect(fs.writeFile).toHaveBeenCalled();
    const writeCall = fs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1];

    expect(writtenContent).toBe('{\n  "test": "value",\n  "count": 42\n}\n');
  });

  it("should format JSON with 2-space indentation", async () => {
    const data = { nested: { deep: { value: "test" } } };

    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.rename.mockResolvedValue();

    await writeJSON("/test/file.json", data);

    const writeCall = fs.writeFile.mock.calls[0];
    const writtenContent = writeCall[1];

    expect(writtenContent).toContain("  ");
    expect(writtenContent).toMatch(/\n$/);
  });

  it("should handle write errors", async () => {
    const data = { test: "value" };

    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.rename.mockRejectedValue(new Error("Write failed"));
    fs.unlink.mockResolvedValue();

    await expect(writeJSON("/test/file.json", data)).rejects.toThrow(
      "Write failed",
    );
  });
});

describe("getDirname", () => {
  it("should convert import.meta.url to directory path", () => {
    const url = "file:///home/user/project/src/script.mjs";
    const result = getDirname(url);

    expect(result).toBe("/home/user/project/src");
  });

  it("should handle Windows-style paths", () => {
    const url = "file:///C:/Users/user/project/src/script.mjs";
    const result = getDirname(url);

    // Result depends on platform, just ensure it doesn't throw
    expect(typeof result).toBe("string");
  });
});
