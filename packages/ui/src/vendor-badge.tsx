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
  const name = locale === "fa" ? vendor.displayName : vendor.displayNameEn;
  return (
    <span className="vendor-badge mb-1 inline-flex w-fit items-center border border-current px-2 py-1 text-caption text-rad-muted">
      {label ? <span>{label}</span> : null}
      <b className={`font-medium text-rad-ink${label ? " ms-2" : ""}`}>{name}</b>
    </span>
  );
}
