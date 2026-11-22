import {
  radIdentityLabel,
  radPermanentUrl,
  type RadIdentityStatus,
} from "@rad/types";
import type { LegacyArtworkGap, QrArtworkFile } from "./identity-print";

export interface LegacyArtworkIdentity {
  radNumber: number;
  status: RadIdentityStatus;
  productId: string | null;
  batchId: string | null;
}

/**
 * Decide whether an existing numbered product may have a printable QR.
 * This never allocates a number. A code is printable only when the
 * permanent URL resolves to this same product.
 */
export function classifyLegacyArtwork(input: {
  product: { id: string; name: string; status: string; radNumber: number };
  identities: LegacyArtworkIdentity[];
  resolvedProductId: string | null;
}): { row: QrArtworkFile | null; gap: LegacyArtworkGap | null } {
  const linked = input.identities.filter(
    (row) => row.productId === input.product.id && row.status === "assigned",
  );
  const holder = input.identities.find(
    (row) => row.radNumber === input.product.radNumber,
  );
  const disagreeing = linked.find(
    (row) => row.radNumber !== input.product.radNumber,
  );
  const heldByAnother =
    holder?.status === "assigned" &&
    Boolean(holder.productId) &&
    holder.productId !== input.product.id;
  if (disagreeing || heldByAnother) {
    const identityNumber = disagreeing?.radNumber ?? holder?.radNumber ?? null;
    return {
      row: null,
      gap: {
        productId: input.product.id,
        radNumber: input.product.radNumber,
        issue: "identity_mismatch",
        detail: `شماره شناسه ${identityNumber ?? "—"} با شماره اثر ${input.product.radNumber} یکی نیست`,
      },
    };
  }
  const assignedHere =
    holder?.status === "assigned" && holder.productId === input.product.id;
  if (holder && !assignedHere) {
    return {
      row: null,
      gap: {
        productId: input.product.id,
        radNumber: input.product.radNumber,
        issue: "url_not_this_artwork",
        detail: "آدرس دائمی این شماره به این اثر نمی‌رسد",
      },
    };
  }
  if (input.resolvedProductId !== input.product.id) {
    return {
      row: null,
      gap: {
        productId: input.product.id,
        radNumber: input.product.radNumber,
        issue: "url_not_this_artwork",
        detail: "آدرس دائمی این شماره به این اثر نمی‌رسد",
      },
    };
  }
  return {
    row: {
      radNumber: input.product.radNumber,
      label: radIdentityLabel(input.product.radNumber),
      url: radPermanentUrl(input.product.radNumber),
      status: "assigned",
      productId: input.product.id,
      productName: input.product.name,
      batchId: holder?.batchId ?? null,
      storyPublished: ["ready", "available", "sold", "archived"].includes(
        input.product.status,
      ),
    },
    gap: holder
      ? null
      : {
          productId: input.product.id,
          radNumber: input.product.radNumber,
          issue: "missing_identity",
          detail: "آدرس دائمی به همین اثر می‌رسد و شناسه تازه‌ای ساخته نشد",
        },
  };
}
