import type { POLICY_SLUGS } from "../const";

export type PolicySlug = (typeof POLICY_SLUGS)[number];

export type PolicyVersions = Partial<Record<PolicySlug, string>>;

/** The exact rule versions a customer agreed to, and when. */
export type PolicyAcceptance = {
  versions: PolicyVersions;
  acceptedAt: number;
};
