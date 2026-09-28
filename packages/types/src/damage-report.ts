/**
 * Transit-damage claims. Mirrored by `DAMAGE_REPORT_STATUSES`,
 * `DAMAGE_RESOLUTIONS` and `DAMAGE_REPORT_WINDOW_HOURS` in the API.
 *
 * submitted → reviewing → approved (with a resolution) | declined
 */
export const DAMAGE_REPORT_STATUSES = [
  "submitted",
  "reviewing",
  "approved",
  "declined",
] as const;
export type DamageReportStatus = (typeof DAMAGE_REPORT_STATUSES)[number];

/** A one-of-one work cannot be swapped for an identical copy. */
export const DAMAGE_RESOLUTIONS = ["repair", "refund"] as const;
export type DamageResolution = (typeof DAMAGE_RESOLUTIONS)[number];

/** Hours after delivery to report damage. Later reports are still read, but flagged. */
export const DAMAGE_REPORT_WINDOW_HOURS = 24;

export interface DamageReportInput {
  orderId: string;
  /** JPEG/PNG/WebP data URL of the outer box as it arrived. */
  packagingPhoto: string;
  /** JPEG/PNG/WebP data URL of the damage itself. */
  damagePhoto: string;
  body: string;
}

export interface DamageReport {
  id: string;
  orderId: string;
  status: DamageReportStatus;
  resolution?: DamageResolution;
  /** RAD's reply, shown to the customer. */
  note?: string;
  body: string;
  packagingPhoto: string;
  damagePhoto: string;
  /** Sent after the report window closed. */
  late: boolean;
  createdAt: number;
  reviewedAt?: number;
}
