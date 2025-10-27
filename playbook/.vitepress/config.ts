import { defineConfig } from "vitepress";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  title: "Plaincraft Playbook",
  description:
    "Component patterns and best practices for Plaincraft UI snippets",
  base: "/playbook/",
  outDir: "../playbook-static",
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
