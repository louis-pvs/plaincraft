import type { Preview } from "@storybook/react";
import "../demo/src/style.css"; // Tailwind from demo

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    actions: { argTypesRegex: "^on[A-Z].*" },
    a11y: { context: "#storybook-root" },
  },
};
export default preview;
