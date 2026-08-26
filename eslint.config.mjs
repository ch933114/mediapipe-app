import { fixupPluginRules } from "@eslint/compat";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintPluginImport from "eslint-plugin-import";
import importRecommended from "eslint-plugin-import/config/recommended.js";
import importTypeScript from "eslint-plugin-import/config/typescript.js";
import prettierPlugin from "eslint-plugin-prettier";
import vuePlugin from "eslint-plugin-vue";
import { createRequire } from "node:module";
import vueParser from "vue-eslint-parser";

const require = createRequire(import.meta.url);

let autoImportGlobals = {};
try {
  autoImportGlobals = require("./.eslintrc-auto-import.json").globals ?? {};
} catch {
  autoImportGlobals = {};
}

const {
  rules: vueRecommendedRules = {},
  settings: vueRecommendedSettings = {},
} = vuePlugin.configs["flat/recommended"] ?? {};
const { rules: prettierRecommendedRules = {} } =
  prettierPlugin.configs.recommended;

export default [
  {
    ignores: [
      "dist",
      "node_modules",
      ".output",
      ".cache",
      "pnpm-lock.yaml",
      "auto-imports.d.ts",
      "components.d.ts",
      ".eslintrc-auto-import.json",
      "src/env.d.ts",
    ],
  },
  {
    languageOptions: {
      globals: autoImportGlobals,
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: vueParser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".vue"],
        ecmaVersion: "latest",
        sourceType: "module",
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      vue: vuePlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...vueRecommendedRules,
      ...prettierRecommendedRules,
    },
    settings: {
      ...vueRecommendedSettings,
      "vue/setup-compiler-macros": true,
      "import/resolver": {
        node: {
          extensions: [".js", ".ts", ".vue"],
        },
        alias: {
          map: [["@", "./src"]],
          extensions: [".ts", ".js", ".vue"],
        },
      },
    },
  },
  {
    files: ["**/*.{ts,js}"],
    ignores: ["**/*.d.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: fixupPluginRules(eslintPluginImport),
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".ts", ".vue"],
        },
        alias: {
          map: [["@", "./src"]],
          extensions: [".ts", ".js", ".vue"],
        },
      },
    },
    rules: {
      ...importRecommended.rules,
      ...importTypeScript.rules,
      ...prettierRecommendedRules,
      "import/no-unresolved": "error",
    },
  },
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
];
