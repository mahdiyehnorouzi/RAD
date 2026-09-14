"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n";
import { Button } from "@/components/ui/button-link";

export function ProductQrActions({ targetUrl }: { targetUrl: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

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
      <Button type="button" onClick={() => window.print()}>
        {t("productQrPrint")}
      </Button>
      <Button type="button" outline onClick={copyLink}>
        {copied ? t("productQrCopied") : t("productQrCopyLink")}
      </Button>
    </div>
  );
}
