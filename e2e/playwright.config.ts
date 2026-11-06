import { defineConfig, devices } from "@playwright/test";

/**
 * RAD-134: local-only browser E2E for the purchase/payment flow.
 * Everything this suite touches (DB, API, storefront, payment gateway) is
 * started fresh per run by `global-setup.ts` and is disposable — see that
 * file for the fail-closed production checks.
 *
 * Playwright's own browser download is geo-blocked in this environment
 * (`cdn.playwright.dev` returned 403 "not available in your location"),
 * so tests run against the machine's installed Chrome via `channel:
 * "chrome"` instead of a Playwright-managed Chromium build.
 */
export default defineConfig({
  testDir: "./specs",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  globalSetup: "./global-setup.ts",
  reporter: [["list"]],
  use: {
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
