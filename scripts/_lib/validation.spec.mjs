/**
 * validation.spec.mjs
 * Unit tests for validation.mjs
 */

import { readFile } from "node:fs/promises";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  loadAllowlist,
  isUrlAllowed,
  validateScriptHeader,
  validateCLIContract,
  detectDangerousPatterns,
  checkSizeCompliance,
} from "./validation.mjs";

// Mock fs module
vi.mock("node:fs/promises");

describe("loadAllowlist", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should load domains from allowlist file", async () => {
    const mockAllowlist = {
      domains: ["github.com", "npmjs.com", "nodejs.org"],
      policyIgnore: ["scripts/_lib/__fixtures__/*"],
    };
    readFile.mockResolvedValue(JSON.stringify(mockAllowlist));

    const result = await loadAllowlist();

    expect(result).toEqual({
      domains: ["github.com", "npmjs.com", "nodejs.org"],
      policyIgnore: ["scripts/_lib/__fixtures__/*"],
      sizeExceptions: null,
    });
  });

  it("should return empty array when file not found", async () => {
    readFile.mockRejectedValue(new Error("File not found"));

    const result = await loadAllowlist();

    expect(result).toEqual({
      domains: [],
      policyIgnore: [],
      sizeExceptions: null,
    });
  });

  it("should return empty array when domains field missing", async () => {
    readFile.mockResolvedValue(JSON.stringify({}));

    const result = await loadAllowlist();

    expect(result).toEqual({
      domains: [],
      policyIgnore: [],
      sizeExceptions: null,
    });
  });

  it("should handle invalid JSON gracefully", async () => {
    readFile.mockResolvedValue("invalid json{");

    const result = await loadAllowlist();

    expect(result).toEqual({
      domains: [],
      policyIgnore: [],
      sizeExceptions: null,
    });
  });
});

describe("isUrlAllowed", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return true for allowed domain", async () => {
    const mockAllowlist = {
      domains: ["github.com", "npmjs.com"],
    };
    readFile.mockResolvedValue(JSON.stringify(mockAllowlist));

    const result = await isUrlAllowed("https://github.com/user/repo");

    expect(result).toBe(true);
  });

  it("should return false for disallowed domain", async () => {
    const mockAllowlist = {
      domains: ["github.com", "npmjs.com"],
    };
    readFile.mockResolvedValue(JSON.stringify(mockAllowlist));

    const result = await isUrlAllowed("https://evil.com/malware");

    expect(result).toBe(false);
  });

  it("should match subdomains", async () => {
    const mockAllowlist = {
      domains: ["github.com"],
    };
    readFile.mockResolvedValue(JSON.stringify(mockAllowlist));

    const result = await isUrlAllowed("https://api.github.com/users");

    expect(result).toBe(true);
  });

  it("should handle empty allowlist", async () => {
    readFile.mockResolvedValue(JSON.stringify({ domains: [] }));

    const result = await isUrlAllowed("https://github.com/user/repo");

    expect(result).toBe(false);
  });

  it("should handle different URL schemes", async () => {
    const mockAllowlist = {
      domains: ["github.com"],
    };
    readFile.mockResolvedValue(JSON.stringify(mockAllowlist));

    const httpResult = await isUrlAllowed("http://github.com/user/repo");
    const httpsResult = await isUrlAllowed("https://github.com/user/repo");

    expect(httpResult).toBe(true);
    expect(httpsResult).toBe(true);
  });
});

describe("validateScriptHeader", () => {
  it("should validate script with valid header", () => {
    const content = `/**
 * test-script.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Description here
 */

console.log("test");
`;

    const result = validateScriptHeader(content);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect missing header block", () => {
    const content = `console.log("no header");`;

    const result = validateScriptHeader(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing header comment block");
  });

  it("should detect missing @since tag", () => {
    const content = `/**
 * test-script.mjs
 * @version 0.1.0
 */

console.log("test");
`;

    const result = validateScriptHeader(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing @since tag in header");
  });

  it("should detect missing @version tag", () => {
    const content = `/**
 * test-script.mjs
 * @since 2025-10-28
 */

console.log("test");
`;

    const result = validateScriptHeader(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing @version tag in header");
  });

  it("should detect missing both tags", () => {
    const content = `/**
 * test-script.mjs
 * Just a description
 */

console.log("test");
`;

    const result = validateScriptHeader(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain("Missing @since tag in header");
    expect(result.errors).toContain("Missing @version tag in header");
  });

  it("should handle shebang before header", () => {
    const content = `#!/usr/bin/env node
/**
 * test-script.mjs
 * @since 2025-10-28
 * @version 0.1.0
 */

console.log("test");
`;

    const result = validateScriptHeader(content);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect deprecated scripts older than 90 days", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    const dateString = oldDate.toISOString().split("T")[0];

    const content = `/**
 * test-script.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * @deprecated since=${dateString} reason="Use new script"
 */

console.log("test");
`;

    const result = validateScriptHeader(content);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("deprecated since");
    expect(result.errors[0]).toContain(">90 days ago");
  });

  it("should allow recently deprecated scripts", () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);
    const dateString = recentDate.toISOString().split("T")[0];

    const content = `/**
 * test-script.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * @deprecated since=${dateString} reason="Use new script"
 */

console.log("test");
`;

    const result = validateScriptHeader(content);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("validateCLIContract", () => {
  it("should validate script with all required flags", () => {
    const content = `
const flags = parseFlags();

if (flags.help) {
  console.log("--dry-run, --yes, --output, --log-level, --cwd");
}
`;

    const result = validateCLIContract(content);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect missing --dry-run flag", () => {
    const content = `
const flags = parseFlags();
// Missing --dry-run
if (flags.yes) {}
if (flags.output) {}
if (flags["log-level"]) {}
if (flags.cwd) {}
`;

    const result = validateCLIContract(content);

    expect(result.valid).toBe(false);
    // The function checks if "--dry-run" string is in content
    // Need to actually not include the string
    const result2 = validateCLIContract(`
const flags = parseFlags();
if (flags.yes) {}
--yes --output --log-level --cwd
`);
    expect(result2.errors).toContain("Missing required CLI flag: --dry-run");
  });

  it("should detect missing --yes flag", () => {
    const content = `
const flags = parseFlags();
--dry-run --output --log-level --cwd
`;

    const result = validateCLIContract(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing required CLI flag: --yes");
  });

  it("should detect missing --output flag", () => {
    const content = `
const flags = parseFlags();
--dry-run --yes --log-level --cwd
`;

    const result = validateCLIContract(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing required CLI flag: --output");
  });

  it("should detect missing --log-level flag", () => {
    const content = `
const flags = parseFlags();
--dry-run --yes --output --cwd
`;

    const result = validateCLIContract(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing required CLI flag: --log-level");
  });

  it("should detect missing --cwd flag", () => {
    const content = `
const flags = parseFlags();
--dry-run --yes --output --log-level
`;

    const result = validateCLIContract(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing required CLI flag: --cwd");
  });

  it("should detect prompt() interactive pattern", () => {
    const content = `
const flags = parseFlags();
if (flags["dry-run"]) {}
if (flags.yes) {}
if (flags.output) {}
if (flags["log-level"]) {}
if (flags.cwd) {}

const answer = prompt("Continue?");
`;

    const result = validateCLIContract(content);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((err) => err.includes("interactive prompt")),
    ).toBe(true);
  });

  it("should detect readline interactive pattern", () => {
    const content = `
const flags = parseFlags();
--dry-run --yes --output --log-level --cwd

import readline from "node:readline";
readline.createInterface();
`;

    const result = validateCLIContract(content);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((err) => err.includes("interactive prompt")),
    ).toBe(true);
  });

  it("should detect inquirer interactive pattern", () => {
    const content = `
const flags = parseFlags();
if (flags["dry-run"]) {}
if (flags.yes) {}
if (flags.output) {}
if (flags["log-level"]) {}
if (flags.cwd) {}

import inquirer from "inquirer";
`;

    const result = validateCLIContract(content);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((err) => err.includes("interactive prompt")),
    ).toBe(true);
  });

  it("should detect .question() interactive pattern", () => {
    const content = `
const flags = parseFlags();
if (flags["dry-run"]) {}
if (flags.yes) {}
if (flags.output) {}
if (flags["log-level"]) {}
if (flags.cwd) {}

rl.question("What is your name?", (answer) => {});
`;

    const result = validateCLIContract(content);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((err) => err.includes("interactive prompt")),
    ).toBe(true);
  });
});

describe("detectDangerousPatterns", () => {
  it("should pass clean script", () => {
    const content = `
import { execa } from "execa";

const result = await execa("git", ["status"]);
console.log(result.stdout);
`;

    const result = detectDangerousPatterns(content);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect sudo usage", () => {
    // Use actual sudo command
    const content = "await execa('sudo', ['apt-get']);\nsudo rm -rf /tmp";

    const result = detectDangerousPatterns(content);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("sudo"))).toBe(true);
  });

  it("should detect dangerous recursive delete", () => {
    const content = `
exec("rm -rf /tmp/data");
`;

    const result = detectDangerousPatterns(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Detected dangerous recursive delete pattern",
    );
  });

  it("should detect child_process.exec usage", () => {
    const content = `
import { exec } from "node:child_process";

child_process.exec("ls -la");
`;

    const result = detectDangerousPatterns(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Detected raw child_process.exec - use execa instead",
    );
  });

  it("should detect eval usage", () => {
    const content = `
const code = "console.log('dynamic')";
eval(code);
`;

    const result = detectDangerousPatterns(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Detected dynamic code execution usage");
  });

  it("should detect API_TOKEN in env access", () => {
    const content = `
const token = process.env.API_TOKEN;
`;

    const result = detectDangerousPatterns(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Potential secret in code");
  });

  it("should detect SECRET in env access", () => {
    const content = `
const secret = process.env.MY_SECRET;
`;

    const result = detectDangerousPatterns(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Potential secret in code");
  });

  it("should detect KEY in env access", () => {
    const content = `
const key = process.env.API_KEY;
`;

    const result = detectDangerousPatterns(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Potential secret in code");
  });

  it("should detect PASSWORD in env access", () => {
    const content = `
const pass = process.env.DB_PASSWORD;
`;

    const result = detectDangerousPatterns(content);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Potential secret in code");
  });

  it("should detect multiple dangerous patterns", () => {
    const content = `
import { exec } from "node:child_process";

const token = process.env.API_TOKEN;
exec("sudo rm -rf /tmp/test");
eval("console.log('dangerous')");
`;

    const result = detectDangerousPatterns(content);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3);
  });
});

describe("checkSizeCompliance", () => {
  it("should pass script under LOC limit", () => {
    const content = `
/**
 * Small script
 */

console.log("Small script");
console.log("Just a few lines");
`;

    const result = checkSizeCompliance(content);

    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("should warn on script over 300 lines", () => {
    const lines = Array(350).fill("console.log('line');").join("\n");

    const result = checkSizeCompliance(lines);

    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("350 lines");
    expect(result.warnings[0]).toContain(">300 LOC limit");
  });

  it("should warn on function over 60 lines", () => {
    const functionContent = `
function largeFunction() {
${Array(65).fill("  console.log('line');").join("\n")}
}
`;

    const result = checkSizeCompliance(functionContent);

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("exceeds 60 lines"))).toBe(
      true,
    );
  });

  it("should warn on async function over 60 lines", () => {
    const functionContent = `
async function largeAsyncFunction() {
${Array(65).fill("  await doSomething();").join("\n")}
}
`;

    const result = checkSizeCompliance(functionContent);

    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("exceeds 60 lines"))).toBe(
      true,
    );
  });

  it("should handle multiple small functions", () => {
    const content = `
function small1() {
  console.log("small");
}

function small2() {
  console.log("small");
}

function small3() {
  console.log("small");
}
`;

    const result = checkSizeCompliance(content);

    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("should detect multiple size violations", () => {
    const lines = Array(350).fill("console.log('line');").join("\n");
    const functionContent = `
function largeFunction1() {
${Array(65).fill("  console.log('line');").join("\n")}
}

function largeFunction2() {
${Array(70).fill("  console.log('line');").join("\n")}
}
`;

    const result = checkSizeCompliance(lines + "\n" + functionContent);

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(2);
  });

  it("should handle scripts with no functions", () => {
    const content = Array(50).fill("console.log('line');").join("\n");

    const result = checkSizeCompliance(content);

    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("should handle empty script", () => {
    const content = "";

    const result = checkSizeCompliance(content);

    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});
