"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ACCOUNT_BANNER_PHOTO, accountTears } from "../const";

/** A kiln-green paper band torn at both edges: a handmade mug and one hand-lettered line. */
export function AccountBanner() {
  const { t } = useLocale();
  return (
    <figure className="account-banner">
      <svg className="account-banner-tear is-top" viewBox={accountTears.viewBox} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={accountTears.top} />
      </svg>
      <div className="account-banner-body">
        <div className="account-banner-photo">
          <Image src={ACCOUNT_BANNER_PHOTO} alt="" fill sizes="(max-width: 900px) 50vw, 360px" />
        </div>
        <figcaption className="account-banner-line">{t("accountBannerLine")}</figcaption>
        <svg className="account-banner-thread" viewBox="0 0 12 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M6 0C3 22 9 38 6 60S2 98 7 120" pathLength={1} />
        </svg>
      </div>
      <svg className="account-banner-tear is-bottom" viewBox={accountTears.viewBox} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={accountTears.bottom} />
      </svg>
    </figure>
  );
}
