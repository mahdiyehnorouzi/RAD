"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n";

/** The compact bar that stays under the header while the archive scrolls past on small screens. */
export function ArchivePinbar({ shown }: { shown: boolean }) {
  const { t, href, locale } = useLocale();
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <div className={`archive-pinbar${shown ? " is-shown" : ""}`} inert={!shown}>
      <svg className="archive-pinbar-thread" viewBox="0 0 24 44" aria-hidden="true" focusable="false">
        <path className="archive-pinbar-thread-shade" d="M5 0C5 14 17 18 15 34" />
        <path className="archive-pinbar-thread-line" d="M5 0C5 14 17 18 15 34" />
        <circle className="archive-pinbar-bead-shade" cx="16" cy="37.5" r="4.4" />
        <circle className="archive-pinbar-bead" cx="15" cy="35" r="4.4" />
        <circle className="archive-pinbar-bead-shine" cx="13.6" cy="33.5" r="1.3" />
      </svg>
      <div className="archive-pinbar-row">
        <span className="archive-pinbar-section">{t("archiveEyebrowFull")}</span>
        <span className="archive-pinbar-title">{t("archiveTitle")}</span>
        <Link className="archive-pinbar-link" href={href("/products")}>
          <span>{t("allWorks")}</span>
          <ArrowIcon aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
