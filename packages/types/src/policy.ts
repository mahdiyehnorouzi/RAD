/**
 * RAD's published rules. The storefront owns every text and never edits a
 * published version in place: a change is a new version with a new date.
 * `CURRENT_POLICY_VERSIONS` is mirrored in `apps/api/src/policies/const`
 * (the API is CommonJS and cannot import this package); keep them identical.
 */
export const POLICY_SLUGS = [
  "buying",
  "custom",
  "shipping",
  "returns",
  "terms",
  "privacy",
] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

/** Newest published version of each document (its publication date). */
export const CURRENT_POLICY_VERSIONS: Record<PolicySlug, string> = {
  buying: "2026-09-27",
  custom: "2026-09-27",
  shipping: "2026-09-27",
  returns: "2026-09-27",
  terms: "2026-09-27",
  privacy: "2026-09-27",
};

/** What a buyer accepts when placing a shop order. */
export const ORDER_POLICY_SLUGS = [
  "buying",
  "shipping",
  "returns",
  "terms",
  "privacy",
] as const satisfies readonly PolicySlug[];

/** What a customer accepts when sending a custom-order request. */
export const COMMISSION_POLICY_SLUGS = [
  "custom",
  "terms",
  "privacy",
] as const satisfies readonly PolicySlug[];

export type PolicyVersions = Partial<Record<PolicySlug, string>>;

/** The exact texts a customer agreed to, saved with the order. */
export interface PolicyAcceptance {
  versions: PolicyVersions;
  acceptedAt: number;
}

export function currentPolicyVersions(
  slugs: readonly PolicySlug[],
): PolicyVersions {
  return Object.fromEntries(
    slugs.map((slug) => [slug, CURRENT_POLICY_VERSIONS[slug]]),
  );
}
