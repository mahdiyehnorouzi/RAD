import { normalizePhone } from "../orders/payment-receipt";
import { normalizeProfileName } from "../auth/profile-input";
import { selectIranLocation } from "./addresses.locations";
import {
  ADDRESS_LINE_MAX,
  ADDRESS_LINE_MIN,
  ADDRESS_NAME_MAX,
  POSTAL_CODE_LENGTH,
} from "./const/limits";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export type AddressWrite = {
  recipientName: string;
  phone: string;
  provinceId: string;
  cityId: string;
  provinceLabel: string;
  cityLabel: string;
  address: string;
  postalCode: string | null;
};

export type AddressIssue = {
  ok: false;
  code: string;
  message: string;
};

export type ParsedAddress = { ok: true; value: AddressWrite } | AddressIssue;

export type AddressDraftInput = {
  recipientName?: string;
  phone?: string;
  provinceId?: string;
  cityId?: string;
  address?: string;
  postalCode?: string | null;
};

function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

function issue(code: string, message: string): AddressIssue {
  return { ok: false, code, message };
}

/**
 * Checkout's delivery rules, applied to a saved address:
 * recipient name 2–80, Iranian mobile, a real province/city pair,
 * street address of at least 8 characters, and an optional 10-digit postal code.
 * Labels come from the divisions dataset, not from the client.
 */
export function parseAddressInput(input: AddressDraftInput): ParsedAddress {
  const collapsed = (input.recipientName ?? "").trim().replace(/\s+/g, " ");
  const recipientName = normalizeProfileName(input.recipientName ?? "");
  if (!recipientName) {
    return issue(
      collapsed.length > ADDRESS_NAME_MAX ? "name_too_long" : "name_invalid",
      collapsed.length > ADDRESS_NAME_MAX
        ? "نام گیرنده نباید بیشتر از ۸۰ نویسه باشد."
        : "نام گیرنده باید حداقل ۲ نویسه باشد.",
    );
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return issue(
      "phone_invalid",
      "شماره موبایل گیرنده را با ۰۹ و یازده رقم بنویسید.",
    );
  }

  const place = selectIranLocation(
    input.provinceId?.trim() ?? "",
    input.cityId?.trim() ?? "",
  );
  if (!place.ok) {
    if (place.reason === "province") {
      return issue("province_invalid", "استان گیرنده را انتخاب کنید.");
    }
    if (place.reason === "mismatch") {
      return issue("city_mismatch", "شهر انتخاب‌شده در این استان نیست.");
    }
    return issue("city_invalid", "شهر گیرنده را انتخاب کنید.");
  }

  const address = (input.address ?? "").trim();
  if (address.length < ADDRESS_LINE_MIN) {
    return issue("address_invalid", "نشانی را کامل بنویسید؛ حداقل ۸ نویسه.");
  }
  if (address.length > ADDRESS_LINE_MAX) {
    return issue("address_too_long", "نشانی نباید بیشتر از ۴۰۰ نویسه باشد.");
  }

  const postal = normalizePostal(input.postalCode);
  if (postal === undefined) {
    return issue(
      "postal_invalid",
      "کد پستی را با ۱۰ رقم بنویسید، یا خالی بگذارید.",
    );
  }

  return {
    ok: true,
    value: {
      recipientName,
      phone,
      provinceId: place.provinceId,
      cityId: place.cityId,
      provinceLabel: place.provinceLabel,
      cityLabel: place.cityLabel,
      address,
      postalCode: postal,
    },
  };
}

/** `null` when omitted. `undefined` when present but not 10 digits. */
export function normalizePostal(raw: string | null | undefined) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const compact = latinDigits(trimmed).replace(/[\s-]/g, "");
  if (!new RegExp(`^\\d{${POSTAL_CODE_LENGTH}}$`).test(compact)) {
    return undefined;
  }
  return compact;
}
