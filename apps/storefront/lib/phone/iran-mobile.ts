import { toLatinDigits } from "@/lib/payment/receipt";

/**
 * Iranian mobile numbers, stored as `09` and nine more digits.
 * The same rule lives in `apps/api/src/orders/payment-receipt.ts`.
 */
export function canonicalIranMobile(raw: string | undefined | null) {
  const digits = toLatinDigits(raw ?? "").replace(/\D/g, "");
  let national = "";
  if (digits.startsWith("0098")) {
    if (digits.length !== 14) return null;
    national = digits.slice(4);
  } else if (digits.startsWith("98")) {
    if (digits.length !== 12) return null;
    national = digits.slice(2);
  } else if (digits.startsWith("09")) {
    if (digits.length !== 11) return null;
    national = digits.slice(1);
  } else if (digits.startsWith("9")) {
    if (digits.length !== 10) return null;
    national = digits;
  } else {
    return null;
  }
  return /^9\d{9}$/.test(national) ? `0${national}` : null;
}

/** Latin digits, grouped `0912 123 4567` once a leading zero is present. */
export function formatIranMobileDraft(raw: string) {
  let digits = toLatinDigits(raw).replace(/\D/g, "");
  if (digits.startsWith("0098")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("98") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  }
  digits = digits.slice(0, 11);
  return groupIranMobile(digits);
}

function groupIranMobile(digits: string) {
  if (!digits.startsWith("0")) return digits;
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

function digitsBefore(value: string, cursor: number) {
  return toLatinDigits(value.slice(0, Math.max(0, cursor))).replace(/\D/g, "")
    .length;
}

function cursorAfterDigits(formatted: string, count: number) {
  if (count <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index] ?? "")) {
      seen += 1;
      if (seen === count) return index + 1;
    }
  }
  return formatted.length;
}

/**
 * Reformats a phone edit and keeps the caret on the same digit.
 * Backspacing a grouping space deletes the digit before that space,
 * instead of putting the space straight back.
 */
export function applyIranMobileEdit(
  previous: string,
  nextRaw: string,
  cursor: number,
) {
  const previousDigits = toLatinDigits(previous).replace(/\D/g, "");
  const nextDigits = toLatinDigits(nextRaw).replace(/\D/g, "");
  const before = digitsBefore(nextRaw, cursor);
  const onlyRemovedFormatting =
    nextDigits === previousDigits &&
    toLatinDigits(nextRaw).length < toLatinDigits(previous).length;
  if (onlyRemovedFormatting) {
    const index = Math.max(0, before - 1);
    const trimmed =
      previousDigits.slice(0, index) + previousDigits.slice(index + 1);
    const value = formatIranMobileDraft(trimmed);
    return { value, cursor: cursorAfterDigits(value, index) };
  }
  const value = formatIranMobileDraft(nextRaw);
  return {
    value,
    cursor: cursorAfterDigits(
      value,
      Math.min(before, digitsBefore(value, value.length)),
    ),
  };
}

export function iranMobileMessage(
  raw: string,
  interacted: boolean,
  copy: { empty: string; invalid: string },
) {
  if (!interacted) return undefined;
  if (!raw.trim()) return copy.empty;
  if (!canonicalIranMobile(raw)) return copy.invalid;
  return undefined;
}
