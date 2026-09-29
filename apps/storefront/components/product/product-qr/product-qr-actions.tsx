"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, ArrowUpRight, Check, Copy, Printer } from "lucide-react";
import { useLocale } from "@/components/i18n";

export function ProductQrActions({
  targetUrl,
  productHref,
}: {
  targetUrl: string;
  productHref: string;
}) {
  const { locale, t, href } = useLocale();
  const [copied, setCopied] = useState(false);
  const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="product-qr-actions">
      <button type="button" className="product-qr-action is-solid" onClick={() => window.print()}>
        <Printer aria-hidden="true" />
        <span>{t("productQrPrint")}</span>
      </button>
      <button type="button" className="product-qr-action" onClick={copyLink}>
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        <span aria-live="polite">{copied ? t("productQrCopied") : t("productQrCopyLink")}</span>
      </button>
      <Link className="product-qr-action" href={href(productHref)}>
        <Arrow aria-hidden="true" />
        <span>{t("productQrViewProduct")}</span>
      </Link>
    </div>
  );
}
