#!/usr/bin/env node
/**
 * commit-msg-hook.mjs
 * @since 2025-10-28
 * @version 1.0.0
 * Git commit-msg hook to enforce compact ticket headers with Conventional Commits
 */

import { readFileSync } from "node:fs";
import { z } from "zod";
import { Logger, parseFlags, fail, succeed, isMain } from "../_lib/core.mjs";
import { getCurrentBranch } from "../_lib/git.mjs";

const SCRIPT_NAME = "commit-msg-hook";

const ALLOWED_TYPES = new Set([
  "feat",
  "fix",
  "perf",
  "refactor",
  "chore",
  "docs",
  "test",
  "build",
  "ci",
  "revert",
]);

const TICKET_ID_PATTERN = /^(ARCH|U|C|B|PB)-\d+$/;
const HEADER_REGEX = /^\[(?<id>(?:ARCH|U|C|B|PB)-\d+)\]\s+(?<type>[a-z]+)(?:\((?<scope>[a-z0-9-]+)\))?:\s(?<subject>.+)$/;
const SLUG_BLOCK_REGEX = /^\[[A-Z]+-[a-z0-9-]{6,}\]/;

// Zod schema for CLI args
const ArgsSchema = z.object({
  help: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  cwd: z.string().optional(),
  commitMsgFile: z.string(),
});

const COMMENT_PREFIX = "#";

/**
 * Extract the first non-comment, non-empty line from the commit message file.
 * @param {string} commitMsg Raw commit message from disk.
 * @returns {string} Header line.
 */
export function extractHeaderLine(commitMsg) {
  const lines = commitMsg.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.trimStart().startsWith(COMMENT_PREFIX)) continue;
    return line.trim();
  }
  return "";
}

/**
 * Extract the first ticket id token (ARCH-1, U-2, etc.) from a string.
 * @param {string|undefined|null} text Source text.
 * @returns {string|null}
 */
export function extractTicketId(text) {
  if (!text) return null;
  const match = text.match(/(ARCH|U|C|B|PB)-\d+/i);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Validate commit header based on ARCH lane policy.
 * @param {object} options
 * @param {string} options.header Header line.
 * @param {string|null} options.branchId Ticket id derived from branch name, if any.
 * @returns {{valid: true, data: object} | {valid: false, error: string, details: string, message: string}}
 */
export function validateHeader({ header, branchId }) {
  if (!header) {
    return {
      valid: false,
      error: "Missing commit header",
      message: "",
      details: "Commit message must start with `[ID] type(scope): subject`.",
    };
  }

  if (header.startsWith("Merge")) {
    return {
      valid: true,
      data: { skipped: true, reason: "merge" },
    };
  }

  if (SLUG_BLOCK_REGEX.test(header)) {
    return {
      valid: false,
      error: "Slug detected in commit header",
      message: header,
      details: "Use numeric ticket id like ARCH-123 instead of long slug names.",
    };
  }

  const bracketMatch = header.match(/^\[(?<raw>[^\]]+)\]/);
  if (!bracketMatch) {
    return {
      valid: false,
      error: "Missing ticket prefix",
      message: header,
      details: "Start commit messages with `[ARCH-123]` (or U/C/B/PB).",
    };
  }

  const ticketId = bracketMatch.groups.raw.toUpperCase();
  if (!TICKET_ID_PATTERN.test(ticketId)) {
    return {
      valid: false,
      error: "Invalid ticket prefix",
      message: header,
      details: "Ticket id must be `[ARCH-123]`, `[U-58]`, `[C-7]`, `[B-1]`, or `[PB-9]`.",
    };
  }

  const afterPrefix = header.slice(bracketMatch[0].length);
  if (!afterPrefix.startsWith(" ")) {
    return {
      valid: false,
      error: "Missing space after ticket id",
      message: header,
      details: "Format requires a single space after the ticket id block.",
    };
  }

  const match = header.match(HEADER_REGEX);
  if (!match) {
    return {
      valid: false,
      error: "Header must follow Conventional Commit format",
      message: header,
      details:
        "Expected `[ID] type(scope): subject` with lowercase type and optional kebab-case scope.",
    };
  }

  const { type, scope, subject } = match.groups;

  if (!ALLOWED_TYPES.has(type)) {
    return {
      valid: false,
      error: "Invalid commit type",
      message: header,
      details:
        "Type must be one of feat, fix, perf, refactor, chore, docs, test, build, ci, revert.",
    };
  }

  if (scope && !/^[a-z0-9-]+$/.test(scope)) {
    return {
      valid: false,
      error: "Invalid scope",
      message: header,
      details: "Scope must be kebab-case using lowercase letters, numbers, and hyphens.",
    };
  }

  const trimmedSubject = subject.trim();
  if (!trimmedSubject) {
    return {
      valid: false,
      error: "Missing commit subject",
      message: header,
      details: "Provide a short imperative subject after the colon.",
    };
  }

  if (trimmedSubject.length > 72) {
    return {
      valid: false,
      error: "Subject too long",
      message: header,
      details: "Subject must be 72 characters or fewer.",
    };
  }

  if (header.length > 100) {
    return {
      valid: false,
      error: "Header too long",
      message: header,
      details: "Commit header must be 100 characters or fewer.",
    };
  }

  if (trimmedSubject.endsWith(".")) {
    return {
      valid: false,
      error: "Subject must not end with a period",
      message: header,
      details: "Drop trailing punctuation from the subject line.",
    };
  }

  if (branchId && branchId !== ticketId) {
    return {
      valid: false,
      error: "Ticket id does not match branch",
      message: header,
      details: `Branch expects ${branchId} but found ${ticketId}. Update the commit header or rename the branch.`,
    };
  }

  return {
    valid: true,
    data: {
      ticketId,
      type,
      scope: scope || null,
      subject: trimmedSubject,
      branchId: branchId || null,
      header,
    },
  };
}

/**
 * Main entry point
 */
async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  if (flags.help) {
    console.log(`
Usage: ${SCRIPT_NAME} <commit-msg-file>

Enforces ARCH commit policy:
  [ID] type(scope): subject

Arguments:
  commit-msg-file   Path to commit message file (provided by Git)

Options:
  --help            Show help
  --output <fmt>    text | json (default text)
  --log-level <lvl> trace|debug|info|warn|error (default info)

Rules enforced:
  - Ticket id is ARCH-#, U-#, C-#, B-#, or PB-#
  - Type is one of feat|fix|perf|refactor|chore|docs|test|build|ci|revert
  - Optional scope is kebab-case
  - Subject ≤ 72 chars, header ≤ 100 chars, no trailing period
  - Ticket id must match the current branch id when present
`);
    process.exit(0);
  }

  try {
    const commitMsgFile = flags._?.[0] || flags.commitMsgFile;
    const args = ArgsSchema.parse({
      ...flags,
      commitMsgFile,
    });

    let rawCommitMsg;
    try {
      rawCommitMsg = readFileSync(args.commitMsgFile, "utf8");
    } catch (error) {
      fail({
        script: SCRIPT_NAME,
        message: `Failed to read commit message file: ${error.message}`,
        exitCode: 11,
        output: args.output,
        error,
      });
      return;
    }

    const header = extractHeaderLine(rawCommitMsg);

    // Skip empty commits (git commit --allow-empty -m "") to keep parity with Git's behaviour
    if (!header && !rawCommitMsg.trim()) {
      succeed({
        script: SCRIPT_NAME,
        message: "Skipped validation (empty message)",
        exitCode: 0,
        output: args.output,
        data: { skipped: true, reason: "empty" },
      });
      return;
    }

    const cwd = args.cwd || process.cwd();
    let branchId = null;
    try {
      const branchName = await getCurrentBranch(cwd);
      branchId = extractTicketId(branchName);
    } catch (error) {
      log.warn("Unable to resolve current branch:", error.message);
    }

    const result = validateHeader({ header, branchId });

    if (!result.valid) {
      log.error(result.error);
      fail({
        script: SCRIPT_NAME,
        message: result.error,
        exitCode: 1,
        output: args.output,
        data: {
          header,
          ...result,
        },
      });
      return;
    }

    if (result.data?.skipped) {
      succeed({
        script: SCRIPT_NAME,
        message: `Skipped validation (${result.data.reason})`,
        exitCode: 0,
        output: args.output,
        data: result.data,
      });
      return;
    }

    log.info("Commit message valid");
    succeed({
      script: SCRIPT_NAME,
      message: "Valid commit message",
      exitCode: 0,
      output: args.output,
      data: result.data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      fail({
        script: SCRIPT_NAME,
        message: "Invalid arguments",
        exitCode: 11,
        output: flags.output || "text",
        error,
      });
      return;
    }

    fail({
      script: SCRIPT_NAME,
      message: error.message,
      output: flags.output || "text",
      error,
    });
    return;
  }
}

if (isMain(import.meta)) {
  main();
}
