import type { DamageReport, DamageReportInput } from "@rad/types";
import { api } from "./client";

export async function fetchDamageReports(orderId: string) {
  return api<DamageReport[]>(
    `/damage-reports?orderId=${encodeURIComponent(orderId)}`,
  );
}

export async function createDamageReport(input: DamageReportInput) {
  return api<DamageReport>("/damage-reports", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
