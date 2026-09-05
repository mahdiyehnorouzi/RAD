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
    <span className="vendor-badge mb-1 inline-flex w-fit border border-current px-2 py-1 text-caption text-rad-muted">
      <span>{label}</span>
      <b className="ms-2 font-medium text-rad-ink">
        {locale === "fa" ? vendor.displayName : vendor.displayNameEn}
      </b>
    </span>
  );
}
