"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { qrModulePath, workScanUrl } from "@/lib/qr";
import { productCardCopy } from "../const";
import { useScanOnView } from "./hooks";

/**
 * The work's real label code. Hover, focus or first view on touch plays the
 * scan: corners close in, a beam passes, the code resolves into a check.
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
  const { slug, radNumber } = product;
  const { size, d } = useMemo(
    () => qrModulePath(workScanUrl({ slug, radNumber })),
    [slug, radNumber],
  );

  return (
    <Link
      ref={ref}
      href={href(`/products/${product.slug}/qr`)}
      className={`rad-card-qr${scanned ? " is-scanned" : ""}`}
      aria-label={`${productCardCopy[locale].scan} ${name}`}
    >
      <span className="rad-card-qr-frame" aria-hidden="true">
        <svg
          className="rad-card-qr-code"
          viewBox={`-1 -1 ${size + 2} ${size + 2}`}
          shapeRendering="crispEdges"
          focusable="false"
        >
          <path d={d} />
        </svg>
        <svg className="rad-card-qr-corners" viewBox="0 0 40 40" focusable="false">
          <path d="M1 11V1h10M29 1h10v10M39 29v10H29M11 39H1V29" />
        </svg>
        <span className="rad-card-qr-beam" />
        <svg className="rad-card-qr-check" viewBox="0 0 40 40" focusable="false">
          <circle cx="20" cy="20" r="16" pathLength={1} />
          <path d="M13 20.5l4.8 4.8L27.5 15" pathLength={1} />
        </svg>
      </span>
      {caption ? <small dir="ltr">{caption}</small> : null}
    </Link>
  );
}
