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
function normalizeSectionName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function mapSections(content) {
  const sectionsByOriginal = {};
  const sectionsByNormalized = {};
  const sectionRegex = /^##\s+(.+?)\s*$/gm;
  let match;
  const headings = [];

  while ((match = sectionRegex.exec(content)) !== null) {
    headings.push({
      name: match[1].trim(),
      headingIndex: match.index,
      contentStart: sectionRegex.lastIndex,
    });
  }

  for (let i = 0; i < headings.length; i++) {
    const current = headings[i];
    const nextHeadingIndex =
      i + 1 < headings.length ? headings[i + 1].headingIndex : content.length;
    const sectionContent = content
      .slice(current.contentStart, nextHeadingIndex)
      .trim();
    const normalized = normalizeSectionName(current.name);

    sectionsByOriginal[current.name] = sectionContent;

    if (!sectionsByNormalized[normalized]) {
      sectionsByNormalized[normalized] = {
        name: current.name,
        content: sectionContent,
      };
    }
  }

  return { sectionsByOriginal, sectionsByNormalized };
}

function extractParentMetadata(rawParent) {
  if (!rawParent) {
    return { parent: null, parentIssue: null, parentSlug: null };
  }

  const trimmed = rawParent.trim();
  const parentIssueMatch = trimmed.match(/#(\d+)/);
  const parentIssue = parentIssueMatch
    ? parseInt(parentIssueMatch[1], 10)
    : null;

  let parentSlug = null;
  const slugMatch = trimmed.match(/\(([^)]+)\)/);
  if (slugMatch) {
    parentSlug = slugMatch[1].trim();
  } else if (parentIssue) {
    parentSlug = trimmed.replace(/#\d+\s*/, "").trim() || null;
  } else if (trimmed && !trimmed.includes("#")) {
    parentSlug = trimmed;
  }

  return {
    parent: trimmed,
    parentIssue,
    parentSlug,
  };
}

export function parseIdeaFile(content, options = {}) {
  const metadata = {
    title: null,
    lane: null,
    issueNumber: null,
    issue: null,
    parent: null,
    parentIssue: null,
    parentSlug: null,
    sections: {},
    sectionsNormalized: {},
    purpose: "",
    problem: "",
    proposal: "",
    filename: options.filename || null,
    type: options.filename
      ? getIdeaType(path.basename(options.filename))
      : null,
  };

  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  const laneMatch = content.match(/Lane:\s*([A-D])/i);
  if (laneMatch) {
    metadata.lane = laneMatch[1].toUpperCase();
  }

  const issueMatch = content.match(/Issue:\s*#(\d+)/i);
  if (issueMatch) {
    metadata.issueNumber = parseInt(issueMatch[1], 10);
    metadata.issue = metadata.issueNumber;
  }

  const parentLineMatch = content.match(/^Parent:\s*(.+)$/m);
  if (parentLineMatch) {
    const parentMeta = extractParentMetadata(parentLineMatch[1]);
    metadata.parent = parentMeta.parent;
    metadata.parentIssue = parentMeta.parentIssue;
    metadata.parentSlug = parentMeta.parentSlug;
  }

  const { sectionsByOriginal, sectionsByNormalized } = mapSections(content);
  metadata.sections = sectionsByOriginal;
  metadata.sectionsNormalized = sectionsByNormalized;

  const purposeSection =
    sectionsByNormalized["purpose"]?.content ||
    sectionsByNormalized["purpose-and-outcome"]?.content ||
    "";
  const problemSection =
    sectionsByNormalized["problem"]?.content ||
    sectionsByNormalized["opportunity"]?.content ||
    "";
  const proposalSection =
    sectionsByNormalized["proposal"]?.content ||
    sectionsByNormalized["solution"]?.content ||
    "";

  metadata.purpose = purposeSection.trim();
  metadata.problem = problemSection.trim();
  metadata.proposal = proposalSection.trim();
  metadata.acceptanceSection =
    sectionsByNormalized["acceptance-checklist"]?.content ||
    sectionsByNormalized["acceptance"]?.content ||
    "";
  metadata.subIssuesSection =
    sectionsByNormalized["sub-issues"]?.content ||
    sectionsByNormalized["subissues"]?.content ||
    sectionsByNormalized["subissue"]?.content ||
    "";

  return metadata;
}

export async function loadIdeaFile(filePath) {
  const content = await readFile(filePath, "utf-8");
  const metadata = parseIdeaFile(content, {
    filename: path.basename(filePath),
  });
  return { content, metadata, filePath };
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
    const metadata = parseIdeaFile(content, { filename });

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
export function extractSubIssues(source) {
  let sectionContent = "";

  if (!source) return [];

  if (typeof source === "string") {
    const match = source.match(
      /##\s*Sub[\s-]*Issues?\s*([\s\S]*?)(?=\n##|\n$|$)/i,
    );
    sectionContent = match ? match[1].trim() : "";
  } else if (source.sectionsNormalized) {
    const normalized = source.sectionsNormalized;
    sectionContent =
      normalized["sub-issues"]?.content ||
      normalized["subissues"]?.content ||
      normalized["subissue"]?.content ||
      "";
  } else if (source.subIssuesSection) {
    sectionContent = source.subIssuesSection;
  }

  if (!sectionContent) return [];

  const subIssues = [];
  const lines = sectionContent.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const numberedMatch = trimmed.match(
      /^(?:[-*]|\d+\.)\s*(?:\*\*|__)?([A-Z]+-[\w-]+)(?:\*\*|__)?(?:\s*[-:]\s*|\s+)(.+)?$/,
    );
    if (numberedMatch) {
      subIssues.push({
        id: numberedMatch[1],
        description: (numberedMatch[2] || "").trim(),
      });
      continue;
    }

    const referenceMatch = trimmed.match(
      /^(?:[-*]|\d+\.)\s*(?:\[[ xX]\]\s*)?#(\d+)\s*(.+)?$/,
    );
    if (referenceMatch) {
      subIssues.push({
        id: `#${referenceMatch[1]}`,
        description: (referenceMatch[2] || "").trim(),
      });
    }
  }

  return subIssues;
}

/**
 * Extract acceptance checklist items
 * @param {string} content - Idea file content
 * @returns {Array<string>} Checklist items
 */
export function extractChecklistItems(source) {
  let sectionContent = "";

  if (!source) return [];

  if (typeof source === "string") {
    const match = source.match(
      /##\s*Acceptance Checklist\s*([\s\S]*?)(?=\n##|\n$|$)/i,
    );
    sectionContent = match ? match[1] : source;
  } else if (source.sectionsNormalized) {
    const normalized = source.sectionsNormalized;
    sectionContent =
      normalized["acceptance-checklist"]?.content ||
      normalized["acceptance"]?.content ||
      "";
  } else if (source.acceptanceSection) {
    sectionContent = source.acceptanceSection;
  }

  if (!sectionContent) return [];

  const items = [];
  const lines = sectionContent.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^-\s*\[[x\s]\]/i.test(trimmed)) {
      items.push(trimmed.replace(/^- \[[x\s]\]\s*/i, "").trim());
    }
  }

  return items;
}
