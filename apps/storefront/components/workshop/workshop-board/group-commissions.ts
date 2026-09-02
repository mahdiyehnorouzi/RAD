import type {MakingCommission} from "@/components/making/type";
import { workshopBucket } from "@/lib/making";

export function groupWorkshopCommissions(commissions: MakingCommission[]) {
  const needs = commissions.filter((item) => workshopBucket(item) === "needs_artist");
  const waiting = commissions.filter((item) => workshopBucket(item) === "waiting_customer");
  const rest = commissions.filter((item) => {
    const bucket = workshopBucket(item);
    return bucket === "production" || bucket === "archive";
  });
  return { needs, waiting, rest };
}
