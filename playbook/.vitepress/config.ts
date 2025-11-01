import { defineConfig } from "vitepress";
import { PATH_ALIASES } from "../../path-aliases";
import { mermaidPlugin } from "./plugins/mermaid";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  title: "Plaincraft Playbook",
  description:
    "Component patterns and best practices for Plaincraft UI snippets",
  base: "/plaincraft/playbook/",
  outDir: "../playbook-static",
  vite: {
    resolve: {
      alias: PATH_ALIASES,
    },
  },
  markdown: {
    config: (md) => {
      md.use(mermaidPlugin);
    },
  },
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Patterns", link: "/patterns/" },
      {
        text: "Storybook",
        link: "https://louis-pvs.github.io/plaincraft/storybook/",
      },
    ],
    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Introduction", link: "/" },
          { text: "Architecture", link: "/architecture" },
        ],
      },
      {
        text: "Patterns",
        items: [
          { text: "Overview", link: "/patterns/" },
          { text: "Inline Edit Label", link: "/patterns/inline-edit-label" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/louis-pvs/plaincraft" },
    ],
  },
});
