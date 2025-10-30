# U-recording-assets-v3

Lane: A (Developer UI & Experience)
Issue: 94

## Lane

- **Primary Lane:** A (Developer UI & Experience)
- **Partners:** Lane B for curation, Lane C for storage/automation alignment.

## Contracts

- Lane A owns deterministic UI recording assets (source video, GIF, thumbnail, alt text, caption).
- Assets must live beside the unit implementation/README and remain traceable to the template ID.
- Recording flows are scoped to single job-to-be-done slices (start → action → result).

## Props + Shape

- Recording spec: `{ id: string; variant: string; durationSec: number; sizeMb: number; width: number; height: number; sourcePath: string; gifPath: string; thumbnailPath: string; altText: string; caption: string; }`
- Naming: `${id}-${slug}-${variant}` (e.g., `U-58-inline-edit-success`).
- Metadata file (JSON or markdown block) stored next to assets for automation to ingest.

## Behaviors

- All flows record at 960px width, ≤10s (target 6–8s), ≤2MB GIF.
- Storybook stories seeded with deterministic data so recording is repeatable.
- Recording script seeds state, hides non-essential chrome, and captures visible focus.
- Assets linked into Storybook docs panel immediately after recording.

## Accessibility

- Ensure focus indicators and readable text at 100% scale.
- Provide one-line alt text plus two-sentence caption describing outcome and guardrail.
- Avoid rapid flashing/spinners; confirm playback is comfortable at 1× and 0.75× speeds.

## Usability Testing

- Dry-run the recording script twice (real-time and slow playback) to confirm clarity.
- Validate assets on fresh clone: `pnpm storybook -- --record <id>` (new helper) finishes in <10 minutes including optimization.
- Verify GIF plays smoothly and caption/alt text render correctly in Storybook docs.

## Findings

- Manual recordings exceeded size/time limits and produced jitter; deterministic Storybook stories fix both.
- Embedding metadata next to assets keeps Lane B from guessing intent or constraints.
- Automating width/duration/size checks prevents regressions when stories evolve.

## Acceptance Checklist

- [ ] Deterministic recording script or documented manual flow seeded for each targeted unit.
- [ ] Source video (webm/mp4), optimized ≤2 MB GIF, and still thumbnail saved beside the unit README.
- [ ] Metadata file includes alt text, caption (two sentences), decision label, and template reference.
- [ ] Storybook docs updated with the new assets and links back to README/template.
- [ ] Verification run on a clean clone proves total capture + optimization <10 minutes.
