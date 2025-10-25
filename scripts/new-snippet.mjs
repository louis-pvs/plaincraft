#!/usr/bin/env node
/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";

const name = process.argv[2];
if (!name) {
  console.error("Usage: pnpm new:snippet <PascalCaseName>");
  process.exit(1);
}
if (!/^[A-Z][A-Za-z0-9]+$/.test(name)) {
  console.error("Name must be PascalCase, e.g., InlineEditLabel");
  process.exit(1);
}

const src = path.join("snippets", "_template");
const dst = path.join("snippets", name);

if (fs.existsSync(dst)) {
  console.error(`Folder ${dst} already exists.`);
  process.exit(1);
}

fs.cpSync(src, dst, { recursive: true });

// Replace contents and file names
for (const file of fs.readdirSync(dst)) {
  const srcPath = path.join(dst, file);
  const contents = fs
    .readFileSync(srcPath, "utf8")
    .replaceAll("TemplateSnippet", name);
  const renamed = srcPath.replaceAll("TemplateSnippet", name);
  fs.writeFileSync(renamed, contents);
  if (renamed !== srcPath) fs.rmSync(srcPath);
}

console.log(`Created snippet at ${dst}`);
console.log("Import its Demo in demo/src/App.tsx to render it.");
