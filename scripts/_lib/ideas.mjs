/**
 * ideas.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Idea file parsing and validation helpers
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Validation rules for idea files by type
 */
export const VALIDATION_RULES = {
  unit: {
    requiredSections: [
      "Lane",
      "Contracts",
      "Props + Shape",
      "Behaviors",
      "Acceptance Checklist",
    ],
    filenamePattern: /^U-[\w-]+\.md$/,
  },
  composition: {
    requiredSections: [
      "Lane",
      "Metric Hypothesis",
      "Units In Scope",
      "Acceptance Checklist",
    ],
    filenamePattern: /^C-[\w-]+\.md$/,
  },
  architecture: {
    requiredSections: [
      "Lane",
      "Purpose",
      "Problem",
      "Proposal",
      "Acceptance Checklist",
    ],
    filenamePattern: /^ARCH-[\w-]+\.md$/,
  },
  playbook: {
    requiredSections: ["Lane", "Purpose", "Process", "Acceptance Checklist"],
    filenamePattern: /^PB-[\w-]+\.md$/,
  },
  bug: {
    requiredSections: ["Lane", "Expected Behavior", "Actual Behavior", "Steps"],
    filenamePattern: /^B-[\w-]+\.md$/,
  },
  brief: {
    requiredSections: ["Problem", "Signal", "Hunch"],
    filenamePattern: /^[a-z][\w-]*\.md$/,
  },
};

/**
 * Determine idea type from filename
 * @param {string} filename - Idea filename
 * @returns {string|null} Type (unit, composition, etc.) or null
 */
export function getIdeaType(filename) {
  if (filename.startsWith("U-")) return "unit";
  if (filename.startsWith("C-")) return "composition";
  if (filename.startsWith("ARCH-")) return "architecture";
  if (filename.startsWith("PB-")) return "playbook";
  if (filename.startsWith("B-")) return "bug";
  if (/^[a-z]/.test(filename)) return "brief";
  return null;
}

/**
 * Parse idea file and extract metadata
 * @param {string} content - File content
 * @returns {object} Parsed metadata
 */
export function parseIdeaFile(content) {
  const metadata = {
    title: null,
    lane: null,
    issueNumber: null,
    sections: {},
  };

  // Extract title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Extract lane
  const laneMatch = content.match(/Lane:\s*([A-D])/i);
  if (laneMatch) {
    metadata.lane = laneMatch[1].toUpperCase();
  }

  // Extract issue number
  const issueMatch = content.match(/Issue:\s*#(\d+)/i);
  if (issueMatch) {
    metadata.issueNumber = parseInt(issueMatch[1], 10);
  }

  // Extract sections
  const sectionRegex = /^##\s+(.+)$/gm;
  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    metadata.sections[match[1].trim()] = true;
  }

  return metadata;
}

/**
 * Validate single idea file
 * @param {string} filePath - Path to idea file
 * @returns {Promise<object>} Validation result
 */
export async function validateIdeaFile(filePath) {
  const filename = path.basename(filePath);
  const errors = [];
  const warnings = [];

  try {
    const content = await readFile(filePath, "utf-8");

    // Determine file type
    const type = getIdeaType(filename);

    if (!type) {
      errors.push("Filename must start with U-, C-, ARCH-, PB-, or B-");
      return { filename, type: null, valid: false, errors, warnings };
    }

    // Validate filename pattern
    const rules = VALIDATION_RULES[type];
    if (!rules.filenamePattern.test(filename)) {
      errors.push(
        `Filename doesn't match pattern: ${rules.filenamePattern.source}`,
      );
    }

    // Parse metadata
    const metadata = parseIdeaFile(content);

    // Check for title
    if (!metadata.title) {
      errors.push("Missing top-level heading (# Title)");
    }

    // Check for required sections
    for (const section of rules.requiredSections) {
      if (!metadata.sections[section]) {
        errors.push(`Missing required section: ${section}`);
      }
    }

    // Check for lane specification
    if (!metadata.lane) {
      errors.push("Missing or invalid Lane specification (A, B, C, or D)");
    }

    // Check for acceptance checklist items
    const checklistMatch = content.match(
      /## Acceptance Checklist\s*([\s\S]*?)(?=\n##|\n$|$)/,
    );
    if (checklistMatch) {
      const items = checklistMatch[1]
        .split("\n")
        .filter((line) => line.trim().startsWith("- [ ]"));

      if (items.length === 0) {
        warnings.push("Acceptance Checklist is empty");
      } else if (items.length < 3) {
        warnings.push(
          `Acceptance Checklist has only ${items.length} item(s) (consider adding more)`,
        );
      }
    }

    // Check for ticket ID in title
    if (metadata.title && type !== "brief") {
      const ticketPrefix = filename.substring(0, filename.indexOf("-") + 1);
      if (!metadata.title.includes(ticketPrefix.replace("-", ""))) {
        warnings.push(
          `Title doesn't include ticket ID prefix (${ticketPrefix.slice(0, -1)})`,
        );
      }
    }

    return {
      filename,
      type,
      valid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  } catch (error) {
    errors.push(`Failed to read file: ${error.message}`);
    return {
      filename,
      type: null,
      valid: false,
      errors,
      warnings,
      metadata: null,
    };
  }
}

/**
 * Find all idea files in directory
 * @param {string} ideasDir - Ideas directory path
 * @param {string} [filter] - Optional filter pattern
 * @returns {Promise<string[]>} Array of idea filenames
 */
export async function findIdeaFiles(ideasDir, filter = null) {
  try {
    const files = await readdir(ideasDir);
    let ideaFiles = files.filter((f) => f.endsWith(".md"));

    if (filter) {
      ideaFiles = ideaFiles.filter((f) => f === filter || f.includes(filter));
    }

    return ideaFiles;
  } catch {
    return [];
  }
}

/**
 * Extract sub-issues from idea content
 * @param {string} content - Idea file content
 * @returns {Array<object>} Sub-issues with id and description
 */
export function extractSubIssues(content) {
  const subIssues = [];
  const subIssuesMatch = content.match(
    /## Sub-issues\s*([\s\S]*?)(?=\n##|\n$|$)/,
  );

  if (subIssuesMatch) {
    const lines = subIssuesMatch[1].split("\n");
    for (const line of lines) {
      const match = line.match(/^\d+\.\s+\*\*([A-Z]+-[\w-]+)\*\*\s*-\s*(.+)$/);
      if (match) {
        subIssues.push({
          id: match[1],
          description: match[2].trim(),
        });
      }
    }
  }

  return subIssues;
}

/**
 * Extract acceptance checklist items
 * @param {string} content - Idea file content
 * @returns {Array<string>} Checklist items
 */
export function extractChecklistItems(content) {
  const items = [];
  const checklistMatch = content.match(
    /## Acceptance Checklist\s*([\s\S]*?)(?=\n##|\n$|$)/,
  );

  if (checklistMatch) {
    const lines = checklistMatch[1].split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]")) {
        items.push(trimmed.substring(6).trim());
      }
    }
  }

  return items;
}
