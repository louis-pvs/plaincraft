import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(new URL(".", import.meta.url)));

export const PATH_ALIASES = {
  "@docs": resolve(projectRoot, "docs"),
  "@playbook": resolve(projectRoot, "playbook"),
  "@templates": resolve(projectRoot, "templates"),
  "@scripts": resolve(projectRoot, "scripts"),
} as const;

export const pathAliasArray = () =>
  Object.entries(PATH_ALIASES).map(([find, replacement]) => ({
    find,
    replacement,
  }));
