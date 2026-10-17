import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for RAD's E2E suite.
 *
 * Infra assumption (see tests/e2e/automation-strategy.md for the full
 * writeup): this config does NOT attempt to boot the full stack (Postgres +
 * API + storefront + admin) itself. `webServer` only starts the two Next.js
 * apps; the Postgres DB (`npm run db:up`) and the NestJS API (`npm run
 * dev:api`, port 4000) must already be running before `npm run test:e2e` is
 * invoked. This mirrors AGENTS.md's instruction not to invent infra that
 * isn't realistically startable by Playwright's webServer hook — the API
 * needs a live Postgres connection (TypeORM) and a `.env`, neither of which
 * Playwright can provision safely or portably.
 *
 * Required before running:
 *   npm run db:up        # postgres via docker compose
 *   npm run dev:api       # NestJS API on :4000 (separate terminal)
 *   npm run test:e2e      # this will additionally boot storefront (:3000)
 *                          # and admin (:3002) via webServer below
 */
const STOREFRONT_PORT = 3000;
const ADMIN_PORT = 3002;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "storefront",
      testDir: "./tests/e2e",
      testMatch: [
        "storefront/**/*.spec.ts",
        "custom-orders/**/*.spec.ts",
        "messaging/**/*.spec.ts",
        "cross-app/**/*.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${STOREFRONT_PORT}`,
      },
    },
    {
      name: "admin",
      testDir: "./tests/e2e",
      testMatch: ["admin/**/*.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${ADMIN_PORT}`,
      },
    },
  ],
  webServer: [
    {
      command: "next dev -H localhost -p 3000",
      cwd: "apps/storefront",
      url: `http://localhost:${STOREFRONT_PORT}`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "next dev -H localhost -p 3002",
      cwd: "apps/admin",
      url: `http://localhost:${ADMIN_PORT}`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
