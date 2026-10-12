"use client";

import Link from "next/link";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { productCardCopy } from "../const";
import { useScanOnView } from "./hooks";

/**
 * A brand-level passport cue, not a literal scannable QR pattern — the
 * card is on screen, not something to scan from itself. Hover, focus or
 * first view on touch still plays the reveal: corners close in, a beam
 * passes, the mark resolves into a check, same as before.
 */
export function ProductCardQr({
  product,
  name,
  caption,
}: {
  product: Pick<Product, "slug" | "radNumber">;
  name: string;
  caption?: string;
}) {
  const { locale, href } = useLocale();
  const { ref, scanned } = useScanOnView<HTMLAnchorElement>();

  return (
    <Link
      ref={ref}
      href={href(`/products/${product.slug}/qr`)}
      className={`rad-card-qr${scanned ? " is-scanned" : ""}`}
      aria-label={`${productCardCopy[locale].passport} — ${name}`}
    >
      <span className="rad-card-qr-frame" aria-hidden="true">
        <svg className="rad-card-qr-mark" viewBox="0 0 40 40" focusable="false">
          <rect x="7" y="4" width="26" height="32" rx="3" />
          <path d="M14 13h12M14 19h12M14 25h7" />
        </svg>
        <svg
          className="rad-card-qr-corners"
          viewBox="0 0 40 40"
          focusable="false"
        >
          <path d="M1 11V1h10M29 1h10v10M39 29v10H29M11 39H1V29" />
        </svg>
        <span className="rad-card-qr-beam" />
        <svg
          className="rad-card-qr-check"
          viewBox="0 0 40 40"
          focusable="false"
        >
          <circle cx="20" cy="20" r="16" pathLength={1} />
          <path d="M13 20.5l4.8 4.8L27.5 15" pathLength={1} />
        </svg>
      </span>
      {caption ? <small dir="ltr">{caption}</small> : null}
    </Link>
  );
}
