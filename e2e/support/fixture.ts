/** Kept in its own file with no heavy imports, so `global-setup.ts` can read
 * these fixture slugs without pulling TypeORM entities into its own process
 * (see `seed-e2e-db-cli.ts`).
 *
 * Each 1/1 product is real inventory: once a spec buys (or holds) one, it's
 * gone for the rest of the run. Every spec that needs its own unsold item
 * gets a DIFFERENT slug here rather than sharing one across the whole
 * sequential run. These slugs are all available in the current Production
 * catalog snapshot (2026-11-07).
 */
export const E2E_TEST_PRODUCT_SLUGS = {
  successfulPurchase: "mint-angular-cup",
  failedPaymentRetry: "speckled-sculpted-mug",
  cancelReturn: "pink-petal-cup",
  duplicateCallback: "dachshund-sculpture",
  amountConsistency: "sharki",
  concurrency: "behind-flower",
  gatewayErrorRetry: "hale",
} as const;

export const ALL_E2E_TEST_PRODUCT_SLUGS = Object.values(E2E_TEST_PRODUCT_SLUGS);
