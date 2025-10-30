# Scripts-First Lifecycle v3

Lane: D (Program Operations)
Issue: 92

## Problem

Ideas and GitHub Projects drift whenever humans make manual updates. Branches
spawn without tickets, PRs forget to bump state, and automation becomes a nag
instead of the source of truth. The current lifecycle relies on tribal
knowledge, leading to duplicate branches, stale acceptance checklists, and
misaligned changelog entries.

## Signal

- 4 of the last 7 feature efforts had cards stuck in “Ticketed” after merge.
- Commit-compliance hooks blocked 18% of commits last sprint for missing IDs.
- Contributors routinely ask which scripts to run first, indicating the CLI
  contract is unclear.

## Hunch

If we make scripts the only way to transition status—codifying intake, branch,
PR, and closeout flows—then Projects can stay authoritative while ideas remain
the narrative source. A hardened helper layer plus focused lifecycle commands
will keep humans from fighting automation and shrink onboarding time.

**North Star:** Ideas live as files; **status lives in GitHub Projects**. Scripts reconcile the two, open branches/PRs, and police commits. Workflows can observe, never rule.

## Single source of truth

- **Content SoT:** `ideas/*.md` (title, rationale, acceptance, links)
- **Status SoT:** GitHub Projects v2 (custom fields below)
- **Key:** `ID` like `ARCH-123`, `U-58` embedded in idea filename and Project item

## Project schema (minimal, enough to run a shop)

Custom fields on your Project:

- `ID` text (ARCH-123…)
- `Type` single-select: Unit, Composition, Bug, Arch, Playbook
- `Lane` single-select: A, B, C, D
- `Status` single-select: Draft, Ticketed, Branched, PR Open, In Review, Merged, Archived
- `Owner` user
- `Priority` single-select: P1–P4
- `Release` text or iteration

# State machine

```
Draft → Ticketed → Branched → PR Open → In Review → Merged → Archived
    ^            \______________________________/         \
    └────────────── Rework ←─────────────── Review fail    └→ Rollback (hotfix path)
```

- **Transitions** are triggered **only** by scripts. If a human flips Project fields by hand, reconciliation will either accept it or revert it based on rules below.

# Repo contracts

```
/ideas/
  ARCH-123-subissue-pipeline.md
  U-58-inline-edit.md
/scripts/
  _lib/
    gh.mjs             # thin Octokit or `gh api` wrapper
    projects.mjs       # read/update Project items + caching
    git.mjs            # branch/commit helpers
    id.mjs             # ID parsing/validation
  ops/
    idea-intake.mjs            # file ↔ project create/sync
    create-branch.mjs          # type/ID-slug from Project
    open-or-update-pr.mjs      # PR metadata from Project
    commit-guard.mjs           # local validator; CI also calls it
    reconcile-status.mjs       # SoT merge (project vs file)
    closeout.mjs               # post-merge cleanup + changelog
    report.mjs                 # dashboard JSON for CI badge
  checks/
    policy.mjs         # lint IDs, required fields, headings
    drift.mjs          # detect manual edits vs SoT
```

# Guardrails

1. **Idempotent by default**
   All ops accept `--dry-run` and exit `2` on noop convergence.
2. **Auth once**
   Scripts read `GITHUB_TOKEN` only; no personal tokens sprinkled in code.
3. **Projects is status-SoT**
   If `ideas/` status disagrees with Project `Status`, **Project wins**; idea frontmatter is rewritten on reconcile.
4. **Commits are boring**
   Commit headers must be `[ID] type(scope): subject`. Slugs in PR title only.
5. **No silent branch creation**
   Branches only come from `create-branch.mjs` with a valid Project item in `Ticketed`.
6. **10-minute rule**
   Clean clone can run any happy-path script flow in under 10 minutes.

# Invariants

- Exactly one Project item per `ID`.
- Exactly one branch per `ID` open at a time.
- Exactly one PR open per `ID`.
- PR title starts with `[ID]`. Commits all match the same ID.
- Reconcilers never delete content; they archive and link.

# CLI: the only four commands devs need

```bash
# 1) Intake: create or sync Project item from an idea file
pnpm ops:idea-intake --file ideas/ARCH-123-subissue-pipeline.md --lane C --type Arch --owner @louis --priority P2

# 2) Branch: open a branch from a ticketed item
pnpm ops:create-branch --id ARCH-123 --type feat --slug subissue-pipeline-repair
# creates feat/ARCH-123-subissue-pipeline-repair and moves Status → Branched

# 3) PR: open or refresh a draft PR
pnpm ops:open-or-update-pr --id ARCH-123
# sets title "[ARCH-123] subissue-pipeline-repair — draft", moves Status → PR Open

# 4) Closeout: after merge
pnpm ops:closeout --id ARCH-123
# deletes branch, sets Status → Merged, appends changelog, archives idea if flagged
```

# Reconciliation rules

- **idea-intake.mjs**
  - If no Project item, create one with fields from idea frontmatter.
  - If exists, update fields that belong to content (Type, Lane, Owner) but never overwrite `Status` unless idea had `statusOverride: true`.

- **reconcile-status.mjs**
  - Project `Status` drives the idea’s frontmatter `status`.
  - If PR exists but Project says `Branched`, bump to `PR Open`.
  - If PR merged but Project not `Merged`, bump and stamp `mergedAt`.

# Branching & commit rules (scripts enforce)

- **Branch name:** `feat|fix|chore|docs|ci/ID-slug`
- **Commit header:** `[ID] type(scope): subject`
- **PR title:** `[ID] slug — <short subject>`
- **prepare-commit-msg hook** calls `ops/commit-guard.mjs --prepare`, prefills header from branch ID.
- **commit-msg hook** rejects anything not matching the regex. CI calls the same guard across the PR range.

# Minimal implementations (skeletons)

## `scripts/_lib/gh.mjs`

```js
import { Octokit } from "octokit";
export const gh = new Octokit({ auth: process.env.GITHUB_TOKEN });
export const repo = {
  owner: process.env.GITHUB_REPOSITORY.split("/")[0],
  repo: process.env.GITHUB_REPOSITORY.split("/")[1],
};
```

## `scripts/ops/create-branch.mjs`

```js
#!/usr/bin/env node
import { gh, repo } from "../_lib/gh.mjs";
import { execFileSync } from "node:child_process";
import { z } from "zod";

const Args = z.object({
  id: z.string().regex(/^[A-Z]+-\d+$/),
  type: z.enum(["feat", "fix", "chore", "docs", "ci"]),
  slug: z.string().min(3),
  yes: z.boolean().default(false),
  dryRun: z.boolean().default(true),
});
const a = Args.parse(parse(process.argv));
const name = `${a.type}/${a.id}-${a.slug}`;
if (a.dryRun || !a.yes) {
  console.log(JSON.stringify({ plan: { branch: name } }, null, 2));
  process.exit(2);
}
execFileSync("git", ["switch", process.env.GITHUB_BASE_REF || "main"]);
execFileSync("git", ["switch", "-c", name]);
await gh.request("PATCH /projects/columns/cards", {}); // placeholder: your projects update
console.log(JSON.stringify({ ok: true, branch: name }));
function parse(argv) {
  /* trivial flag parser */ return {
    id: argv[2],
    type: argv[3],
    slug: argv[4],
    yes: true,
    dryRun: false,
  };
}
```

## `scripts/ops/open-or-update-pr.mjs`

```js
#!/usr/bin/env node
import { gh, repo } from "../_lib/gh.mjs";
const id = process.argv[2]; // e.g. ARCH-123
const branch =
  process.env.GITHUB_REF_NAME ||
  (await sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]));
const title = `[${id}] ${branch.split("/").slice(1).join("/")} — draft`;
const { data: prs } = await gh.rest.pulls.list({
  ...repo,
  head: `${repo.owner}:${branch}`,
  state: "open",
});
if (prs.length) {
  await gh.rest.pulls.update({
    ...repo,
    pull_number: prs[0].number,
    title,
    draft: true,
  });
} else {
  await gh.rest.pulls.create({
    ...repo,
    title,
    head: branch,
    base: "main",
    draft: true,
    body: `Linked ticket: ${id}`,
  });
}
// bump Project.Status → "PR Open" here via GraphQL
```

## `scripts/ops/commit-guard.mjs`

```js
#!/usr/bin/env node
import fs from "node:fs";
const file = process.argv[2]; // .git/COMMIT_EDITMSG
const msg = fs.readFileSync(file, "utf8").trim();
const ok =
  /^\[([A-Z]+-\d+)\]\s+(feat|fix|perf|refactor|chore|docs|test|build|ci)(\([a-z0-9-]+\))?:\s.{1,72}$/.test(
    msg,
  );
const banned = /^\[[A-Z]+-[a-z0-9-]{6,}\]/.test(msg);
if (!ok || banned) {
  console.error("Commit must be: [ID] type(scope): subject, no slug IDs.");
  process.exit(1);
}
```

# Projects API note

- Use GraphQL for Projects v2 fields. Cache the Project `node_id` and field IDs in `.repo/projects.json` so you don’t re-discover every run.
- Rate limits: batch queries; don’t fetch the Galaxy for one transition.
- Reconciliation runs should use ETags or If-None-Match to skip unchanged.

# Drift prevention you already have, now formalized

- **Idempotency tokens:** write `<!-- ticket:ID:sha -->` into idea files; scripts check before re-writing.
- **Locks:** when a script starts a transition, set `status:Pending-*` in Project to ward off desk-clickers; clear on success or timeout.
- **Dry-run default:** every `ops/*` prints plan JSON; `--yes` flips the switch.

# Default flows

### New work

```bash
pnpm ops:idea-intake --file ideas/ARCH-123-foo.md --lane C --type Arch
pnpm ops:create-branch --id ARCH-123 --type feat --slug foo --yes
pnpm ops:open-or-update-pr --id ARCH-123
# code...
git commit -m "[ARCH-123] feat(core): implement foo"
```

### Review → merge

- On merge webhook, run `pnpm ops:closeout --id ARCH-123 --yes`
- That deletes branch, bumps Project to Merged, updates changelog, optionally archives idea.

# CI glue (minimal, non-bossy)

- `commit_compliance.yml` calls `ops/commit-guard.mjs` over the PR range.
- `status_report.yml` runs `ops/report.mjs` to publish a JSON dashboard artifact.
- That’s it. No orchestration in Actions; they just verify and surface.

# Tripwires

- PR opened without `[ID]` in title → fail compliance.
- Branch without `ID` pattern → refuse PR creation.
- Two Project items with the same `ID` → `drift.mjs` opens a blocking Issue.
- Script runtime > 5 minutes regularly → split into read/act phases.

# Acceptance checklist

- [ ] Project has required fields and IDs cached in `.repo/projects.json`
- [ ] Four ops scripts run locally on clean clone in < 10 minutes total
- [ ] Commit guard blocks nonconforming messages locally and in CI
- [ ] Reconciliation updates idea frontmatter to Project status within one command
- [ ] One example idea has gone end-to-end: Draft → Archived with artifacts

You chose scripts. Good. That means **policy lives in code you own**, not some YAML priesthood. Ship these pieces and your lifecycle will hum, whether or not the workflow gods are in a good mood today.
