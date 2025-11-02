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
        text: "UI Component Patterns",
        items: [
          { text: "Overview", link: "/patterns/" },
          { text: "Inline Edit Label", link: "/patterns/inline-edit-label" },
        ],
      },
      {
        text: "Workflow Patterns",
        items: [
          {
            text: "Ideas Source of Truth",
            link: "/patterns/ideas-source-of-truth",
          },
          {
            text: "Scripts-First Lifecycle Overview",
            link: "/patterns/scripts-first-lifecycle-overview",
          },
          {
            text: "Scripts-First Lifecycle Rollout",
            link: "/patterns/scripts-first-lifecycle-rollout",
          },
          {
            text: "Scripts-First Lifecycle Rollback",
            link: "/patterns/scripts-first-lifecycle-rollback",
          },
        ],
      },
      {
        text: "Automation & Governance",
        items: [
          {
            text: "Script Automation Guardrails",
            link: "/patterns/script-automation-guardrails",
          },
          {
            text: "Release Changelog Automation",
            link: "/patterns/release-changelog-automation",
          },
          {
            text: "Roadmap Project Onboarding",
            link: "/patterns/roadmap-project-onboarding",
          },
          {
            text: "Backlog Pilot Scripts-First",
            link: "/patterns/backlog-pilot-scripts-first",
          },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/louis-pvs/plaincraft" },
    ],
  },
});
