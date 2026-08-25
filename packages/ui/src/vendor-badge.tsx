import type { Vendor } from "@rad/types";

export function VendorBadge({ vendor, locale }: { vendor?: Vendor; locale: "fa" | "en" }) {
  if (!vendor || vendor.kind === "rad") return null;
  return (
    <span className="vendor-badge">
      <span>{locale === "fa" ? "اثر هنرمند مهمان" : "Guest artist"}</span>
      <b>{locale === "fa" ? vendor.displayName : vendor.displayNameEn}</b>
    </span>
  );
}
