#!/usr/bin/env node
/**
 * prepare-commit-msg-hook.mjs
 * @since 2025-10-28
 * Prefills commit headers using the branch ticket id.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { Logger, parseFlags, succeed, fail, isMain } from "../_lib/core.mjs";
import { getCurrentBranch } from "../_lib/git.mjs";
import { extractTicketId } from "./commit-msg-hook.mjs";

const SCRIPT_NAME = "prepare-commit-msg-hook";
const SKIP_SOURCES = new Set(["merge", "squash"]);

const ArgsSchema = z.object({
  help: z.boolean().default(false),
  output: z.enum(["text", "json"]).default("text"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  cwd: z.string().optional(),
  commitMsgFile: z.string(),
  commitSource: z.string().optional(),
  sha1: z.string().optional(),
});

function shouldSkip(commitSource) {
  if (!commitSource) return false;
  return SKIP_SOURCES.has(commitSource.toLowerCase());
}

function buildHeader(ticketId, subject) {
  const trimmedSubject = subject ? subject.trim() : "";
  if (trimmedSubject) {
    return `[${ticketId}] type(scope): ${trimmedSubject}`;
  }
  return `[${ticketId}] type(scope): `;
}

export function prepareCommitHeader(lines, ticketId) {
  const originalLines = [...lines];
  const updatedLines = [...lines];

  const headerIndex = updatedLines.findIndex((line) => {
    if (!line.trim()) return false;
    return !line.trimStart().startsWith("#");
  });

  const headerLine = headerIndex >= 0 ? updatedLines[headerIndex].trim() : "";

  if (headerLine.startsWith("Merge")) {
    return { lines: originalLines, modified: false, skipReason: "merge" };
  }

  if (headerIndex === -1) {
    return {
      lines: [`[${ticketId}] type(scope): `, ...originalLines],
      modified: true,
      skipReason: null,
    };
  }

  const existingId = extractTicketId(headerLine);

  if (!headerLine.startsWith("[")) {
    updatedLines[headerIndex] = buildHeader(ticketId, headerLine);
  } else if (!existingId) {
    const stripped = headerLine.replace(/^\[[^\]]+\]\s*/, "");
    updatedLines[headerIndex] = buildHeader(ticketId, stripped);
  } else if (existingId !== ticketId) {
    updatedLines[headerIndex] = headerLine.replace(
      /^\[[^\]]+\]/,
      `[${ticketId}]`,
    );
  } else if (!/^\[[^\]]+\]\s+[a-z]+/.test(headerLine)) {
    const stripped = headerLine.replace(/^\[[^\]]+\]\s*/, "");
    updatedLines[headerIndex] = buildHeader(ticketId, stripped);
  }

  const modified =
    updatedLines.length !== originalLines.length ||
    updatedLines.some((line, index) => line !== originalLines[index]);

  return { lines: modified ? updatedLines : originalLines, modified, skipReason: null };
}

async function main() {
  const flags = parseFlags();
  const log = new Logger(flags.logLevel);

  if (flags.help) {
    console.log(`
Usage: ${SCRIPT_NAME} <commit-msg-file> [commit-source] [sha1]

Auto-populates the commit header based on the current branch ticket id.

Rules:
  - Extracts first [ID] token from branch name (ARCH-#, U-#, C-#, B-#, PB-#)
  - Prefills header as: [ID] type(scope):
  - If a message already exists without the ticket id, prepends the id.
  - If an id is present but mismatched, rewrites it to match the branch.
`);
    process.exit(0);
  }

  try {
    const commitMsgFile = flags._?.[0] || flags.commitMsgFile;
    const commitSource = flags._?.[1] || flags.commitSource;
    const sha1 = flags._?.[2] || flags.sha1;

    const args = ArgsSchema.parse({
      ...flags,
      commitMsgFile,
      commitSource,
      sha1,
    });

    if (shouldSkip(args.commitSource)) {
      succeed({
        script: SCRIPT_NAME,
        message: `Skipped (${args.commitSource} commit)`,
        exitCode: 0,
        output: args.output,
        data: { skipped: true, reason: args.commitSource },
      });
      return;
    }

    const cwd = args.cwd || process.cwd();
    let branchId = null;
    try {
      const branch = await getCurrentBranch(cwd);
      branchId = extractTicketId(branch);
    } catch (error) {
      log.warn("Unable to resolve branch name:", error.message);
    }

    if (!branchId) {
      succeed({
        script: SCRIPT_NAME,
        message: "Skipped (no ticket id on branch)",
        exitCode: 0,
        output: args.output,
        data: { skipped: true, reason: "missing-branch-id" },
      });
      return;
    }

    let fileContents;
    try {
      fileContents = readFileSync(args.commitMsgFile, "utf8");
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

    const lines = fileContents.split(/\r?\n/);
    const { lines: nextLines, modified, skipReason } = prepareCommitHeader(
      lines,
      branchId,
    );

    if (skipReason === "merge") {
      succeed({
        script: SCRIPT_NAME,
        message: "Skipped (merge commit)",
        exitCode: 0,
        output: args.output,
        data: { skipped: true, reason: "merge" },
      });
      return;
    }

    const updatedContents = nextLines.join("\n");
    if (modified) {
      writeFileSync(args.commitMsgFile, updatedContents, "utf8");
      log.info(`Prefilled commit header with ${branchId}`);
    } else {
      log.debug("No changes needed for commit message header");
    }

    succeed({
      script: SCRIPT_NAME,
      message: "prepare-commit-msg hook complete",
      exitCode: 0,
      output: args.output,
      data: { branchId, modified },
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
