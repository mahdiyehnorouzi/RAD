import type { PolicyVersions } from "@rad/types";
import type { MakingBrief, MakingCommission } from "@/components/making/type";
import type { LocaleCopy } from "@/types/locale";
import { api } from "./client";

/** A message append, always via the lock-protected endpoint - never the whole-payload save. */
type CommissionMessageInput = {
  body: LocaleCopy;
  internal?: boolean;
  operationId?: string;
};

/** Sketch plus the studio's four reference photos, each pre-compressed under the slim limit. */
export const COMMISSION_UPLOAD_IMAGES = 5;

/** Drop heavy data-URLs so commission POSTs finish before the API timeout. */
export function slimCommissionBrief(
  brief: MakingBrief,
  maxImages = 2,
): MakingBrief {
  const slimImage = (value?: string) =>
    value && value.startsWith("data:") && value.length > 120_000
      ? undefined
      : value;
  const images = (brief.images ?? [])
    .map(slimImage)
    .filter((item): item is string => Boolean(item))
    .slice(0, maxImages);
  return {
    ...brief,
    image: slimImage(brief.image) ?? images[0],
    images,
    sketch: slimImage(brief.sketch),
  };
}

export async function fetchMyCommissions() {
  return api<MakingCommission[]>("/commissions", { timeoutMs: 12_000 });
}

export async function fetchWorkshopCommissions() {
  return api<MakingCommission[]>("/commissions/workshop", {
    timeoutMs: 12_000,
  });
}

export async function fetchCommission(id: string) {
  return api<MakingCommission>(`/commissions/${id}`);
}

export async function createCommission(input: {
  customerName: string;
  brief: MakingBrief;
  title?: LocaleCopy;
  acceptedPolicies?: PolicyVersions;
}) {
  return api<MakingCommission>("/commissions", {
    method: "POST",
    timeoutMs: 25_000,
    body: JSON.stringify({
      ...input,
      brief: slimCommissionBrief(input.brief, COMMISSION_UPLOAD_IMAGES),
    }),
  });
}

export async function saveCommission(id: string, payload: MakingCommission) {
  return api<MakingCommission>(`/commissions/${id}`, {
    method: "PUT",
    body: JSON.stringify({ payload }),
  });
}

export async function saveWorkshopCommission(
  id: string,
  payload: MakingCommission,
) {
  return api<MakingCommission>(`/commissions/workshop/${id}`, {
    method: "PUT",
    body: JSON.stringify({ payload }),
  });
}

/**
 * Appends a customer message through the dedicated, lock-protected
 * endpoint - never through `saveCommission`'s whole-payload PUT, which
 * silently drops any `messages` the client sends (by design: a brief save
 * must never let a client write workflow/conversation state).
 */
export async function addCommissionMessage(
  id: string,
  input: CommissionMessageInput,
) {
  return api<MakingCommission>(`/commissions/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Appends an artist/maker message through the dedicated, lock-protected
 * workshop endpoint - never through `saveWorkshopCommission`'s
 * whole-payload PUT, which can overwrite a message someone else added
 * (customer, or the admin dashboard) after this client's local snapshot.
 */
export async function addWorkshopCommissionMessage(
  id: string,
  input: CommissionMessageInput,
) {
  return api<MakingCommission>(`/commissions/workshop/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
