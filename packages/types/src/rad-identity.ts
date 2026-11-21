import { formatRadCode } from "./artwork";

/** Physical-tag lifecycle. Independent of product commerce status. */
export const RAD_IDENTITY_STATUSES = [
  "reserved",
  "assigned",
  "retired",
] as const;
export type RadIdentityStatus = (typeof RAD_IDENTITY_STATUSES)[number];

export const RAD_IDENTITY_EVENT_KINDS = [
  "reserved",
  "assigned",
  "retired",
  "printed",
] as const;
export type RadIdentityEventKind = (typeof RAD_IDENTITY_EVENT_KINDS)[number];

/** Printed QR codes always use this origin. Env-specific hosts are not encoded. */
export const CANONICAL_RAD_ORIGIN = "https://www.rad-object.com";

/** Largest reservation an admin may request in one call. */
export const MAX_RAD_IDENTITY_BATCH = 200;

export function radShortPath(radNumber: number) {
  return `/r/${formatRadCode(radNumber)}`;
}

export function radPermanentUrl(
  radNumber: number,
  origin = CANONICAL_RAD_ORIGIN,
) {
  return `${origin.replace(/\/$/, "")}${radShortPath(radNumber)}`;
}

export function radIdentityLabel(radNumber: number) {
  return `RAD-${formatRadCode(radNumber)}`;
}

/** Public QR destination. Never includes draft names, prices, or images. */
export interface PublicRadIdentity {
  radNumber: number;
  code: string;
  status: RadIdentityStatus;
  storyPublished: boolean;
  /** Temporary passport path when the story is public. Null otherwise. */
  passportPath: string | null;
}

export interface RadIdentityEventView {
  kind: RadIdentityEventKind;
  at: number;
  productId: string | null;
  batchId: string | null;
}

export interface RadIdentityView {
  id: string;
  radNumber: number;
  code: string;
  label: string;
  status: RadIdentityStatus;
  printed: boolean;
  batchId: string | null;
  productId: string | null;
  productName: string | null;
  productSlug: string | null;
  createdAt: number;
  reservedAt: number;
  assignedAt: number | null;
  printedAt: number | null;
  permanentUrl: string;
  qr: { size: number; d: string };
  events?: RadIdentityEventView[];
}

export interface RadIdentitySummary {
  total: number;
  reserved: number;
  assigned: number;
  retired: number;
  printed: number;
  unassigned: number;
}

export interface RadIdentityBatchView {
  id: string;
  idempotencyKey: string;
  quantity: number;
  startNumber: number;
  endNumber: number;
  startCode: string;
  endCode: string;
  printedAt: number | null;
  createdAt: number;
  replayed?: boolean;
}
