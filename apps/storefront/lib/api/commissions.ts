import type { MakingBrief, MakingCommission } from "@/components/making/type";
import type { LocaleCopy } from "@/types/locale";
import { api } from "./client";

/** Drop heavy data-URLs so commission POSTs finish before the API timeout. */
export function slimCommissionBrief(brief: MakingBrief): MakingBrief {
  const slimImage = (value?: string) =>
    value && value.startsWith("data:") && value.length > 120_000 ? undefined : value;
  const images = (brief.images ?? [])
    .map(slimImage)
    .filter((item): item is string => Boolean(item))
    .slice(0, 2);
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
  return api<MakingCommission[]>("/commissions/workshop", { timeoutMs: 12_000 });
}

export async function fetchCommission(id: string) {
  return api<MakingCommission>(`/commissions/${id}`);
}

export async function sendCommissionMessage(id: string, body: LocaleCopy) {
  return api<MakingCommission>(`/commissions/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function createCommission(input: {
  customerName: string;
  brief: MakingBrief;
  title?: LocaleCopy;
}) {
  return api<MakingCommission>("/commissions", {
    method: "POST",
    timeoutMs: 25_000,
    body: JSON.stringify({
      ...input,
      brief: slimCommissionBrief(input.brief),
    }),
  });
}

export async function saveCommission(id: string, payload: MakingCommission) {
  return api<MakingCommission>(`/commissions/${id}`, {
    method: "PUT",
    body: JSON.stringify({ payload }),
  });
}

export async function saveWorkshopCommission(id: string, payload: MakingCommission) {
  return api<MakingCommission>(`/commissions/workshop/${id}`, {
    method: "PUT",
    body: JSON.stringify({ payload }),
  });
}
