# Changelog

All notable changes to this project will be documented in this file. Follow the
[changelog guide](guides/CHANGELOG-GUIDE.md) for structure and content.

## [0.1.0] - 2025-10-26

### Changes

### Test Summary

This is a test change.

### Highlights

- Split `.github/workflows/ci.yml` into parallel jobs with concurrency control
- Added nightly/manual recording workflow
- Automated Storybook verification

### [ARCH-ci] PR Requirements Automation & Duplicate Prevention

Completed duplicate version prevention in changelog consolidation and PR requirements automation.

**Features:**

- Duplicate version detection and merging in consolidate-changelog.mjs
- PR requirements script (pr-requirements.mjs) for issue creation, verification, CI integration
- PR check workflow (.github/workflows/pr-check.yml) for automated validation
- Package scripts: pr:create-issue, pr:verify, pr:check

### Other Changes

- [U-inline-edit] Add Feature
- [B-docs] Update Docs
- [PB-playbook] Add Guide

### Rollout Notes

- All developers must run `pnpm gh:prepare` and `gh auth login`
- Add PR Requirements Check to branch protection rules
