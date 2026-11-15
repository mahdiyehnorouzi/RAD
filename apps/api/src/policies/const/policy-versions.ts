/**
 * Mirrors `POLICY_SLUGS`, `CURRENT_POLICY_VERSIONS`, `ORDER_POLICY_SLUGS`
 * and `COMMISSION_POLICY_SLUGS` in `@rad/types` (the API is CommonJS and
 * cannot import that ESM package). Keep them identical; a checkout carrying
 * any other version is asked to reload the updated rules.
 */
export const POLICY_SLUGS = [
  "buying",
  "custom",
  "shipping",
  "returns",
  "terms",
  "privacy",
] as const;

export const CURRENT_POLICY_VERSIONS = {
  buying: "2026-11-09",
  custom: "2026-11-09",
  shipping: "2026-11-09",
  returns: "2026-11-09",
  terms: "2026-11-09",
  privacy: "2026-09-27",
} as const;

export const ORDER_POLICY_SLUGS = [
  "buying",
  "shipping",
  "returns",
  "terms",
  "privacy",
] as const;

export const COMMISSION_POLICY_SLUGS = ["custom", "terms", "privacy"] as const;
