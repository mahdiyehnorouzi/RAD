import type { CustomerAddress } from "@rad/types";
import { locationSelection } from "@/lib/geo/iran-locations";
import { isSessionExpired } from "@/lib/api";
import { toLatinDigits } from "@/lib/payment/receipt";
import {
  canonicalIranMobile,
  formatIranMobileDraft,
} from "@/lib/phone/iran-mobile";

/** Same optional 10-digit rule as the address book. Empty stays empty. */
const CHECKOUT_POSTAL_LENGTH = 10;

export type DeliveryFields = {
  name: string;
  phone: string;
  provinceId: string;
  cityId: string;
  address: string;
  postalCode: string;
};

export type CheckoutDraft = Partial<DeliveryFields> & {
  /** Legacy free-text city, restored only when it matches one place. */
  city?: string;
  addressChoice?: string;
  savedAddressId?: string;
};

const DRAFT_KEYS = [
  "name",
  "phone",
  "provinceId",
  "cityId",
  "city",
  "address",
  "postalCode",
] as const;

export function emptyDeliveryFields(): DeliveryFields {
  return {
    name: "",
    phone: "",
    provinceId: "",
    cityId: "",
    address: "",
    postalCode: "",
  };
}

export function addressChoiceOf(draft: CheckoutDraft): "" | "saved" | "manual" {
  return draft.addressChoice === "saved" || draft.addressChoice === "manual"
    ? draft.addressChoice
    : "";
}

export function savedAddressIdOf(draft: CheckoutDraft) {
  return addressChoiceOf(draft) === "saved" ? (draft.savedAddressId ?? "") : "";
}

/**
 * A stored draft or an explicit saved/manual choice blocks the default
 * address. An empty session (`{}`) does not, so the default can preselect.
 */
export function draftBlocksDefault(draft: CheckoutDraft) {
  if (addressChoiceOf(draft)) return true;
  return DRAFT_KEYS.some((key) => draft[key] !== undefined);
}

/** The default address, and only when the buyer has not already chosen. */
export function defaultAddressToApply(
  draft: CheckoutDraft,
  addresses: readonly CustomerAddress[],
) {
  if (draftBlocksDefault(draft)) return null;
  return addresses.find((address) => address.isDefault) ?? null;
}

export function deliveryFromSaved(address: CustomerAddress): DeliveryFields {
  return {
    name: address.recipientName,
    phone: formatIranMobileDraft(address.phone),
    provinceId: address.provinceId,
    cityId: address.cityId,
    address: address.address,
    postalCode: address.postalCode ?? "",
  };
}

function collapseName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

/** Digits only. Invalid and empty both stay comparable; validity is separate. */
function compactPostal(raw: string) {
  return toLatinDigits(raw).replace(/[\s-]/g, "");
}

export function validPostalOrEmpty(
  raw: string,
): { ok: true; postal: string } | { ok: false } {
  const postal = compactPostal(raw);
  if (!postal) return { ok: true, postal: "" };
  if (new RegExp(`^\\d{${CHECKOUT_POSTAL_LENGTH}}$`).test(postal)) {
    return { ok: true, postal };
  }
  return { ok: false };
}

/** True when the form still matches the saved record. Editing does not write back. */
export function sameDelivery(fields: DeliveryFields, address: CustomerAddress) {
  const saved = deliveryFromSaved(address);
  return (
    collapseName(fields.name) === collapseName(saved.name) &&
    (canonicalIranMobile(fields.phone) ?? "") ===
      (canonicalIranMobile(saved.phone) ?? "") &&
    fields.provinceId === saved.provinceId &&
    fields.cityId === saved.cityId &&
    fields.address.trim() === saved.address.trim() &&
    compactPostal(fields.postalCode) === compactPostal(saved.postalCode)
  );
}

/** Persian `province، city` for the existing order city column. */
export function orderCitySnapshot(provinceId: string, cityId: string) {
  const place = locationSelection(provinceId, cityId);
  return place.ok ? place.snapshot : null;
}

/** Street, then an optional postal suffix. No saved-address id is included. */
export function orderAddressSnapshot(
  street: string,
  postal: string,
  postalLabel: string,
  locale: "fa" | "en",
) {
  const suffix = postal ? `${postalLabel} ${postal}` : "";
  return [street.trim(), suffix]
    .filter(Boolean)
    .join(locale === "fa" ? "، " : ", ");
}

export function checkoutAddressLoadStatus(error: unknown): "expired" | "error" {
  return isSessionExpired(error) ? "expired" : "error";
}
