# ARCH-cli-logging-verbosity

Lane: C (DevOps & Automation)
Status: Draft

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Partners:** Lane B (Narrative & Enablement) for template/Playbook storytelling, Lane D (Program Operations) for rollout training and guardrail status updates.
- **Labels:** cli, guardrails, observability

## Purpose

Provide a consistent CLI logging experience: quiet, single-line output by default, with an opt-in `--verbose` flag for detailed logs across all automation scripts.

## Problem

Current scripts emit varied log formats (multi-line info, debug chatter, dry-run tables). Impact:

- Developers see noisy output even for simple `--yes` runs, making it harder to spot failures.
- Automation logs (CI guardrails) become verbose, hiding actionable messages.
- No unified flag to toggle a more detailed view when debugging.

## Proposal

1. Extend `scripts/_lib/core.mjs::Logger` so every script resolves its log level from `--verbose`, `--log-level`, or `LOG_LEVEL`, defaulting to clean single-line `info` output.
2. Standardise the logging contract (`log.info("action", {status, target, detail})`) and migrate CLI helpers + templates away from ad-hoc `console.log`.
3. Ship flag/format guardrails (unit tests + lint) so CI guardrail jobs stay concise while developers can opt in to `--verbose` locally.
4. Coordinate with Lane B to update template README + Playbook narratives and with Lane D to refresh guardrail training/checklists so the verbosity contract lands with every lane.

## Big Win

- Land a structured logger API plus guardrail migration so CI output drops to single-line summaries while `--verbose` unlocks rich metadata. Everything else builds on that cornerstone.

## Scope

- **In scope**
  - Update `parseFlags` + `Logger` to accept `--verbose` and `LOG_LEVEL`, resolve defaults, and emit single-line `info`.
  - Replace multi-line dry-run banners with structured logger calls across `scripts/ops` and `scripts/checks`.
  - Provide helpers for common patterns (`log.step`, `log.complete`, `log.warn`) that format key/value metadata consistently.
  - Update templates/tests/documents tied to script scaffolding and guardrail behaviour.
- **Out of scope**
  - Rewriting legacy scripts under `scripts/DEPRECATED/`.
  - Changing existing JSON/stdout payloads (`succeed`/`fail`) beyond log formatting.

## Implementation

### 1. Guardrail logging contract (big win)

- Refactor `Logger` to expose:
  - `log.info(action, meta = {})`
  - `log.debug(action, meta = {})`
  - `log.warn(action, meta = {})`
  - `log.error(action, meta = {})`
  - Each call formats as `LEVEL action key=value key2="quoted"` (single line, sorted keys).
  - `meta.duration` auto-appends `duration=123ms`.
- Add `log.step(label)` returning closures (`done`, `fail`) to wrap multi-phase tasks while still emitting single-line entries.
- Preserve `console.error` sink so logs stay on stderr (stdout reserved for `succeed`/`fail` payloads).
- Create codemod helper (`scripts/_lib/logging.mjs`) around the new API and migrate `scripts/checks/**` first so guardrail output immediately benefits from concise logging.

### 2. Flag + environment resolution

- Add `resolveLogLevel({ flags, env })` helper in `core.mjs`:
  - Priority: CLI `--log-level`, then `--verbose`, then `LOG_LEVEL`, fallback `info`.
  - Accept `trace|debug|info|warn|error`. `--verbose` aliases to `debug`.
  - Honour `--quiet` (future-proof) by mapping to `error`.
- Update `parseFlags` to surface `verbose: boolean` and default `logLevel` accordingly.
- Ensure `templates/script/template-script.mjs` consumes the helper so new scripts inherit behaviour.

### 3. Script migration

- Touch remaining high-signal automation flows after guardrails:
  1. `scripts/ops/*.mjs` (lifecycle + scaffolding)
  2. `scripts/generate-*.mjs` (catalog + PR content)
- Replace each `console.log` block with `log.info` single-line summaries and move verbose tables behind `log.debug`.
- Introduce shared table formatter that logs `log.debug("dry-run", {rows})` while retaining a text block behind `--verbose`.
- Update template + newly scaffolded scripts to import `Logger` + `resolveLogLevel`.

### 4. Documentation + guardrails

- Partner with Lane B to add a verbosity section in `/templates/script/README.md` (plus Playbook narrative) covering examples and guardrail expectations.
- Equip Lane D with an updated guardrail training packet + status-note checklist that calls out when to capture `--verbose` output.
- Extend `scripts/_lib/core.spec.mjs` with cases covering:
  - `--verbose` toggling `debug`.
  - `LOG_LEVEL=trace`.
  - Single-line guarantee (no newline characters).
- Add lint rule (e.g. `scripts/checks/logging-contract.mjs`) to fail on `console.log` in `scripts/` (excluding template + deprecated).

## Rollout

1. Land core logging changes + tests.
2. Migrate guardrail scripts (`scripts/checks/**`), validate via `pnpm guardrails`.
3. Migrate lifecycle + ops scripts, verify `--dry-run` and `--yes` paths remain stable.
4. Update documentation + template, run `pnpm lint` + docs checks.
5. Remove temporary migration flags once all scripts consume the new logger.

## Risks & Mitigations

- **Stdout regression**: Ensure formatter still writes to stderr so JSON payloads are unaffected. Add integration test for `succeed`.
- **Incomplete migration**: Ship lint guard to catch surviving `console.log` calls in critical folders.
- **Debug discoverability**: Provide `log.sample` snippet in docs + template to show how to surface structured metadata under `--verbose`.

## Acceptance Checklist

- [ ] Logger resolves `--verbose`, `--log-level`, and `LOG_LEVEL` consistently; default `info` emits single-line structured entries.
- [ ] Guardrail + lifecycle scripts route output through the new logger API; lint blocks new `console.log` usage.
- [ ] Lane B narratives (template README + Playbook guardrail doc) document the verbosity contract with usage examples.
- [ ] Lane D guardrail training/checklists reference the new verbosity expectations and required status-note copy.
- [ ] Unit tests cover flag/env precedence and log formatting; guardrail run confirms clean stderr.
- [ ] CI guardrails run in default mode with concise output; manual `--verbose` run surfaces debug metadata without regressions.

## Status

- 2025-11-03 - Draft: captured need for unified logging verbosity flag across CLI scripts.
- 2025-11-07 - In design: scoped flag resolution, formatting contract, migration guardrails for unified CLI logging.

<!-- prettier-ignore -->
_Owner: @lane-c
