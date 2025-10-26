#!/usr/bin/env node
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

// Replace contents and file names including Storybook files
const replacements = [
  ["useTemplateSnippetController.ts", `use${name}Controller.ts`],
  ["TemplateSnippetView.tsx", `${name}View.tsx`],
  ["TemplateSnippetHeadless.tsx", `${name}Headless.tsx`],
  ["TemplateSnippet.tsx", `${name}.tsx`],
  ["TemplateSnippet.spec.tsx", `${name}.spec.tsx`],
  ["TemplateSnippet.stories.tsx", `${name}.stories.tsx`],
  ["TemplateSnippet.mdx", `${name}.mdx`],
  ["TemplateSnippet", name],
];

for (const file of fs.readdirSync(dst)) {
  const srcPath = path.join(dst, file);
  let contents = fs.readFileSync(srcPath, "utf8");
  for (const [from, to] of replacements) {
    contents = contents.replaceAll(from, to);
  }
  let outPath = srcPath;
  for (const [from, to] of replacements) {
    if (outPath.endsWith(from)) outPath = outPath.replace(from, to);
  }
  fs.writeFileSync(outPath, contents);
  if (outPath !== srcPath) fs.rmSync(srcPath);
}

console.log(`Created snippet at ${dst}`);
console.log("Next steps:");
console.log(
  `- Import { Demo as ${name}Demo } from "../../snippets/${name}/${name}"; into demo/src/App.tsx`,
);
console.log(`- Run: pnpm dev or pnpm storybook`);
