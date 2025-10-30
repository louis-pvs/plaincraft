import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: [
    "../snippets/!(_template)/**/*.stories.@(ts|tsx)",
    "../snippets/!(_template)/**/*.mdx",
    "../storybook/docs/**/*.mdx",
  ],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
};
export default config;
