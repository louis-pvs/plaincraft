# ARCH-ideas-validator-fix

Lane: C (DevOps & Automation)
Parent: ARCH-subissue-pipeline-repair

## Lane

- **Primary Lane:** C (DevOps & Automation)
- **Labels:** automation, quality

## Purpose

Fix `validate-ideas.mjs` so it reflects the real idea types in the repo (ARCH, PB, briefs) and keeps the automation trustworthy.

## Problem

The `scripts/validate-ideas.mjs` script only recognizes `U-`, `C-`, and `B-` prefixes, but the repository contains:

- 12 ARCH-prefixed files (architecture/infrastructure work)
- No PB-prefixed files yet (but guides mention them)
- Generic brief files without prefixes

When running validation on ARCH files:

```bash
$ node scripts/validate-ideas.mjs ARCH-subissue-pipeline-repair.md
❌ ARCH-subissue-pipeline-repair.md
   - Filename must start with U-, C-, or B-
```

The validator is validating against an **outdated schema** that doesn't match repository reality. ARCH files have different required sections:

- ARCH files: `Problem`, `Proposal`, `Acceptance Checklist`
- Unit files: `Contracts`, `Props + Shape`, `Behaviors`
- Composition files: `Metric Hypothesis`, `Units In Scope`

## Proposal

Update `scripts/validate-ideas.mjs` to support all file types:

1. Add validation rules for ARCH type:

   ```javascript
   arch: {
     requiredSections: ["Problem", "Proposal", "Acceptance Checklist"],
     filenamePattern: /^ARCH-[\w-]+\.md$/,
   }
   ```

2. Add validation rules for PB (playbook) type:

   ```javascript
   playbook: {
     requiredSections: ["Purpose", "Steps", "Acceptance Checklist"],
     filenamePattern: /^PB-[\w-]+\.md$/,
   }
   ```

3. Add validation rules for brief type (no prefix):

   ```javascript
   brief: {
     requiredSections: ["Problem", "Signal", "Hunch"],
     filenamePattern: /^[a-z][\w-]+\.md$/,  // lowercase start, no prefix
     optional: true  // Don't enforce as strictly
   }
   ```

4. Update type detection logic:

   ```javascript
   let type = null;
   if (filename.startsWith("U-")) type = "unit";
   else if (filename.startsWith("C-")) type = "composition";
   else if (filename.startsWith("B-")) type = "bug";
   else if (filename.startsWith("ARCH-")) type = "arch";
   else if (filename.startsWith("PB-")) type = "playbook";
   else if (filename.match(/^[a-z]/)) type = "brief";

   if (!type) {
     errors.push(
       "Filename must start with U-, C-, B-, ARCH-, PB-, or lowercase letter",
     );
     return { filename, valid: false, errors, warnings };
   }
   ```

5. Make Lane validation flexible for ARCH (can be any A-D):
   - ARCH files often span multiple lanes (infrastructure)
   - Don't enforce lane-specific section requirements

## Acceptance Checklist

- [x] `VALIDATION_RULES` object updated with `arch`, `playbook`, `brief` types
- [x] ARCH type requires: Problem, Proposal, Acceptance Checklist
- [x] PB type requires: Purpose, Steps, Acceptance Checklist
- [x] Brief type requires: Problem, Signal, Hunch (lenient validation)
- [x] Type detection logic recognizes all 6 prefixes (U, C, B, ARCH, PB, brief)
- [x] Test: Validate ARCH file → passes with correct sections
- [x] Test: Validate all 12 existing ARCH files → all pass
- [x] Test: Validate U/C/B files → no regression, still works
- [x] Test: Missing required section → proper error message
- [x] Documentation: Updated validator rules in `SCRIPTS-REFERENCE.md`
