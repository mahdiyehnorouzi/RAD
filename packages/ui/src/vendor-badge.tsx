import type { Vendor } from "@rad/types";

export function VendorBadge({
  vendor,
  locale,
  label,
}: {
  vendor?: Vendor;
  locale: "fa" | "en";
  label?: string;
}) {
  if (!vendor || vendor.kind === "rad") return null;
  return (
    <span className="vendor-badge">
      <span>{label}</span>
      <b>{locale === "fa" ? vendor.displayName : vendor.displayNameEn}</b>
    </span>
  );
}
