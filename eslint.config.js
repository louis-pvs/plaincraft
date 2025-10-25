import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  // Global ignores
  {
    ignores: ["dist/**", "storybook-static/**", "**/*.mdx"],
  },

  // Base config for all files
  js.configs.recommended,

  // TypeScript and React files
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        // Browser APIs
        console: "readonly",
        window: "readonly",
        document: "readonly",
        globalThis: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLButtonElement: "readonly",
        Element: "readonly",
        Event: "readonly",
        InputEvent: "readonly",
        MouseEvent: "readonly",
        KeyboardEvent: "readonly",
        // React
        React: "readonly",
        JSX: "readonly",
        // Node.js (for scripts and config files)
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
      "unused-imports": unusedImports,
      prettier: prettier,
    },
    rules: {
      // TypeScript rules
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-unused-vars": "off", // Handled by unused-imports

      // Import rules
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

      // Unused imports
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

      // Console
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],

      // Prettier
      ...prettierConfig.rules,
      "prettier/prettier": "error",
    },
  },

  // Allow default exports in specific files
  {
    files: [
      "*.config.*",
      "scripts/**/*.*",
      ".storybook/**/*.*",
      "**/*.stories.ts",
      "**/*.stories.tsx",
    ],
    rules: {
      "import/no-default-export": "off",
      "no-console": "off",
    },
  },
];
