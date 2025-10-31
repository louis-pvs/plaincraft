import { defineConfig } from "@playwright/test";

const STORYBOOK_BASE_URL =
  process.env.STORYBOOK_BASE_URL ?? "http://127.0.0.1:6006";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: STORYBOOK_BASE_URL,
    trace: "off",
  },
  reporter: [["list"]],
});
