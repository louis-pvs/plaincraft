/* eslint-disable import/no-default-export, import/no-named-as-default */
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Mermaid from "../../../shared/vitepress/mermaid/Mermaid.vue";

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp({ app }) {
    DefaultTheme.enhanceApp?.({ app });
    app.component("Mermaid", Mermaid);
  },
};

export default theme;
