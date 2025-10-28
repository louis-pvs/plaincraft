# Scripts Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         /scripts Directory                               │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
                ▼                    ▼                    ▼
    ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
    │   Pure Helpers   │ │  Orchestrators   │ │   Validators     │
    │     (_lib/)      │ │     (ops/)       │ │   (checks/)      │
    └──────────────────┘ └──────────────────┘ └──────────────────┘
            │                    │                    │
            ├─ core.mjs          ├─ bump-version     ├─ policy-lint
            ├─ git.mjs           ├─ setup-labels*    ├─ smoke
            ├─ github.mjs        ├─ create-worktree* └─ validate-ideas*
            ├─ validation.mjs    ├─ ideas-to-issues*
            └─ allowlist.json    └─ ...
                │
                └── No I/O side effects
                    ▲
                    │ import & use
                    │
    ┌───────────────┴────────────────┐
    │                                │
    ▼                                ▼
┌────────────┐              ┌────────────┐
│ migration/ │              │DEPRECATED/ │
│            │              │            │
│ one-off    │              │ 90-day     │
│ scripts    │              │ shims      │
└────────────┘              └────────────┘

                    * = planned migration

```

## Data Flow

```
┌──────────┐
│   User   │
│  or CI   │
└────┬─────┘
     │
     │ $ node scripts/ops/bump-version.mjs --yes
     ▼
┌─────────────────────────────────────────┐
│   ops/bump-version.mjs                  │
│   ┌─────────────────────────────────┐   │
│   │ 1. Parse CLI flags              │   │
│   │ 2. Validate with zod            │   │
│   │ 3. Run preflight checks         │   │
│   └─────────────────────────────────┘   │
└────┬────────────────────────────────────┘
     │
     │ imports helpers
     ▼
┌─────────────────────────────────────────┐
│   _lib modules                          │
│   ┌─────────────────────────────────┐   │
│   │ core.mjs:                       │   │
│   │  - parseFlags()                 │   │
│   │  - repoRoot()                   │   │
│   │  - atomicWrite()                │   │
│   │  - Logger                       │   │
│   │                                 │   │
│   │ git.mjs:                        │   │
│   │  - getRecentCommits()           │   │
│   │  - isGitClean()                 │   │
│   └─────────────────────────────────┘   │
└────┬────────────────────────────────────┘
     │
     │ perform operations
     ▼
┌─────────────────────────────────────────┐
│   File System / Git / GitHub            │
│   - package.json                        │
│   - git commits                         │
│   - GitHub issues/PRs                   │
└────┬────────────────────────────────────┘
     │
     │ return structured output
     ▼
┌─────────────────────────────────────────┐
│   Output (STDOUT)                       │
│   ┌─────────────────────────────────┐   │
│   │ JSON (--output json):           │   │
│   │ {                               │   │
│   │   "runId": "...",               │   │
│   │   "script": "bump-version",     │   │
│   │   "ok": true,                   │   │
│   │   "durationMs": 123             │   │
│   │ }                               │   │
│   │                                 │   │
│   │ Text (--output text):           │   │
│   │ runId: ...                      │   │
│   │ script: bump-version            │   │
│   │ ...                             │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Validation Flow

```
┌──────────────────────────────────────┐
│  pnpm scripts:guardrails             │
└────┬────────────┬─────────────┬──────┘
     │            │             │
     ▼            ▼             ▼
┌─────────┐ ┌──────────┐ ┌──────────┐
│ Policy  │ │   Unit   │ │  Smoke   │
│  Lint   │ │  Tests   │ │  Tests   │
└────┬────┘ └────┬─────┘ └────┬─────┘
     │           │            │
     ▼           ▼            ▼
┌─────────────────────────────────────┐
│  All Checks Pass?                   │
│  ├─ Headers present?                │
│  ├─ CLI contract implemented?       │
│  ├─ No dangerous patterns?          │
│  ├─ Size limits OK?                 │
│  ├─ Tests passing?                  │
│  └─ Scripts respond to --help?      │
└────┬────────────────────────────────┘
     │
     ├─── Pass ──► Exit 0 ✅
     │
     └─── Fail ──► Exit 11 ❌
                   (detailed report)
```

## CLI Contract Implementation

```
Every script must support:

    ┌──────────────────────────────────────────┐
    │  --help          Show usage and exit     │
    ├──────────────────────────────────────────┤
    │  --dry-run       Preview (default: true) │
    ├──────────────────────────────────────────┤
    │  --yes, -y       Execute writes          │
    ├──────────────────────────────────────────┤
    │  --output        json|text (default:     │
    │                  text)                   │
    ├──────────────────────────────────────────┤
    │  --log-level     trace|debug|info|warn   │
    │                  |error (default: info)  │
    ├──────────────────────────────────────────┤
    │  --cwd           Working directory        │
    └──────────────────────────────────────────┘

         All logs → STDERR
         All data → STDOUT (JSON when --output json)
```

## Exit Code Semantics

```
┌─────┬──────────────────┬─────────────────────────────┐
│Code │ Meaning          │ When to Use                 │
├─────┼──────────────────┼─────────────────────────────┤
│  0  │ Success          │ Operation completed         │
├─────┼──────────────────┼─────────────────────────────┤
│  2  │ Noop             │ Already done, converged     │
├─────┼──────────────────┼─────────────────────────────┤
│  3  │ Partial success  │ Some steps failed, retry    │
├─────┼──────────────────┼─────────────────────────────┤
│ 10  │ Precondition     │ Not in repo, missing files  │
├─────┼──────────────────┼─────────────────────────────┤
│ 11  │ Validation       │ Invalid input, bad schema   │
├─────┼──────────────────┼─────────────────────────────┤
│ 13  │ Unsafe           │ Missing secrets, dangerous  │
└─────┴──────────────────┴─────────────────────────────┘
```

## Dependency Graph (Current)

```
ops/bump-version.mjs
    ├── _lib/core.mjs
    │   ├── node:fs/promises
    │   ├── node:path
    │   ├── node:os
    │   └── node:crypto
    │
    ├── _lib/git.mjs
    │   └── execa
    │
    └── zod

checks/policy-lint.mjs
    ├── _lib/core.mjs
    ├── _lib/validation.mjs
    │   └── _lib/allowlist.json
    └── node:fs/promises

checks/smoke.mjs
    ├── _lib/core.mjs
    ├── execa
    └── node:fs/promises
```

## Migration Phases

```
Phase 1: Foundation ✅
    ├── Create structure
    ├── Build _lib modules
    ├── Create enforcement tools
    ├── Example migration (bump-version)
    └── Documentation

Phase 2: Extract Libraries (Next)
    ├── _lib/ideas.mjs
    ├── _lib/markdown.mjs
    ├── _lib/changelog.mjs
    └── _lib/pr.mjs

Phase 3: Migrate High Priority (5 scripts)
    ├── setup-labels
    ├── validate-ideas
    ├── check-ci
    ├── create-worktree-pr
    └── ideas-to-issues

Phase 4: Migrate Medium Priority (10 scripts)

Phase 5: Migrate Low Priority / One-offs (11 scripts)

Phase 6: Deprecation & Cleanup
    ├── Create redirect shims
    ├── 90-day grace period
    └── Auto-removal via CI
```

## Timeline

```
Week 1 (Current)     Week 2           Week 3           Week 4
┌────────────┐      ┌────────────┐   ┌────────────┐   ┌────────────┐
│ Foundation │ ✅   │  5 scripts │   │  Remaining │   │   Polish   │
│            │      │  + tests   │   │  scripts   │   │   Review   │
└────────────┘      └────────────┘   └────────────┘   └────────────┘
                                                             │
                                                             ▼
                                                       90 days later
                                                      ┌────────────┐
                                                      │   Remove   │
                                                      │ DEPRECATED │
                                                      └────────────┘
```
