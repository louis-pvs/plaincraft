import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { PATH_ALIASES } from "./path-aliases";

export default defineConfig({
  plugins: [react()],
  root: "./",
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
