import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { PATH_ALIASES } from "./path-aliases";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: PATH_ALIASES,
  },
  test: {
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    environment: "jsdom",
    globals: true,
    include: [
      "snippets/**/*.spec.{ts,tsx}",
      "scripts/**/*.spec.mjs",
      "tests/**/*.spec.{ts,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/DEPRECATED/**",
      "**/_archive/**",
      "**/archived/**",
    ],
    coverage: {
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/DEPRECATED/**",
        "**/_archive/**",
        "**/archived/**",
        "**/*.spec.{ts,tsx,mjs}",
        "**/*.config.{ts,js,mjs}",
      ],
    },
  },
});
