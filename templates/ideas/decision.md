## Decision

- Deprecate `/guides` for developer workflow.
- Each collection folder owns a **README.md** as the developer entry point.
- “View/read” narratives live only in **Storybook docs** and the **Playbook site** (Lane B).
- Keep **template-first** as the core rule.

## Scope

- Lane C ships guardrails and CI.
- Lane B curates Playbook narratives and visual roadmaps.
- Lane A keeps Autodocs and interaction tests.

---

## Folder contracts

```
/templates/
  <name>/
    README.md
    USAGE.md
    template.config.json

/snippets|components|flows|scripts/
  <thing>/
    README.md         # developer how-to (thin), links to template USAGE
    <code>...

/storybook/
  docs/
    <topic>.mdx       # view/read pages with examples and links

/playbook/
  pages/
    <pattern>.md      # business-facing narratives

/guides/
  _archive/YYYY/      # deprecations only
  README.md           # stub explaining the policy and linking out
```

---

## Guardrails

1. Template before README
   - Any README must reference a real `/templates/<name>@vX.Y` in a “Scaffold” step. No template, no README.

2. README is thin
   - Cap 400 words. Must include headings: “When to use”, “Scaffold”, “Wire”, “Test”, “Rollback”, “Links”.
   - No API tables, no prose tutorials. Link to USAGE or Storybook.

3. Views live in Lane B
   - Anything meant to be read or explained at length goes to Storybook docs or Playbook. READMEs link out.

4. One owner
   - Each README has an owner line at the bottom. If owner leaves, archive or reassign in the same PR.

5. Executable steps only
   - Every step calls a repo script or local binary. Narrative lines limited to 3 per section.

6. Never block on README
   - CI can warn on missing READMEs, but merges are blocked only by template or test failures.

---

## Invariants

- Every code unit with a README has a `scaffold_ref` to a versioned template.
- Every template has README, USAGE, config.
- Storybook docs and Playbook pages do not duplicate steps already in README/USAGE.
- Clean clone can execute every README “Scaffold” and “Test” in under 10 minutes.

---

## README skeleton

````md
# <Unit/Flow name>

## When to use

- <1–3 bullets>

## Scaffold

```bash
pnpm run new:template <name>          # or link an existing one
# scaffold_ref: /templates/<name>@v0.2
```
````

## Wire

- Import path, minimal code snippet.

## Test

```bash
pnpm storybook:test
```

## Rollback

```bash
git revert <sha>..HEAD
```

## Links

- USAGE: /templates/<name>/USAGE.md
- Storybook: /storybook/?path=/docs/<route>
- Playbook: /playbook/<pattern>

_Owner: @handle_

````

---

## Storybook docs page stub (mdx)
```mdx
import { Meta } from '@storybook/blocks';
<Meta title="Patterns/Inline Edit" />

# Inline Edit (view)
Short rationale, constraints, examples.

- Developer steps live in the unit’s README.
- Template: `/templates/inline-edit@v0.2`.
````

---

## CI changes (Lane C)

**Remove** guide ratio checks. **Add** README and template checks.

1. `docs-governance.yml`

- Run on changes to `templates/**`, `**/README.md`, `storybook/docs/**`, `playbook/pages/**`.

2. `scripts/checks/readme-lint.mjs`

- Assert required headings, max 400 words, presence of `scaffold_ref` path, code blocks executable names.

3. `scripts/checks/template-coverage.mjs` (rev)

- Ensure every template has README, USAGE, config.
- Ensure every live unit has either a README or an explicit `// no-readme` marker with justification.

4. `scripts/checks/view-dedupe.mjs`

- Fail if Storybook docs or Playbook page contains step blocks that already exist in README/USAGE.

5. Policy in code:

```json
{
  "scripts": {
    "docs:lint": "node scripts/checks/readme-lint.mjs && node scripts/checks/template-coverage.mjs",
    "docs:views": "node scripts/checks/view-dedupe.mjs"
  }
}
```

**Tripwires**

- README missing scaffold_ref → warn, not block.
- Missing template or failing tests → block.

---

## Migration playbook

1. Archive guides

```bash
mkdir -p guides/_archive/2025
git mv guides/*.md guides/_archive/2025/ || true
printf "# Deprecated\nSee folder READMEs, Storybook, or Playbook.\n" > guides/README.md
```

2. Generate folder READMEs from existing guides

```bash
pnpm run new:readme --from guides/_archive/2025/<file>.md --to snippets/<unit>/README.md
```

3. Lift “view” parts into Storybook/Playbook

- Move rationale, diagrams, longer narratives to `storybook/docs` or `playbook/pages`.

4. Wire CI

- Replace guide checks with README/template checks.

5. Announce

- One PR with ADR summary and examples. Require Lane B to sign off on moved content.

---

## ADR snippet (drop in `/docs/adr/2025-10-Overarching-v2.md`)

- Context: guides folder bloat risk, developers need fast how-to, business needs narratives.
- Decision: developer instructions live in folder READMEs; narratives live in Storybook/Playbook.
- Consequences: simpler maintenance, fewer duplicates, stronger template coupling.

---

## Acceptance checklist

- [x] All prior guides archived, stub exists in `/guides/README.md`
- [ ] Each unit has a README with scaffold_ref and headings
- [ ] At least one Storybook doc or Playbook page exists for any narrative content
- [x] CI warns on README misses, blocks on template or test failures
- [ ] README steps validated on a clean clone within 10 minutes
- [ ] Owners assigned on every README

---

## Notes on your handwritten points

- “Deprecate all guides to README for developers” → done above.
- “Guide for view and read live in Storybook/Playbook and Lane B job” → scoped and staffed.
- “Same principles, ratio” → ratio now applies template to view pages, not template to guides.
- “Avoid blocking on developer guides (README)” → enforced as warnings. Only templates and tests block.

If you want, I can spit out the `readme-lint.mjs` skeleton and the tiny `new:readme` generator next, so no one ever hand-writes another README novel.
