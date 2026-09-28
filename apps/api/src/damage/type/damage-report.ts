import type { DAMAGE_REPORT_STATUSES, DAMAGE_RESOLUTIONS } from "../const";

export type DamageReportStatus = (typeof DAMAGE_REPORT_STATUSES)[number];
export type DamageResolution = (typeof DAMAGE_RESOLUTIONS)[number];

/** A report as the customer sees it on their order page. */
export type CustomerDamageReport = {
  id: string;
  orderId: string;
  status: DamageReportStatus;
  resolution?: DamageResolution;
  note?: string;
  body: string;
  packagingPhoto: string;
  damagePhoto: string;
  late: boolean;
  createdAt: number;
  reviewedAt?: number;
};

/** Staff also see who sent it and the order it belongs to. */
export type AdminDamageReport = CustomerDamageReport & {
  customer: string;
  phone?: string;
  signedIn: boolean;
  deliveredAt?: number;
};
