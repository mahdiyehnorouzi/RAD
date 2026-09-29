import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      next: { rootDir: ["apps/storefront/", "apps/admin/"] },
    },
    // React Compiler rules: existing violations are tracked as warnings until each is refactored.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  {
    files: [
      "apps/api/**/*.ts",
      "scripts/**/*.{js,mjs}",
      "apps/*/scripts/**/*.{js,mjs}",
    ],
    languageOptions: { globals: globals.node },
  },
  // Formatting belongs to Prettier; must stay after every config that can enable style rules.
  prettier,
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/.next-qa/**",
    "**/.open-next/**",
    "**/.vinext/**",
    "**/.wrangler/**",
    "**/dist/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    "**/public/**",
    ".tmp-mock/**",
    ".impeccable/**",
    ".agents/**",
    ".openai/**",
    "work/**",
  ]),
]);
