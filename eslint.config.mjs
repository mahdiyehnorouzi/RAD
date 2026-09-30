import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";

// ESLint 9 requires the plugin on the same config object as these rule names.
const reactHookWarnings = {
  "react-hooks/set-state-in-effect": "warn",
  "react-hooks/purity": "warn",
  "react-hooks/refs": "warn",
  "react-hooks/use-memo": "warn",
  "react-hooks/preserve-manual-memoization": "warn",
};

export default defineConfig([
  ...nextVitals.map((config) =>
    config.plugins?.["react-hooks"]
      ? { ...config, rules: { ...config.rules, ...reactHookWarnings } }
      : config,
  ),
  ...nextTs,
  {
    settings: {
      next: { rootDir: ["apps/storefront/", "apps/admin/"] },
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
  {
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
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
