import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: [
    "../snippets/!(_template)/**/*.stories.@(ts|tsx)",
    "../snippets/!(_template)/**/*.mdx",
    "../storybook/docs/**/*.mdx",
  ],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  async viteFinal(baseConfig) {
    const { createRequire } = await import("node:module");
    const resolveModule = createRequire(import.meta.url);
    const blocksModulePath = resolveModule.resolve(
      "@storybook/addon-docs/blocks",
    );

    const alias = baseConfig.resolve?.alias ?? [];

    if (Array.isArray(alias)) {
      alias.push(
        { find: "storybook/blocks", replacement: blocksModulePath },
        { find: "@storybook/blocks", replacement: blocksModulePath },
      );
      baseConfig.resolve = { ...(baseConfig.resolve ?? {}), alias };
    } else {
      baseConfig.resolve = {
        ...(baseConfig.resolve ?? {}),
        alias: {
          ...(alias as Record<string, string>),
          "storybook/blocks": blocksModulePath,
          "@storybook/blocks": blocksModulePath,
        },
      };
    }

    return baseConfig;
  },
};
export default config;
