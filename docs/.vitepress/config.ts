import { defineConfig } from "vitepress";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  title: "UX Snippets Playbook",
  themeConfig: {
    sidebar: [
      {
        text: "Patterns",
        items: [
          {
            text: "Notification Badge",
            link: "/patterns/notification-badge",
          },
        ],
      },
    ],
  },
});
