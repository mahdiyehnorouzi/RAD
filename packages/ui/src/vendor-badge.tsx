import type { Vendor } from "@rad/types";

export function VendorBadge({ vendor, locale }: { vendor?: Vendor; locale: "fa" | "en" }) {
  if (!vendor || vendor.kind === "rad") return null;
  return <span className="inline-flex items-center gap-2 border border-rad-oxide px-2 py-1 text-xs text-rad-oxide">{locale === "fa" ? "اثر هنرمند مهمان" : "Guest artist"} · {locale === "fa" ? vendor.displayName : vendor.displayNameEn}</span>;
}
