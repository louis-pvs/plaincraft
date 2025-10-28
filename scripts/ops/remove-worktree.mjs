/**
 * remove-worktree.mjs
 * @since 2025-10-28
 * @version 0.4.0
 * Summary: Remove git worktrees created for PRs and prune related branches.
 */
import path from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod";
import {
  Logger,
  parseFlags,
  fail,
  succeed,
  repoRoot,
  formatOutput,
  generateRunId,
} from "../_lib/core.mjs";
import { listWorktrees, execCommand, branchExists } from "../_lib/git.mjs";
import { getIssue } from "../_lib/github.mjs";
const SCRIPT_NAME = "remove-worktree";
const SCRIPT_VERSION = "0.4.0";
const HELP_TEXT = `Usage: ${SCRIPT_NAME} [branch|path|--issue <number>] [options]\n\nRemove a git worktree and clean up related branches.\n\nOptions:\n  --help                Show this help message\n  --dry-run             Preview actions (default)\n  --yes                 Execute actions (disables dry-run)\n  --branch <name>       Target branch to clean up\n  --worktree <path>     Worktree path (absolute or relative)\n  --issue <number>      Resolve branch from GitHub issue\n  --keep-branch         Keep local branch after removal\n  --keep-remote         Keep remote branch after removal\n  --no-prune            Skip git worktree prune\n  --force               Ignore dirty worktrees and force branch deletion\n  --output <fmt>        Output format: text (default) or json\n  --log-level <lvl>     error, warn, info (default), debug, trace\n  --cwd <path>          Working directory (defaults to current)\n\nExit codes:\n  0  - Success\n  2  - No changes (dry-run noop)\n  10 - Precondition failed (missing worktree or gh)\n  11 - Validation failed`;
const start = Date.now();
const runId = generateRunId();
const ArgsSchema = z.object({
  dryRun: z.boolean(),
  output: z.enum(["text", "json"]),
  logLevel: z.enum(["error", "warn", "info", "debug", "trace"]),
  cwd: z.string().optional(),
  branch: z.string().optional(),
  issueNumber: z.number().optional(),
  worktreePath: z.string().optional(),
  keepBranch: z.boolean(),
  keepRemote: z.boolean(),
  prune: z.boolean(),
  force: z.boolean(),
});
const coerceBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  const lowered = String(value).toLowerCase();
  if (["false", "0", "no", "off"].includes(lowered)) return false;
  if (["true", "1", "yes", "on"].includes(lowered)) return true;
  return Boolean(value);
};
const parseIssueNumber = (value) => {
  if (value === undefined || value === null) return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};
const resolvePositional = (flags) => {
  const positional = Array.isArray(flags._) ? flags._[0] : undefined;
  if (!positional) return { branch: undefined, worktreePath: undefined };
  const base = flags.cwd ? path.resolve(flags.cwd) : process.cwd();
  const candidate = path.resolve(base, positional);
  return existsSync(candidate)
    ? { branch: undefined, worktreePath: candidate }
    : { branch: positional, worktreePath: undefined };
};
const normalizeFlags = (rawFlags) => {
  const positional = resolvePositional(rawFlags);
  const baseCwd = rawFlags.cwd ? String(rawFlags.cwd) : undefined;
  const resolveMaybePath = (value) =>
    value ? path.resolve(baseCwd || process.cwd(), String(value)) : undefined;
  const prunePreference =
    rawFlags.prune !== undefined
      ? coerceBoolean(rawFlags.prune, true)
      : rawFlags["no-prune"] !== undefined
        ? !coerceBoolean(rawFlags["no-prune"], false)
        : undefined;
  return {
    dryRun:
      rawFlags.dryRun !== undefined
        ? coerceBoolean(rawFlags.dryRun, true)
        : !coerceBoolean(rawFlags.yes, false),
    output: rawFlags.output ? String(rawFlags.output) : "text",
    logLevel: rawFlags.logLevel ? String(rawFlags.logLevel) : "info",
    cwd: baseCwd,
    branch: rawFlags.branch ? String(rawFlags.branch) : positional.branch,
    issueNumber:
      parseIssueNumber(rawFlags.issue) ??
      parseIssueNumber(rawFlags.issueNumber),
    worktreePath:
      resolveMaybePath(rawFlags.worktree) ??
      resolveMaybePath(rawFlags.path) ??
      resolveMaybePath(rawFlags.dir) ??
      positional.worktreePath,
    keepBranch: coerceBoolean(
      rawFlags.keepBranch ?? rawFlags["keep-branch"],
      false,
    ),
    keepRemote: coerceBoolean(
      rawFlags.keepRemote ?? rawFlags["keep-remote"],
      false,
    ),
    prune: prunePreference === undefined ? true : prunePreference,
    force: coerceBoolean(rawFlags.force, false),
  };
};
const listManagedWorktrees = async (root) => {
  const rootPath = path.resolve(root);
  return (await listWorktrees(root)).filter(
    (worktree) => path.resolve(worktree.path) !== rootPath,
  );
};
const generateBranchName = (title) => {
  const tagMatch = title.match(/^\[([A-Z]+-[a-z-]+)\]/);
  const tag = tagMatch ? tagMatch[1].toLowerCase() : "";
  const prefix = tag.startsWith("b-")
    ? "fix"
    : tag.startsWith("arch-")
      ? "refactor"
      : tag.startsWith("d-") || tag.startsWith("pb-")
        ? "chore"
        : "feat";
  const cleaned =
    tag ||
    title
      .toLowerCase()
      .replace(/^\[.*?\]\s*/, "")
      .replace(/[^a-z0-9-\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
  return `${prefix}/${cleaned}`;
};
const summarizeWorktrees = (worktrees) =>
  worktrees.map((wt) => ({ path: wt.path, branch: wt.branch }));
const resolveTarget = async (args, worktrees, root, log) => {
  const byPath = (targetPath) => {
    if (!targetPath) return undefined;
    const normalized = path.resolve(targetPath);
    return worktrees.find((wt) => path.resolve(wt.path) === normalized);
  };
  let branch = args.branch;
  let issue;
  if (!branch && args.issueNumber) {
    log.info(`Fetching issue #${args.issueNumber}...`);
    issue = await getIssue(args.issueNumber, root);
    if (!issue?.title) {
      throw new Error(
        `Unable to resolve branch from issue #${args.issueNumber} (missing title)`,
      );
    }
    branch = generateBranchName(issue.title);
  }
  const target =
    byPath(args.worktreePath) ?? worktrees.find((wt) => wt.branch === branch);
  if (!target && !branch && !args.worktreePath) {
    throw new Error(
      "Specify a branch, issue number, or worktree path to remove",
    );
  }
  if (!target) {
    const detail = args.worktreePath
      ? `path: ${args.worktreePath}`
      : branch
        ? `branch: ${branch}`
        : "unknown target";
    throw new Error(`No worktree found for ${detail}`);
  }
  return { path: target.path, branch: branch ?? target.branch, issue };
};
const ensureWorktreeReady = async (pathToClean, force, log) => {
  if (!pathToClean || !existsSync(pathToClean)) {
    log.warn(
      "Worktree directory not found on disk; proceeding with git metadata cleanup",
    );
    return;
  }
  const dirty =
    (
      await execCommand("git", ["status", "--porcelain"], {
        cwd: pathToClean,
      })
    ).stdout.trim().length > 0;
  if (!dirty) return;
  if (!force) {
    throw new Error(
      "Worktree has uncommitted changes. Use --force to override.",
    );
  }
  log.warn("Proceeding despite uncommitted changes (--force)");
};
const runGit = async (args, root, log, command, message) => {
  const text = `git ${command.join(" ")}`;
  if (args.dryRun) {
    log.info(`[DRY-RUN] ${text}`);
    return false;
  }
  await execCommand("git", command, { cwd: root });
  if (message) log.info(message);
  return true;
};
const deleteLocalBranch = async (branch, args, root, log) => {
  if (args.keepBranch) {
    log.info("Skipping local branch deletion (--keep-branch)");
    return false;
  }
  if (!(await branchExists(branch, root))) {
    log.info(`Local branch ${branch} already absent`);
    return false;
  }
  return runGit(
    args,
    root,
    log,
    ["branch", args.force ? "-D" : "-d", branch],
    `Deleted local branch ${branch}`,
  );
};
const remoteBranchExists = async (branch, root) => {
  try {
    const { stdout } = await execCommand(
      "git",
      ["ls-remote", "--heads", "origin", branch],
      { cwd: root },
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
};
const deleteRemoteBranch = async (branch, args, root, log) => {
  if (args.keepRemote) {
    log.info("Skipping remote branch deletion (--keep-remote)");
    return false;
  }
  if (!(await remoteBranchExists(branch, root))) {
    log.info(`Remote branch origin/${branch} already absent`);
    return false;
  }
  return runGit(
    args,
    root,
    log,
    ["push", "origin", "--delete", branch],
    `Deleted remote branch origin/${branch}`,
  );
};
const pruneWorktrees = async (args, root, log) =>
  args.prune
    ? runGit(args, root, log, ["worktree", "prune"], "Pruned git worktree")
    : (log.info("Skipping git worktree prune (--no-prune)"), false);
const emitNoop = (worktrees, args) => {
  const message = worktrees.length
    ? "No target specified; worktree list returned"
    : "No additional worktrees registered";
  process.stdout.write(
    formatOutput(
      {
        ok: true,
        runId,
        script: SCRIPT_NAME,
        version: SCRIPT_VERSION,
        dryRun: args.dryRun,
        noop: true,
        message,
        availableWorktrees: summarizeWorktrees(worktrees),
        durationMs: Date.now() - start,
      },
      args.output,
    ),
  );
  process.exit(2);
};
const emitSuccess = (result, args, message) =>
  succeed({
    output: args.output,
    ok: true,
    runId,
    script: SCRIPT_NAME,
    version: SCRIPT_VERSION,
    durationMs: Date.now() - start,
    message,
    ...result,
  });
const buildRemovalCommand = (targetPath, force) => {
  const command = ["worktree", "remove"];
  if (force) command.push("--force");
  command.push(targetPath);
  return command;
};
const runWorkflow = async (args, log) => {
  const root = await repoRoot(args.cwd);
  const worktrees = await listManagedWorktrees(root);
  if (!args.branch && !args.worktreePath && !args.issueNumber) {
    emitNoop(worktrees, args);
  }
  if (worktrees.length === 0) {
    throw new Error("No additional worktrees registered");
  }
  const target = await resolveTarget(args, worktrees, root, log);
  await ensureWorktreeReady(target.path, args.force, log);
  const removalCommand = buildRemovalCommand(target.path, args.force);
  const result = {
    branch: target.branch,
    worktreePath: target.path,
    issueNumber: args.issueNumber ?? target.issue?.number,
    issueTitle: target.issue?.title,
    dryRun: args.dryRun,
    removedWorktree: await runGit(
      args,
      root,
      log,
      removalCommand,
      "Removed worktree",
    ),
    deletedLocalBranch: await deleteLocalBranch(target.branch, args, root, log),
    deletedRemoteBranch: await deleteRemoteBranch(
      target.branch,
      args,
      root,
      log,
    ),
    pruned: await pruneWorktrees(args, root, log),
  };
  emitSuccess(
    result,
    args,
    args.dryRun ? "Dry-run complete" : "Worktree cleanup complete",
  );
};
async function main() {
  const rawFlags = parseFlags();
  const logLevel = rawFlags.logLevel ? String(rawFlags.logLevel) : "info";
  const log = new Logger(logLevel);
  if (rawFlags.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }
  try {
    const normalized = normalizeFlags(rawFlags);
    const args = ArgsSchema.parse(normalized);
    await runWorkflow(args, log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      fail({
        script: SCRIPT_NAME,
        message: "Invalid arguments",
        exitCode: 11,
        output: rawFlags.output || "text",
        error: error.format(),
      });
    }
    fail({
      script: SCRIPT_NAME,
      message: error.message,
      exitCode: 10,
      output: rawFlags.output || "text",
      error,
    });
  }
}
main();
