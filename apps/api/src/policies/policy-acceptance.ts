import { BadRequestException, ConflictException } from "@nestjs/common";
import { CURRENT_POLICY_VERSIONS } from "./const";
import type { PolicySlug, PolicyVersions } from "./type";

/**
 * Checks the customer accepted the current version of every required
 * document and returns exactly those versions for saving.
 */
export function acceptedPolicyVersions(
  input: unknown,
  required: readonly PolicySlug[],
  missingMessage: string,
): PolicyVersions {
  if (!input || typeof input !== "object") {
    throw new BadRequestException(missingMessage);
  }
  const sent = input as Record<string, unknown>;
  const versions: PolicyVersions = {};
  for (const slug of required) {
    if (typeof sent[slug] !== "string" || !sent[slug]) {
      throw new BadRequestException(missingMessage);
    }
    if (sent[slug] !== CURRENT_POLICY_VERSIONS[slug]) {
      throw new ConflictException(
        "قوانین رَد به‌روز شده است؛ صفحه را تازه کن و نسخه‌ی جدید را پیش از ثبت ببین.",
      );
    }
    versions[slug] = CURRENT_POLICY_VERSIONS[slug];
  }
  return versions;
}

export function toPolicyAcceptance(
  versions: Record<string, string> | null | undefined,
  acceptedAt: Date | null | undefined,
) {
  if (!versions || !acceptedAt) return undefined;
  return { versions: versions as PolicyVersions, acceptedAt: acceptedAt.getTime() };
}
