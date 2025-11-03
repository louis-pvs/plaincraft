# ARCH-subissue-fix-retroactive-archive

Lane: C (DevOps & Automation)
Parent: ARCH-subissue-pipeline-repair

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, cleanup

## Purpose

Perform a one-time cleanup that archives orphaned idea files for already-closed issues so `/ideas` only contains active work.

## Problem

The archival workflow (`.github/workflows/idea-lifecycle.yml` + `scripts/archive-idea-for-issue.mjs`) was implemented on Oct 27, 2025. However, **7 issues were closed BEFORE the workflow existed**:

- #26 (ARCH-source-of-truth)
- #29 (ARCH-ideas-issue-sync)
- #30 (ARCH-ideas-pr-integration)
- #31 (ARCH-ideas-changelog-sync)
- #32 (ARCH-ideas-subissues)
- #33 (ARCH-ideas-lifecycle)
- #34 (ARCH-ideas-docs)

Their idea files remain in `/ideas` directory. GitHub Actions only trigger on NEW events after workflow merges, so no retroactive cleanup occurred. The `/ideas/_archive/` directory doesn't exist yet.

## Proposal

Create one-time cleanup script `scripts/archive-closed-ideas.mjs`:

1. Scan all `.md` files in `/ideas` directory
2. For each file, extract `Issue: #N` metadata
3. Check if issue is CLOSED via `gh issue view --json state,stateReason,closedAt`
4. Move closed idea files to `/ideas/_archive/<year>/` directory
5. Commit and push changes with audit trail
6. Support `--dry-run` mode for preview

Future closures will be handled automatically by existing workflow.

Implementation:

```javascript
#!/usr/bin/env node

import { readdir, readFile, mkdir, rename } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join, basename } from "node:path";

const execAsync = promisify(exec);
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const ideasDir = "ideas";
  const files = await readdir(ideasDir);
  const ideaFiles = files.filter(
    (f) => f.endsWith(".md") && !f.startsWith("_"),
  );

  console.log(`Found ${ideaFiles.length} idea files to check\n`);

  let archivedCount = 0;

  for (const file of ideaFiles) {
    const content = await readFile(join(ideasDir, file), "utf-8");
    const issueMatch = content.match(/^Issue: #(\d+)/m);

    if (!issueMatch) {
      console.log(`⏭️  ${file}: No issue number found`);
      continue;
    }

    const issueNumber = issueMatch[1];

    try {
      const { stdout } = await execAsync(
        `gh issue view ${issueNumber} --json state,stateReason,closedAt`,
      );
      const issue = JSON.parse(stdout);

      if (issue.state !== "CLOSED") {
        console.log(`✓ ${file}: Issue #${issueNumber} is still OPEN`);
        continue;
      }

      console.log(
        `📦 ${file}: Issue #${issueNumber} is CLOSED (${issue.stateReason})`,
      );

      if (dryRun) {
        console.log(`   [DRY RUN] Would archive to _archive/2025/${file}`);
      } else {
        const year = new Date(issue.closedAt).getFullYear();
        const archiveDir = join(ideasDir, "_archive", year.toString());
        await mkdir(archiveDir, { recursive: true });

        const sourcePath = join(ideasDir, file);
        const destPath = join(archiveDir, file);
        await rename(sourcePath, destPath);

        console.log(`   ✅ Archived to _archive/${year}/${file}`);
        archivedCount++;
      }
    } catch (error) {
      console.log(`⚠️  ${file}: Error checking issue #${issueNumber}`);
    }
  }

  console.log(
    `\n${dryRun ? "[DRY RUN] Would archive" : "Archived"} ${archivedCount} idea files`,
  );

  if (!dryRun && archivedCount > 0) {
    console.log("\nCommitting changes...");
    await execAsync('git config user.name "github-actions[bot]"');
    await execAsync(
      'git config user.email "github-actions[bot]@users.noreply.github.com"',
    );
    await execAsync(`git add ideas/_archive/ ideas/`);
    await execAsync(
      `git commit -m "chore: retroactive archive of ${archivedCount} closed idea files [skip ci]"`,
    );
    await execAsync("git push");
    console.log("✅ Changes committed and pushed");
  }
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
```

## Acceptance Checklist

- [x] `scripts/archive-closed-ideas.mjs` script created (implemented as `scripts/ops/cleanup-ideas.mjs`)
- [x] Script scans `/ideas` directory for all `.md` files
- [x] Extracts `Issue: #N` metadata from each file
- [x] Checks issue state via `gh issue view --json state`
- [x] Moves CLOSED issue files to `/ideas/_archive/<year>/`
- [x] Creates `_archive/` directory if it doesn't exist
- [x] Test: Dry-run shows 7 files to archive (#26, #29-34)
- [x] Test: Actual run creates `/ideas/_archive/2025/` and moves files
- [x] Test: Active issues (#19, #22, #27) remain in `/ideas` (now also archived since they're closed)
- [x] Git commit includes audit trail with issue numbers
- [x] Documentation: Usage added to `SCRIPTS-REFERENCE.md`
