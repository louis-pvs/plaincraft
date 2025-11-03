import type { StorybookConfig } from "@storybook/react-vite";
import { pathAliasArray } from "../path-aliases";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: [
    "../snippets/!(_template)/**/*.stories.@(ts|tsx)",
    "../snippets/!(_template)/**/*.mdx",
  ],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  async viteFinal(baseConfig) {
    // Set base path for GitHub Pages deployment
    if (baseConfig.base === undefined) {
      baseConfig.base = "/plaincraft/storybook/";
    }
    const { createRequire } = await import("node:module");
    const { access } = await import("node:fs/promises");
    const resolveModule = createRequire(import.meta.url);
    let blocksModulePath = resolveModule.resolve(
      "@storybook/addon-docs/blocks",
    );
    const mjsCandidate = blocksModulePath.replace(/\.js$/, ".mjs");
    try {
      await access(mjsCandidate);
      blocksModulePath = mjsCandidate;
    } catch {
      // ignore, fall back to resolved path
    }

    const alias = baseConfig.resolve?.alias ?? [];
    const aliasEntries = [
      ...pathAliasArray(),
      { find: "storybook/blocks", replacement: blocksModulePath },
      { find: "@storybook/blocks", replacement: blocksModulePath },
    ];

    if (Array.isArray(alias)) {
      alias.push(...aliasEntries);
      baseConfig.resolve = { ...(baseConfig.resolve ?? {}), alias };
    } else {
      const aliasObject = alias as Record<string, string>;
      const mergedAliases = aliasEntries.reduce<Record<string, string>>(
        (acc, { find, replacement }) => {
          acc[find] = replacement;
          return acc;
        },
        { ...aliasObject },
      );

      baseConfig.resolve = {
        ...(baseConfig.resolve ?? {}),
        alias: mergedAliases,
      };
    }

    return baseConfig;
  },
};
export default config;
