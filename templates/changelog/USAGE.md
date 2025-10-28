# Using the Changelog Template

## Purpose

Maintain a structured, consolidatable changelog that auto-merges from temporary files.

## When to Use

- Preparing a release with multiple contributors
- Maintaining clear release notes without merge conflicts
- Automating changelog generation from commits

## Steps

### 1. Create Temporary Entry

```bash
# Create ordered file in _tmp/
cat > _tmp/001-new-feature.md << 'EOF'
# New Feature Name

- Added XYZ component for ABC use case
- Ticket: [U-feature-name]
- Script: `scripts/new-feature.mjs`
EOF
```

### 2. Consolidate Entries

```bash
# Run consolidation (or let pre-commit hook do it)
pnpm run changelog:consolidate
```

The script will:

- Read all `_tmp/*.md` files in order
- Extract `# Title` as section heading
- Merge under current/unreleased version
- Delete processed temp files

### 3. Review and Commit

```bash
# Review CHANGELOG.md
git diff CHANGELOG.md

# Commit with proper prefix
git commit -m "[ARCH-changelog] Release v1.2.3 notes"
```

## File Naming

Use numeric prefixes for ordering:

- `001-` through `009-`: Major features
- `010-` through `019-`: Patches and hotfixes
- `020-` through `029-`: Tooling and infrastructure
- `030-` through `099-`: Minor changes

## Section Structure

Each temp file should have:

```markdown
# Section Heading

- First bullet point with context
- Second bullet with ticket reference: [U-slug]
- Third bullet with script reference: `scripts/name.mjs`
```

## Automation

The consolidation runs:

- Manually: `pnpm run changelog:consolidate`
- Pre-commit hook: Automatically before each commit
- CI: Validates format in pull requests

## Rollback

If consolidation produces bad output:

```bash
# Restore CHANGELOG.md
git checkout HEAD -- CHANGELOG.md

# Fix temp files
# Re-run consolidation
pnpm run changelog:consolidate
```

## Configuration

See `template.config.json` for:

- Version format regex
- Section heading validation
- Ordering rules
- Merge strategies
