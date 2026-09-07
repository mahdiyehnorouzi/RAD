import type { MakingBrief, MakingCommission } from "@/components/making/type";
import type { LocaleCopy } from "@/types/locale";
import { api } from "./client";

export async function fetchMyCommissions() {
  return api<MakingCommission[]>("/commissions");
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
    body: JSON.stringify(input),
  });
}

export async function saveCommission(id: string, payload: MakingCommission) {
  return api<MakingCommission>(`/commissions/${id}`, {
    method: "PUT",
    body: JSON.stringify({ payload }),
  });
}
