import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    pool: "forks",
    environment: "jsdom",
    globals: true,
    include: ["snippets/**/*.spec.{ts,tsx}"],
  },
});
