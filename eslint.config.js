import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  ...compat.config({
    root: true,
    env: { browser: true, es2022: true, node: true },
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    plugins: ["@typescript-eslint", "import", "unused-imports"],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript",
      "prettier"
    ],
    settings: { "import/resolver": { typescript: true } },
    rules: {
      "import/no-default-export": "error",
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "no-console": "warn"
    },
    overrides: [
      { files: ["*.config.*", "scripts/**/*.*"], rules: { "import/no-default-export": "off" } }
    ]
  }),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname
      }
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error"
    }
  }
];
