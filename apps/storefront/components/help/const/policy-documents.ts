import {
  CURRENT_POLICY_VERSIONS,
  type Locale,
  type PolicySlug,
} from "@rad/types";
import type { PolicyDocument, PolicyPoint, PolicyVersion } from "../type";
import { BUYING_POLICY } from "./policy-buying";
import { CUSTOM_POLICY } from "./policy-custom";
import { PRIVACY_POLICY } from "./policy-privacy";
import { RETURNS_POLICY } from "./policy-returns";
import { SHIPPING_POLICY } from "./policy-shipping";
import { TERMS_POLICY } from "./policy-terms";

export const POLICY_DOCUMENTS: PolicyDocument[] = [
  BUYING_POLICY,
  CUSTOM_POLICY,
  SHIPPING_POLICY,
  RETURNS_POLICY,
  TERMS_POLICY,
  PRIVACY_POLICY,
];

export const GUIDE_DOCUMENTS = POLICY_DOCUMENTS.filter(
  (doc) => doc.kind === "guide",
);
export const LEGAL_DOCUMENTS = POLICY_DOCUMENTS.filter(
  (doc) => doc.kind === "legal",
);

for (const doc of POLICY_DOCUMENTS) {
  if (doc.versions[0]?.id !== CURRENT_POLICY_VERSIONS[doc.slug]) {
    throw new Error(
      `Policy "${doc.slug}": newest version ${doc.versions[0]?.id} must match CURRENT_POLICY_VERSIONS (${CURRENT_POLICY_VERSIONS[doc.slug]}) in @rad/types and the API mirror.`,
    );
  }
}

export function policyDocument(slug: string) {
  return POLICY_DOCUMENTS.find((doc) => doc.slug === slug);
}

export function currentPolicyVersion(doc: PolicyDocument): PolicyVersion {
  return doc.versions[0];
}

export function policyVersion(doc: PolicyDocument, id: string) {
  return doc.versions.find((version) => version.id === id);
}

/** An "in short" line of the current text, quoted on purchase pages. */
export function policyPoint(slug: PolicySlug, id: string): PolicyPoint {
  const doc = policyDocument(slug);
  const point =
    doc && currentPolicyVersion(doc).points.find((item) => item.id === id);
  if (!point) throw new Error(`Missing policy point ${slug}/${id}`);
  return point;
}

export function policyPath(slug: PolicySlug, section?: string) {
  return `/help/${slug}${section ? `#${section}` : ""}`;
}

/** Current versions live at the plain URL; older ones keep their own. */
export function policyVersionPath(slug: PolicySlug, version: string) {
  return CURRENT_POLICY_VERSIONS[slug] === version
    ? `/help/${slug}`
    : `/help/${slug}/v/${version}`;
}

export function formatPolicyDate(id: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${id}T12:00:00Z`));
}
