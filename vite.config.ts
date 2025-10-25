import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: "./",
  server: {
    open: true
  },
  build: {
    outDir: "dist"
  }
});
