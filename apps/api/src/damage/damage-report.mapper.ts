import type { DamageReport, Order } from "../database/entities";
import type {
  AdminDamageReport,
  CustomerDamageReport,
  DamageReportStatus,
  DamageResolution,
} from "./type";

export function toCustomerDamageReport(
  report: DamageReport,
): CustomerDamageReport {
  return {
    id: report.id,
    orderId: report.orderId,
    status: report.status as DamageReportStatus,
    resolution: (report.resolution as DamageResolution | null) ?? undefined,
    note: report.note ?? undefined,
    body: report.body,
    packagingPhoto: report.packagingPhoto,
    damagePhoto: report.damagePhoto,
    late: report.late,
    createdAt: report.createdAt.getTime(),
    reviewedAt: report.reviewedAt?.getTime(),
  };
}

export function toAdminDamageReport(
  report: DamageReport,
  order?: Pick<Order, "name" | "phone" | "deliveredAt"> | null,
): AdminDamageReport {
  return {
    ...toCustomerDamageReport(report),
    customer: order?.name ?? "",
    phone: order?.phone || undefined,
    signedIn: Boolean(report.userId),
    deliveredAt: order?.deliveredAt?.getTime(),
  };
}
