/* eslint-disable import/no-default-export */
import { defineConfig } from "vitepress";
import { PATH_ALIASES } from "../../path-aliases";
import { mermaidPlugin } from "./plugins/mermaid";

export default defineConfig({
  title: "Plaincraft Docs",
  description: "Scripts-first governance, workflows, and runbooks.",
  base: "/plaincraft/docs/",
  srcDir: ".",
  cleanUrls: true,
  lastUpdated: true,
  markdown: {
    config: (md) => {
      md.use(mermaidPlugin);
    },
  },
  vite: {
    resolve: {
      alias: PATH_ALIASES,
    },
  },
  themeConfig: {
    nav: [
      { text: "Workflows", link: "/workflows/idea-lifecycle" },
      { text: "Policy", link: "/policy/workflow-enforcement" },
      { text: "Runbooks", link: "/runbooks/lane-A" },
      { text: "Reference", link: "/reference/project-schema" },
      {
        text: "External",
        items: [
          {
            text: "Storybook",
            link: "https://louis-pvs.github.io/plaincraft/storybook/",
          },
          {
            text: "Playbook",
            link: "https://louis-pvs.github.io/plaincraft/playbook/",
          },
        ],
      },
    ],
    sidebar: {
      "/workflows/": [
        {
          text: "Workflows",
          items: [
            { text: "Idea Lifecycle", link: "/workflows/idea-lifecycle" },
          ],
        },
      ],
      "/policy/": [
        {
          text: "Policy",
          items: [
            {
              text: "Workflow Enforcement",
              link: "/policy/workflow-enforcement",
            },
          ],
        },
      ],
      "/runbooks/": [
        {
          text: "Runbooks",
          items: [
            { text: "Lane A", link: "/runbooks/lane-A" },
            { text: "Lane B", link: "/runbooks/lane-B" },
            { text: "Lane C", link: "/runbooks/lane-C" },
            { text: "Lane D", link: "/runbooks/lane-D" },
            { text: "Observer", link: "/runbooks/observer" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "Project Schema", link: "/reference/project-schema" },
          ],
        },
      ],
      "/adr/": [
        {
          text: "ADR",
          items: [
            {
              text: "2025-10 Idea Lifecycle",
              link: "/adr/2025-10-idea-lifecycle",
            },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/louis-pvs/plaincraft" },
    ],
  },
});
