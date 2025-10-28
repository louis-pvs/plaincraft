/**
 * templates.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Summary: Helper functions for template and guide operations
 */

import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";

/**
 * Count templates in templates directory
 */
export async function countTemplates(root) {
  const templatesDir = path.join(root, "templates");
  const items = await readdir(templatesDir, { withFileTypes: true });
  let count = 0;

  for (const item of items) {
    if (item.isDirectory()) {
      const configPath = path.join(
        templatesDir,
        item.name,
        "template.config.json",
      );
      if (existsSync(configPath)) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Count guides in guides directory
 */
export async function countGuides(root) {
  const guidesDir = path.join(root, "guides");
  const files = await readdir(guidesDir);
  return files.filter((f) => f.startsWith("guide-") && f.endsWith(".md"))
    .length;
}

/**
 * Check template:guide ratio
 */
export async function checkRatio(root) {
  const templates = await countTemplates(root);
  const guides = await countGuides(root);
  const ratio = templates / Math.max(guides, 1);
  const targetRatio = 3.0;

  return {
    templates,
    guides,
    ratio,
    canAddGuide: ratio >= targetRatio || guides === 0,
    needsTemplates: Math.max(
      0,
      Math.ceil((guides + 1) * targetRatio) - templates,
    ),
  };
}

/**
 * List available templates with metadata
 */
export async function listTemplates(root) {
  const templatesDir = path.join(root, "templates");
  const items = await readdir(templatesDir, { withFileTypes: true });
  const templates = [];

  for (const item of items) {
    if (item.isDirectory()) {
      const configPath = path.join(
        templatesDir,
        item.name,
        "template.config.json",
      );
      if (existsSync(configPath)) {
        const configContent = await readFile(configPath, "utf8");
        const config = JSON.parse(configContent);
        templates.push({
          id: config.id,
          version: config.version,
          category: config.category,
          ref: `/templates/${config.id}@v${config.version}`,
        });
      }
    }
  }

  return templates;
}

/**
 * Validate template reference format and existence
 */
export async function validateTemplateRef(root, templateRef) {
  if (!templateRef) {
    return false;
  }

  const match = templateRef.match(
    /^\/templates\/([a-z0-9-]+)(?:@v?([0-9.]+))?$/,
  );
  if (!match) {
    return false;
  }

  const [, templateId] = match;
  const templateDir = path.join(root, "templates", templateId);
  const configPath = path.join(templateDir, "template.config.json");

  return existsSync(configPath);
}

/**
 * Generate template directory structure
 */
export function generateTemplateFiles(templateDir, templateId, category) {
  const entrypoint = `${templateId}-template.md`;
  const today = new Date().toISOString().split("T")[0];
  const displayName =
    templateId.charAt(0).toUpperCase() + templateId.slice(1).replace(/-/g, " ");

  return [
    {
      path: path.join(templateDir, "README.md"),
      content: `# ${displayName} Template

Template for [brief description].

## Purpose

[Explain purpose and use cases]

## Quick Start

\`\`\`bash
cp templates/${templateId}/${entrypoint} [destination]
# Or: pnpm [script-command]
\`\`\`

## When to Use

- [Use case 1]
- [Use case 2]

## Related Files

- \`/templates/[related]/\`
- \`/scripts/[related].mjs\`

## Validation

\`\`\`bash
pnpm docs:check
\`\`\`
`,
    },
    {
      path: path.join(templateDir, "USAGE.md"),
      content: `# ${displayName} Template - Usage Guide

## Setup

\`\`\`bash
cp templates/${templateId}/${entrypoint} [destination]
\`\`\`

## Structure

[Describe sections]

## Best Practices

[List best practices]

## Validation

\`\`\`bash
pnpm docs:check
\`\`\`
`,
    },
    {
      path: path.join(templateDir, "template.config.json"),
      content: JSON.stringify(
        {
          id: templateId,
          name: templateId,
          version: "0.1.0",
          category: category,
          entrypoint: entrypoint,
          description: `Template for ${templateId}`,
          created: today,
          lastUpdated: today,
          schema: {
            requiredSections: [],
          },
          automation: {
            validation: {
              preBuild: true,
              preCommit: true,
              ci: true,
            },
          },
          relatedTemplates: [],
          relatedGuides: [],
        },
        null,
        2,
      ),
    },
    {
      path: path.join(templateDir, entrypoint),
      content: `# ${displayName} Template

[Introduction]

## Section 1

[Content]

## Section 2

[Content]
`,
    },
  ];
}

/**
 * Generate guide content with frontmatter
 */
export function generateGuideContent(slug, templateRef, owner, lane) {
  const today = new Date().toISOString().split("T")[0];
  const artifactId = `guide-${slug}`;

  return `---
id: ${artifactId}
owner: ${owner}
lane: ${lane}
artifact_id: ${artifactId}
scaffold_ref: ${templateRef}
version: 0.1.0
created: ${today}
ttl_days: 90
last_verified: ${today}
---

# When to use

- [Describe when to use]
- [Scenario 1]

# When not to use

- [When NOT to use]
- [Alternative 1]

# Steps (all executable)

1. **Step 1:**

   \`\`\`bash
   # Command
   \`\`\`

2. **Step 2:**

   \`\`\`bash
   # Command
   \`\`\`

# Rollback

- [Undo steps]
- [Cleanup]

# Requirements

**Prerequisites:**

- [Required tool 1]

**Validation:**

\`\`\`bash
# Verify command
\`\`\`

# Links

- Templates: \`${templateRef}\`
- Scripts: \`/scripts/[related].mjs\`
`;
}
