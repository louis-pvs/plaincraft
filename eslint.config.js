import { fileURLToPath } from "node:url";
import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import storybook from "eslint-plugin-storybook";

const TS_FILE_GLOBS = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"];
const JS_FILE_GLOBS = ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"];
const JS_AND_TS_FILES = [...JS_FILE_GLOBS, ...TS_FILE_GLOBS];
const TS_CONFIG_ROOT = fileURLToPath(new URL(".", import.meta.url));

const typescriptRecommended = tseslint.configs["flat/recommended"].map(
  (config) => ({
    ...config,
    files: config.files ?? TS_FILE_GLOBS,
  }),
);

const importRecommended = {
  ...importPlugin.flatConfigs.recommended,
  languageOptions: {
    ...importPlugin.flatConfigs.recommended.languageOptions,
    ecmaVersion: "latest",
    sourceType: "module",
  },
};

const storybookRecommended = storybook.configs["flat/recommended"].map(
  (config) => ({
    ...config,
    files: config.files ?? [
      "**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)",
      "**/*.story.@(ts|tsx|js|jsx|mjs|cjs)",
      ".storybook/**/*.*",
    ],
  }),
);

export default defineConfig([
  {
    ignores: [
      "dist/**",
      "storybook-static/**",
      "playbook-static/**",
      "**/*.mdx",
      "**/*.md",
      "**/*.json",
      "**/DEPRECATED/**",
      "**/_archive/**",
      "docs/.vitepress/**",
      "docs/.vitepress/cache/**",
      "docs/.vitepress/dist/**",
      "templates/**",
      "eslint.config.js",
    ],
  },

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  js.configs.recommended,

  ...typescriptRecommended,

  importRecommended,

  {
    ...importPlugin.flatConfigs.typescript,
    files: TS_FILE_GLOBS,
  },

  {
    files: JS_AND_TS_FILES,
    plugins: {
      "@typescript-eslint": tseslint,
      "unused-imports": unusedImports,
      prettier: prettierPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: true,
      },
    },
    rules: {
      "import/no-default-export": "error",
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "never",
        },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
      ...prettierConfig.rules,
      "prettier/prettier": "error",
    },
  },

  ...storybookRecommended,

  {
    files: [
      "*.config.*",
      "scripts/**/*.*",
      ".storybook/**/*.*",
      "**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)",
    ],
    rules: {
      "import/no-default-export": "off",
      "no-console": "off",
    },
  },
]);
