import { DESIGNER_COLORS } from "@/features/studio/custom-designer/const/spark";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

type ColorSwatch = {
  key: string;
  label: string;
  /** Absent when the stored value is not a known glaze or a hex colour. */
  background: string | null;
};

export function colorSwatches(
  values: readonly string[] | undefined,
  locale: "fa" | "en",
): ColorSwatch[] {
  const swatches: ColorSwatch[] = [];
  if (!values?.length) return swatches;
  values.forEach((value, index) => {
    const token = value.trim();
    if (!token) return;
    const preset = DESIGNER_COLORS.find(
      (color) => color.value === token || color.id === token,
    );
    if (preset) {
      swatches.push({
        key: `${preset.id}-${index}`,
        label: preset.label[locale],
        background: "background" in preset ? preset.background : preset.value,
      });
      return;
    }
    swatches.push({
      key: `${token}-${index}`,
      label: token,
      background: HEX.test(token) ? token : null,
    });
  });
  return swatches;
}

type PermissionView =
  | { state: "missing" }
  | { state: "unknown"; text: string }
  | { state: "allowed"; text: string }
  | { state: "refused"; text: string }
  | { state: "noted"; text: string };

export function permissionView(
  value: unknown,
  locale: "fa" | "en",
): PermissionView {
  const fa = locale === "fa";
  if (value === undefined) return { state: "missing" };
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return {
      state: "unknown",
      text: fa ? "هنوز نگفته‌اید" : "You have not said yet",
    };
  }
  if (value === true || value === "true") {
    return {
      state: "allowed",
      text: fa
        ? "بله؛ سازنده می‌تواند جایی غافلگیرتان کند"
        : "Yes — the maker may surprise you",
    };
  }
  if (value === false || value === "false") {
    return {
      state: "refused",
      text: fa
        ? "نه؛ کار باید به طرح نزدیک بماند"
        : "No — keep the piece close to the design",
    };
  }
  if (value === "faithful") {
    return {
      state: "noted",
      text: fa ? "نزدیک به طرح بماند" : "Stay close to the design",
    };
  }
  if (value === "hand") {
    return {
      state: "noted",
      text: fa
        ? "سازنده می‌تواند کمی تغییر بدهد"
        : "The maker may change a little",
    };
  }
  if (value === "material") {
    return {
      state: "noted",
      text: fa
        ? "سازنده در ماده و جزئیات آزاد است"
        : "The maker is free with material and detail",
    };
  }
  if (typeof value === "string" && /[\u0600-\u06FF]/.test(value)) {
    return { state: "noted", text: value.trim() };
  }
  return {
    state: "unknown",
    text: fa
      ? "ثبت شده، ولی توضیح روشنی ندارد"
      : "Recorded, without a clear note",
  };
}

/** Owner-scoped commission payloads may only be shown from safe URLs. */
export function safeAttachmentSrc(
  src: string | undefined | null,
): string | null {
  if (!src) return null;
  const value = src.trim();
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:text/html")) {
    return null;
  }
  if (
    lower.startsWith("data:image/") ||
    lower.startsWith("data:audio/") ||
    lower.startsWith("blob:") ||
    value.startsWith("/")
  ) {
    return value;
  }
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return value;
  } catch {
    return null;
  }
  return null;
}
