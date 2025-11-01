import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { PATH_ALIASES } from "./path-aliases";

export default defineConfig({
  plugins: [react()],
  root: "./",
  base: "/plaincraft/demo/", // Base path for GitHub Pages
  resolve: {
    alias: PATH_ALIASES,
  },
  server: {
    open: true,
  },
  build: {
    outDir: "dist",
  },
});
