# CI Architecture Diagram

## Main CI Flow (ci.yml)

```
┌─────────────────────────────────────────────────────────────┐
│  Trigger: push (main, feat/aligned-lanes-v1) | PR           │
└─────────────────────────────────────────────────────────────┘
                            ▼
        ┌───────────────────────────────────┐
        │     Parallel Phase (~60s)         │
        └───────────────────────────────────┘
                    ▼           ▼
        ┌───────────────┐   ┌─────────────────┐
        │     check     │   │ build-storybook │
        │               │   │                 │
        │ • typecheck   │   │ • npm install   │
        │ • lint        │   │ • build SB      │
        │ • unit tests  │   │ • upload artifact│
        │ • JSON output │   └─────────────────┘
        └───────────────┘            │
                │                    │
                │     ┌──────────────┘
                ▼     ▼
        ┌──────────────────────────┐
        │   Sequential Phase       │
        └──────────────────────────┘
                    ▼
        ┌───────────────────────┐
        │   storybook-test      │
        │                       │
        │ • download artifact   │
        │ • serve static        │
        │ • run test-runner     │
        │ • interaction tests   │
        │ • a11y validation     │
        │ • JSON results        │
        └───────────────────────┘
                    │
                    │
        ┌───────────▼───────────┐
        │     build-demo        │
        │                       │
        │ • vite build          │
        │ • upload dist/        │
        └───────────────────────┘
                    │
                    │
        ┌───────────▼───────────┐
        │      summary          │
        │                       │
        │ • aggregate results   │
        │ • post PR comment     │
        │ • show status table   │
        └───────────────────────┘
```

## Recording Flow (record.yml)

```
┌─────────────────────────────────────────────────┐
│  Trigger: nightly (2 AM UTC) | manual          │
└─────────────────────────────────────────────────┘
                    ▼
        ┌───────────────────────┐
        │  record-stories job   │
        └───────────────────────┘
                    ▼
        ┌───────────────────────┐
        │ • build Storybook     │
        │ • install ffmpeg      │
        │ • launch Chromium     │
        └───────────────────────┘
                    ▼
        ┌───────────────────────┐
        │  For each story:      │
        │                       │
        │ 1. Navigate to story  │
        │ 2. Record 5s video    │
        │ 3. Save as .webm      │
        └───────────────────────┘
                    ▼
        ┌───────────────────────┐
        │  For each video:      │
        │                       │
        │ 1. Generate palette   │
        │ 2. Convert to .gif    │
        │ 3. Optimize (800px)   │
        └───────────────────────┘
                    ▼
        ┌───────────────────────┐
        │  Upload artifacts:    │
        │                       │
        │ • videos (7 days)     │
        │ • gifs (30 days)      │
        └───────────────────────┘
```

## Artifact Flow

```
┌──────────────────┐
│  build-storybook │
└────────┬─────────┘
         │
         │ storybook-static/
         │ (artifact)
         ▼
┌──────────────────┐
│  storybook-test  │
└────────┬─────────┘
         │
         │ storybook-test-results.json
         │ (artifact)
         ▼
┌──────────────────┐
│     summary      │
└──────────────────┘

┌──────────────────┐
│      check       │
└────────┬─────────┘
         │
         │ unit-test-results.json
         │ (artifact)
         ▼
┌──────────────────┐
│     summary      │
└──────────────────┘

┌──────────────────┐
│   build-demo     │
└────────┬─────────┘
         │
         │ dist/
         │ (artifact)
         ▼
    (unused, for deployment)
```

## Time Budget Breakdown

```
Baseline (original ci.yml): ~90s
Target: ≤180s (+90s)

Parallel execution strategy:
┌─────────────────────────────────┐
│ 0s-60s: check + build-storybook │  Parallel
├─────────────────────────────────┤
│ 60s-100s: storybook-test        │  Sequential
├─────────────────────────────────┤
│ 100s-130s: build-demo           │  Parallel potential
├─────────────────────────────────┤
│ 130s-135s: summary              │  Sequential
└─────────────────────────────────┘

Total: ~105s (within budget ✅)
```

## Key Optimizations

1. **Parallel job execution** - Independent jobs run simultaneously
2. **Artifact reuse** - Build Storybook once, test multiple times
3. **Browser caching** - Playwright browsers cached between runs
4. **Dependency caching** - pnpm cache reduces install time
5. **Recording separation** - Heavy video work isolated to nightly

## File Ownership Map

```
.github/workflows/
├── ci.yml          ← Pair C (this change)
└── record.yml      ← Pair C (this change)

scripts/
├── new-snippet.mjs        ← Pair A
└── record-stories.mjs     ← Pair C (this change)

artifacts/
└── video/                 ← Pair C (this change)

docs/assets/gif/           ← Pair C creates, Pair B references

.storybook/
├── preview.ts             ← Pair A
└── test-runner.ts         ← Pair C (this change)
```
