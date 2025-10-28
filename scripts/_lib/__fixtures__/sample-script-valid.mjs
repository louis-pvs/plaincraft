/**
 * sample-script-valid.mjs
 * @since 2025-10-28
 * @version 0.1.0
 * Valid script for testing
 */

import { parseFlags } from "../core.mjs";

const flags = parseFlags();

if (flags.help) {
  console.log("Usage: node sample-script-valid.mjs [--help] [--dry-run]");
  process.exit(0);
}

console.log("Script running...");
